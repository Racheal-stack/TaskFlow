import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    performSearch();
  }, [searchParams]);

  const performSearch = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = {};
      searchParams.forEach((value, key) => {
        params[key] = value;
      });

      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/tasks/search`,
        {
          params,
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setResults(response.data.results || []);
      setPagination(response.data.pagination || {});
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const highlightText = (text, query) => {
    if (!query) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() ? 
        <mark key={i} className="bg-yellow-200">{part}</mark> : part
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No tasks found matching your criteria</p>
      </div>
    );
  }

  const query = searchParams.get('q') || '';

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600">
        Found {pagination.total} results
      </div>

      {results.map((task) => (
        <div key={task._id} className="bg-white p-4 rounded-lg shadow border border-gray-200 hover:border-blue-400 cursor-pointer">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900">
                {highlightText(task.title, query)}
              </h3>
              {task.description && (
                <p className="mt-1 text-sm text-gray-600">
                  {highlightText(task.description, query)}
                </p>
              )}
              <div className="mt-2 flex items-center gap-2">
                <span className={`px-2 py-1 text-xs rounded ${
                  task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                  task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                  task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {task.priority}
                </span>
                <span className={`px-2 py-1 text-xs rounded ${
                  task.status === 'completed' ? 'bg-green-100 text-green-800' :
                  task.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {task.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}

      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => {
                const params = new URLSearchParams(searchParams);
                params.set('page', page);
                window.location.search = params.toString();
              }}
              className={`px-3 py-1 rounded ${
                page === pagination.page ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchResults;
