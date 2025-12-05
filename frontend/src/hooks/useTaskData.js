import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export const useTaskData = (taskId) => {
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTask = useCallback(async () => {
    if (!taskId) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/tasks/${taskId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTask(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  const updateTask = async (updates) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/tasks/${taskId}`,
        { ...updates, version: task.version },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTask(response.data);
      return { success: true };
    } catch (err) {
      if (err.response?.status === 409) {
        return { conflict: true, currentData: err.response.data.currentData };
      }
      return { error: err.message };
    }
  };

  return { task, loading, error, updateTask, refetch: fetchTask };
};

export const useTaskComments = (taskId) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchComments = useCallback(async () => {
    if (!taskId) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/tasks/${taskId}/comments`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComments(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const addComment = async (text) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/tasks/${taskId}/comments`,
        { text },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchComments();
    } catch (err) {
      console.error('Failed to add comment:', err);
    }
  };

  return { comments, loading, addComment, refetch: fetchComments };
};
