import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DependencyChain = ({ taskId }) => {
  const [dependencies, setDependencies] = useState({ dependsOn: [], blocking: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDependencies();
  }, [taskId]);

  const fetchDependencies = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/tasks/${taskId}/dependencies`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDependencies(response.data);
    } catch (error) {
      console.error('Failed to fetch dependencies:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeDependency = async (depId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/tasks/${taskId}/dependencies/${depId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchDependencies();
    } catch (error) {
      console.error('Failed to remove dependency:', error);
    }
  };

  if (loading) {
    return <div className="animate-pulse h-20 bg-gray-100 rounded"></div>;
  }

  return (
    <div className="space-y-4">
      {dependencies.dependsOn.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Blocked by</h4>
          <div className="space-y-2">
            {dependencies.dependsOn.map((dep) => (
              <div key={dep._id} className="flex items-center justify-between p-2 bg-yellow-50 rounded border border-yellow-200">
                <div>
                  <span className="text-sm">{dep.task.title}</span>
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded ${
                    dep.task.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100'
                  }`}>
                    {dep.task.status}
                  </span>
                </div>
                <button
                  onClick={() => removeDependency(dep.task._id)}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {dependencies.blocking.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Blocking</h4>
          <div className="space-y-2">
            {dependencies.blocking.map((task) => (
              <div key={task._id} className="p-2 bg-blue-50 rounded border border-blue-200">
                <span className="text-sm">{task.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {dependencies.dependsOn.length === 0 && dependencies.blocking.length === 0 && (
        <p className="text-sm text-gray-500">No dependencies</p>
      )}
    </div>
  );
};

export default DependencyChain;
