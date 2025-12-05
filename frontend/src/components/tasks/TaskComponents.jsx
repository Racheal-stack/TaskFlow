import React from 'react';

export const TaskHeader = ({ title, status, priority, onUpdate }) => {
  return (
    <div className="border-b pb-4">
      <input
        type="text"
        value={title}
        onChange={(e) => onUpdate({ title: e.target.value })}
        className="text-2xl font-bold w-full border-none outline-none"
      />
      <div className="flex gap-2 mt-2">
        <select
          value={status}
          onChange={(e) => onUpdate({ status: e.target.value })}
          className="px-3 py-1 border rounded text-sm"
        >
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="in-review">In Review</option>
          <option value="completed">Completed</option>
        </select>
        <select
          value={priority}
          onChange={(e) => onUpdate({ priority: e.target.value })}
          className="px-3 py-1 border rounded text-sm"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>
    </div>
  );
};

export const TaskDescription = ({ description, onUpdate }) => {
  return (
    <div className="py-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
      <textarea
        value={description}
        onChange={(e) => onUpdate({ description: e.target.value })}
        className="w-full px-3 py-2 border rounded resize-none"
        rows={4}
      />
    </div>
  );
};

export const TaskDates = ({ startDate, dueDate, onUpdate }) => {
  return (
    <div className="py-4 flex gap-4">
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
        <input
          type="date"
          value={startDate || ''}
          onChange={(e) => onUpdate({ startDate: e.target.value })}
          className="w-full px-3 py-2 border rounded"
        />
      </div>
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
        <input
          type="date"
          value={dueDate || ''}
          onChange={(e) => onUpdate({ dueDate: e.target.value })}
          className="w-full px-3 py-2 border rounded"
        />
      </div>
    </div>
  );
};

export const TaskAssignee = ({ assignees, onUpdate }) => {
  return (
    <div className="py-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">Assignees</label>
      <div className="flex flex-wrap gap-2">
        {assignees?.map((a, i) => (
          <div key={i} className="px-3 py-1 bg-blue-100 rounded-full text-sm">
            {a.user?.name || 'Unknown'}
          </div>
        ))}
      </div>
    </div>
  );
};
