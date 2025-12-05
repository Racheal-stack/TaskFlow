import React, { useState } from 'react';

const ConflictDialog = ({ currentData, yourData, onResolve, onCancel }) => {
  const [resolution, setResolution] = useState('current');

  const handleResolve = () => {
    if (resolution === 'current') {
      onResolve(currentData);
    } else if (resolution === 'yours') {
      onResolve({ ...currentData, ...yourData, version: currentData.version });
    } else {
      onResolve({ ...currentData, ...yourData, version: currentData.version });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
        <h3 className="text-lg font-semibold mb-4">Conflict Detected</h3>
        <p className="text-sm text-gray-600 mb-4">
          This task was modified by someone else. Choose how to resolve the conflict:
        </p>

        <div className="space-y-4">
          <label className="flex items-start space-x-3 p-3 border rounded cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              checked={resolution === 'current'}
              onChange={() => setResolution('current')}
              className="mt-1"
            />
            <div>
              <div className="font-medium">Keep current version</div>
              <div className="text-sm text-gray-500">Discard your changes</div>
            </div>
          </label>

          <label className="flex items-start space-x-3 p-3 border rounded cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              checked={resolution === 'yours'}
              onChange={() => setResolution('yours')}
              className="mt-1"
            />
            <div>
              <div className="font-medium">Use your version</div>
              <div className="text-sm text-gray-500">Overwrite with your changes</div>
            </div>
          </label>

          <label className="flex items-start space-x-3 p-3 border rounded cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              checked={resolution === 'merge'}
              onChange={() => setResolution('merge')}
              className="mt-1"
            />
            <div>
              <div className="font-medium">Merge changes</div>
              <div className="text-sm text-gray-500">Combine both versions</div>
            </div>
          </label>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleResolve}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Resolve Conflict
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConflictDialog;
