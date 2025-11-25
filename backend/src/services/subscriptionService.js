const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');
const Workspace = require('../models/Workspace');

class SubscriptionService {
  constructor() {
    this.plans = {
      free: {
        name: 'Free',
        price: 0,
        maxProjects: 3,
        maxMembers: 5,
        maxStorage: 100 * 1024 * 1024, // 100MB
        features: ['Basic task management', 'Up to 5 team members', '100MB storage']
      },
      pro: {
        name: 'Pro',
        price: 1999, // $19.99 in cents
        maxProjects: 50,
        maxMembers: 25,
        maxStorage: 10 * 1024 * 1024 * 1024, // 10GB
        features: ['Unlimited projects', 'Up to 25 team members', '10GB storage', 'Advanced analytics', 'Priority support']
      },
      enterprise: {
        name: 'Enterprise',
        price: 4999, // $49.99 in cents
        maxProjects: -1, // Unlimited
        maxMembers: -1, // Unlimited
        maxStorage: 100 * 1024 * 1024 * 1024, // 100GB
        features: ['Unlimited everything', 'Advanced security', 'Custom integrations', 'Dedicated support', 'SLA guarantee']
      }
    };
  }

  // Create Stripe customer
  async createCustomer(user, workspace) {
    try {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: user._id.toString(),
          workspaceId: workspace._id.toString()
        }
      });

      return customer;
    } catch (error) {
      console.error('Failed to create Stripe customer:', error);
      throw new Error('Failed to create customer');
    }
  }

  // Create subscription
  async createSubscription(workspaceId, planType, customerId, paymentMethodId) {
    try {
      if (!this.plans[planType]) {
        throw new Error('Invalid plan type');
      }

      const plan = this.plans[planType];
      
      // For free plan, no Stripe subscription needed
      if (planType === 'free') {
        await this.updateWorkspaceSubscription(workspaceId, {
          plan: 'free',
          status: 'active',
          currentPeriodEnd: null,
          customerId: null,
          subscriptionId: null
        });
        
        return { success: true, plan: 'free' };
      }

      // Create price in Stripe if not exists
      const price = await this.getOrCreatePrice(planType);

      // Attach payment method to customer
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId
      });

      // Set as default payment method
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      });

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: price.id }],
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          workspaceId: workspaceId.toString(),
          planType
        }
      });

      // Update workspace subscription info
      await this.updateWorkspaceSubscription(workspaceId, {
        plan: planType,
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        customerId: customerId,
        subscriptionId: subscription.id
      });

      return {
        success: true,
        subscription,
        clientSecret: subscription.latest_invoice.payment_intent.client_secret
      };
    } catch (error) {
      console.error('Failed to create subscription:', error);
      throw error;
    }
  }

  // Get or create Stripe price for plan
  async getOrCreatePrice(planType) {
    try {
      const plan = this.plans[planType];
      
      // List existing prices to see if one already exists
      const prices = await stripe.prices.list({
        product: process.env.STRIPE_PRODUCT_ID || await this.getOrCreateProduct(),
        active: true
      });

      const existingPrice = prices.data.find(price => 
        price.unit_amount === plan.price &&
        price.recurring?.interval === 'month'
      );

      if (existingPrice) {
        return existingPrice;
      }

      // Create new price
      const price = await stripe.prices.create({
        unit_amount: plan.price,
        currency: 'usd',
        recurring: { interval: 'month' },
        product: process.env.STRIPE_PRODUCT_ID || await this.getOrCreateProduct(),
        nickname: `${plan.name} Monthly`
      });

      return price;
    } catch (error) {
      console.error('Failed to get/create price:', error);
      throw error;
    }
  }

  // Get or create Stripe product
  async getOrCreateProduct() {
    try {
      if (process.env.STRIPE_PRODUCT_ID) {
        return process.env.STRIPE_PRODUCT_ID;
      }

      const product = await stripe.products.create({
        name: 'TaskFlow Subscription',
        description: 'TaskFlow team productivity and project management platform'
      });

      console.log('Created Stripe product:', product.id);
      return product.id;
    } catch (error) {
      console.error('Failed to create product:', error);
      throw error;
    }
  }

  // Update workspace subscription
  async updateWorkspaceSubscription(workspaceId, subscriptionData) {
    try {
      const workspace = await Workspace.findByIdAndUpdate(
        workspaceId,
        {
          subscription: subscriptionData,
          limits: this.plans[subscriptionData.plan]
        },
        { new: true }
      );

      return workspace;
    } catch (error) {
      console.error('Failed to update workspace subscription:', error);
      throw error;
    }
  }

  // Cancel subscription
  async cancelSubscription(workspaceId) {
    try {
      const workspace = await Workspace.findById(workspaceId);
      if (!workspace || !workspace.subscription.subscriptionId) {
        throw new Error('No active subscription found');
      }

      // Cancel at period end to allow access until billing cycle ends
      const subscription = await stripe.subscriptions.update(
        workspace.subscription.subscriptionId,
        { cancel_at_period_end: true }
      );

      // Update workspace
      await Workspace.findByIdAndUpdate(workspaceId, {
        'subscription.status': 'canceled',
        'subscription.cancelAtPeriodEnd': true
      });

      return { success: true, subscription };
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      throw error;
    }
  }

  // Reactivate subscription
  async reactivateSubscription(workspaceId) {
    try {
      const workspace = await Workspace.findById(workspaceId);
      if (!workspace || !workspace.subscription.subscriptionId) {
        throw new Error('No subscription found');
      }

      const subscription = await stripe.subscriptions.update(
        workspace.subscription.subscriptionId,
        { cancel_at_period_end: false }
      );

      await Workspace.findByIdAndUpdate(workspaceId, {
        'subscription.status': subscription.status,
        'subscription.cancelAtPeriodEnd': false
      });

      return { success: true, subscription };
    } catch (error) {
      console.error('Failed to reactivate subscription:', error);
      throw error;
    }
  }

  // Handle Stripe webhook events
  async handleWebhook(event) {
    try {
      switch (event.type) {
        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;
        
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;
        
        case 'subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object);
          break;
        
        case 'subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;
        
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error('Webhook handling error:', error);
      throw error;
    }
  }

  async handlePaymentSucceeded(invoice) {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    const workspaceId = subscription.metadata.workspaceId;
    
    await Workspace.findByIdAndUpdate(workspaceId, {
      'subscription.status': 'active',
      'subscription.currentPeriodEnd': new Date(subscription.current_period_end * 1000)
    });
  }

  async handlePaymentFailed(invoice) {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    const workspaceId = subscription.metadata.workspaceId;
    
    await Workspace.findByIdAndUpdate(workspaceId, {
      'subscription.status': 'past_due'
    });
  }

  async handleSubscriptionUpdated(subscription) {
    const workspaceId = subscription.metadata.workspaceId;
    
    await Workspace.findByIdAndUpdate(workspaceId, {
      'subscription.status': subscription.status,
      'subscription.currentPeriodEnd': new Date(subscription.current_period_end * 1000)
    });
  }

  async handleSubscriptionDeleted(subscription) {
    const workspaceId = subscription.metadata.workspaceId;
    
    await Workspace.findByIdAndUpdate(workspaceId, {
      'subscription.status': 'canceled',
      'subscription.plan': 'free',
      'limits': this.plans.free
    });
  }

  // Check workspace limits
  async checkLimits(workspaceId, resourceType, currentCount) {
    try {
      const workspace = await Workspace.findById(workspaceId);
      if (!workspace) {
        throw new Error('Workspace not found');
      }

      const limits = workspace.limits || this.plans.free;
      
      switch (resourceType) {
        case 'projects':
          return limits.maxProjects === -1 || currentCount < limits.maxProjects;
        case 'members':
          return limits.maxMembers === -1 || currentCount < limits.maxMembers;
        case 'storage':
          return limits.maxStorage === -1 || currentCount < limits.maxStorage;
        default:
          return true;
      }
    } catch (error) {
      console.error('Failed to check limits:', error);
      return false;
    }
  }

  // Get usage statistics
  async getUsageStats(workspaceId) {
    try {
      const workspace = await Workspace.findById(workspaceId)
        .populate('members.user', 'name email');
      
      const Project = require('../models/Project');
      const projects = await Project.countDocuments({ workspace: workspaceId });
      
      const members = workspace.members.length;
      
      // Calculate storage usage (you'd implement this based on your file storage)
      const storageUsed = 0; // Placeholder
      
      return {
        projects: {
          current: projects,
          limit: workspace.limits?.maxProjects || this.plans.free.maxProjects
        },
        members: {
          current: members,
          limit: workspace.limits?.maxMembers || this.plans.free.maxMembers
        },
        storage: {
          current: storageUsed,
          limit: workspace.limits?.maxStorage || this.plans.free.maxStorage
        }
      };
    } catch (error) {
      console.error('Failed to get usage stats:', error);
      throw error;
    }
  }
}

module.exports = new SubscriptionService();