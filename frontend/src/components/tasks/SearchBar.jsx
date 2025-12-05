import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

const SearchBar = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    priority: searchParams.get('priority') || '',
    assignee: searchParams.get('assignee') || '',
    dateFrom: searchParams.get('dateFrom') || '',
    dateTo: searchParams.get('dateTo') || ''
  });
  const [recentSearches, setRecentSearches] = useState([]);
  const searchRef = useRef(null);
  const debounceTimer = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (query.length >= 2) {
      debounceTimer.current = setTimeout(() => {
        fetchSuggestions();
      }, 300);
    } else {
      setSuggestions([]);
    }

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/tasks/autocomplete`,
        {
          params: { q: query },
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setSuggestions(response.data.suggestions || []);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    }
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });

    setSearchParams(params);

    const searchEntry = { query, filters, timestamp: Date.now() };
    const updated = [searchEntry, ...recentSearches.filter(s => s.query !== query)].slice(0, 10);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));

    navigate(`/tasks/search?${params.toString()}`);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (suggestion) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    setTimeout(() => handleSearch(), 100);
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      priority: '',
      assignee: '',
      dateFrom: '',
      dateTo: ''
    });
    setSearchParams(new URLSearchParams());
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div ref={searchRef} className="relative">
        <div className="flex items-center bg-white rounded-lg shadow-sm border border-gray-300 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 ml-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={() => query.length >= 2 && setShowSuggestions(true)}
            placeholder="Search tasks..."
            className="flex-1 px-3 py-2 outline-none rounded-lg"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-2">
              <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            </button>
          )}
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700"
          >
            Search
          </button>
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-60 overflow-y-auto">
            {suggestions.map((suggestion, idx) => (
              <div
                key={idx}
                onClick={() => selectSuggestion(suggestion)}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
              >
                {suggestion}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="px-3 py-1 border border-gray-300 rounded-md text-sm"
        >
          <option value="">All Status</option>
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="in-review">In Review</option>
          <option value="completed">Completed</option>
        </select>

        <select
          value={filters.priority}
          onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
          className="px-3 py-1 border border-gray-300 rounded-md text-sm"
        >
          <option value="">All Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>

        <input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
          className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          placeholder="From date"
        />

        <input
          type="date"
          value={filters.dateTo}
          onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
          className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          placeholder="To date"
        />

        {Object.values(filters).some(v => v) && (
          <button
            onClick={clearFilters}
            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
          >
            Clear filters
          </button>
        )}
      </div>

      {recentSearches.length > 0 && !query && (
        <div className="mt-4">
          <p className="text-sm text-gray-500 mb-2">Recent searches</p>
          <div className="flex flex-wrap gap-2">
            {recentSearches.slice(0, 5).map((search, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQuery(search.query);
                  setFilters(search.filters);
                }}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm"
              >
                {search.query}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
