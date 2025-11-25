const mongoose = require('mongoose');

class AnalyticsService {
  constructor() {
    this.eventTypes = {
      USER_LOGIN: 'user_login',
      USER_LOGOUT: 'user_logout',
      PROJECT_CREATED: 'project_created',
      PROJECT_VIEWED: 'project_viewed',
      TASK_CREATED: 'task_created',
      TASK_COMPLETED: 'task_completed',
      TASK_UPDATED: 'task_updated',
      WORKSPACE_CREATED: 'workspace_created',
      MEMBER_INVITED: 'member_invited',
      FILE_UPLOADED: 'file_uploaded'
    };
  }

  // Track user activity event
  async trackEvent(eventType, userId, workspaceId = null, metadata = {}) {
    try {
      // For now, we'll store events in a simple collection
      // In production, you might want to use a dedicated analytics service
      const Event = mongoose.model('AnalyticsEvent', new mongoose.Schema({
        eventType: String,
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' },
        metadata: mongoose.Schema.Types.Mixed,
        timestamp: { type: Date, default: Date.now },
        userAgent: String,
        ipAddress: String
      }));

      await Event.create({
        eventType,
        userId,
        workspaceId,
        metadata,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }

  // Get workspace activity summary
  async getWorkspaceAnalytics(workspaceId, timeRange = '30d') {
    try {
      const days = parseInt(timeRange.replace('d', ''));
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const Event = mongoose.model('AnalyticsEvent');
      
      const analytics = await Event.aggregate([
        {
          $match: {
            workspaceId: new mongoose.Types.ObjectId(workspaceId),
            timestamp: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              eventType: '$eventType',
              date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }
            },
            count: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: '$_id.eventType',
            dailyData: {
              $push: {
                date: '$_id.date',
                count: '$count'
              }
            },
            totalCount: { $sum: '$count' }
          }
        }
      ]);

      return analytics;
    } catch (error) {
      console.error('Failed to get workspace analytics:', error);
      return [];
    }
  }

  // Get user productivity metrics
  async getUserProductivity(userId, workspaceId, timeRange = '30d') {
    try {
      const days = parseInt(timeRange.replace('d', ''));
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get task completion data
      const Task = mongoose.model('Task');
      const taskMetrics = await Task.aggregate([
        {
          $match: {
            assignee: new mongoose.Types.ObjectId(userId),
            updatedAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              status: '$status',
              date: { $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' } }
            },
            count: { $sum: 1 }
          }
        }
      ]);

      // Get activity events
      const Event = mongoose.model('AnalyticsEvent');
      const activityMetrics = await Event.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            workspaceId: new mongoose.Types.ObjectId(workspaceId),
            timestamp: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
            eventCount: { $sum: 1 },
            events: { $push: '$eventType' }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      return {
        taskMetrics,
        activityMetrics
      };
    } catch (error) {
      console.error('Failed to get user productivity:', error);
      return { taskMetrics: [], activityMetrics: [] };
    }
  }

  // Get project progress analytics
  async getProjectAnalytics(projectId) {
    try {
      const Task = mongoose.model('Task');
      
      // Task status distribution
      const statusDistribution = await Task.aggregate([
        { $match: { project: new mongoose.Types.ObjectId(projectId) } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);

      // Task completion over time
      const completionTrend = await Task.aggregate([
        {
          $match: {
            project: new mongoose.Types.ObjectId(projectId),
            status: 'completed'
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' } },
            completed: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      // Task assignment distribution
      const assigneeDistribution = await Task.aggregate([
        { $match: { project: new mongoose.Types.ObjectId(projectId) } },
        {
          $lookup: {
            from: 'users',
            localField: 'assignee',
            foreignField: '_id',
            as: 'assigneeInfo'
          }
        },
        {
          $group: {
            _id: '$assignee',
            name: { $first: '$assigneeInfo.name' },
            taskCount: { $sum: 1 },
            completed: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            }
          }
        }
      ]);

      return {
        statusDistribution,
        completionTrend,
        assigneeDistribution
      };
    } catch (error) {
      console.error('Failed to get project analytics:', error);
      return {};
    }
  }

  // Get team performance metrics
  async getTeamAnalytics(workspaceId, timeRange = '30d') {
    try {
      const days = parseInt(timeRange.replace('d', ''));
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const Task = mongoose.model('Task');
      
      // Team productivity metrics
      const teamMetrics = await Task.aggregate([
        {
          $lookup: {
            from: 'projects',
            localField: 'project',
            foreignField: '_id',
            as: 'projectInfo'
          }
        },
        {
          $match: {
            'projectInfo.workspace': new mongoose.Types.ObjectId(workspaceId),
            updatedAt: { $gte: startDate }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'assignee',
            foreignField: '_id',
            as: 'assigneeInfo'
          }
        },
        {
          $group: {
            _id: '$assignee',
            name: { $first: { $arrayElemAt: ['$assigneeInfo.name', 0] } },
            totalTasks: { $sum: 1 },
            completedTasks: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            inProgressTasks: {
              $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] }
            },
            avgCompletionTime: {
              $avg: {
                $cond: [
                  { $eq: ['$status', 'completed'] },
                  { $subtract: ['$updatedAt', '$createdAt'] },
                  null
                ]
              }
            }
          }
        },
        {
          $addFields: {
            completionRate: {
              $cond: [
                { $gt: ['$totalTasks', 0] },
                { $divide: ['$completedTasks', '$totalTasks'] },
                0
              ]
            }
          }
        }
      ]);

      return teamMetrics;
    } catch (error) {
      console.error('Failed to get team analytics:', error);
      return [];
    }
  }

  // Generate insights and recommendations
  async generateInsights(workspaceId) {
    try {
      const insights = [];

      // Get recent analytics
      const analytics = await this.getWorkspaceAnalytics(workspaceId, '7d');
      const teamMetrics = await this.getTeamAnalytics(workspaceId, '30d');

      // Analyze task completion trends
      const taskEvents = analytics.find(a => a._id === this.eventTypes.TASK_COMPLETED);
      if (taskEvents && taskEvents.totalCount > 0) {
        const avgDailyCompletions = taskEvents.totalCount / 7;
        
        if (avgDailyCompletions > 5) {
          insights.push({
            type: 'positive',
            title: 'High Productivity',
            message: `Your team is completing an average of ${Math.round(avgDailyCompletions)} tasks per day. Great work!`
          });
        } else if (avgDailyCompletions < 2) {
          insights.push({
            type: 'suggestion',
            title: 'Consider Task Management',
            message: 'Task completion rate is low. Consider breaking down large tasks or checking if team members need support.'
          });
        }
      }

      // Analyze team performance
      if (teamMetrics.length > 0) {
        const lowPerformers = teamMetrics.filter(member => member.completionRate < 0.5);
        if (lowPerformers.length > 0) {
          insights.push({
            type: 'attention',
            title: 'Team Support Needed',
            message: `${lowPerformers.length} team member${lowPerformers.length > 1 ? 's' : ''} may need additional support or task rebalancing.`
          });
        }
      }

      return insights;
    } catch (error) {
      console.error('Failed to generate insights:', error);
      return [];
    }
  }

  // Export data for external analytics tools
  async exportData(workspaceId, timeRange = '30d', format = 'json') {
    try {
      const days = parseInt(timeRange.replace('d', ''));
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const Event = mongoose.model('AnalyticsEvent');
      const events = await Event.find({
        workspaceId: new mongoose.Types.ObjectId(workspaceId),
        timestamp: { $gte: startDate }
      }).lean();

      if (format === 'csv') {
        // Convert to CSV format
        const headers = ['timestamp', 'eventType', 'userId', 'metadata'];
        const csvData = events.map(event => [
          event.timestamp.toISOString(),
          event.eventType,
          event.userId,
          JSON.stringify(event.metadata || {})
        ]);
        
        return {
          headers,
          data: csvData,
          format: 'csv'
        };
      }

      return {
        data: events,
        format: 'json'
      };
    } catch (error) {
      console.error('Failed to export data:', error);
      return { data: [], format };
    }
  }
}

module.exports = new AnalyticsService();