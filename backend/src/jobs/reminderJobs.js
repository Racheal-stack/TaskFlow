const cron = require('node-cron');
const Task = require('../models/Task');
const User = require('../models/User');
const { sendDueDateReminderEmail } = require('../services/emailService');

const startReminderJobs = () => {
  cron.schedule('0 * * * *', async () => {
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in1Hour = new Date(now.getTime() + 60 * 60 * 1000);

    const tasks24h = await Task.find({
      dueDate: { $gte: now, $lte: in24Hours },
      status: { $nin: ['completed', 'done'] }
    }).populate('assignees.user');

    for (const task of tasks24h) {
      for (const assignee of task.assignees) {
        const user = assignee.user;
        if (user.emailPreferences?.dueDateReminders !== false) {
          await sendDueDateReminderEmail(user, task, 24);
        }
      }
    }

    const tasks1h = await Task.find({
      dueDate: { $gte: now, $lte: in1Hour },
      status: { $nin: ['completed', 'done'] }
    }).populate('assignees.user');

    for (const task of tasks1h) {
      for (const assignee of task.assignees) {
        const user = assignee.user;
        if (user.emailPreferences?.dueDateReminders !== false) {
          await sendDueDateReminderEmail(user, task, 1);
        }
      }
    }
  });
};

module.exports = { startReminderJobs };
