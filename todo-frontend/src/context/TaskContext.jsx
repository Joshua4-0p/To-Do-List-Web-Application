// src/context/TaskContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";

const TaskContext = createContext();

export const useTask = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error("useTask must be used within a TaskProvider");
  }
  return context;
};

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    priority: "",
    status: "",
    sortBy: "dueDate",
  });
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchTasks();
    }
  }, [isAuthenticated, filters]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.priority) params.append("priority", filters.priority);
      if (filters.status) params.append("status", filters.status);
      if (filters.sortBy) params.append("sortBy", filters.sortBy);

      const response = await axios.get(`/api/tasks?${params}`);
      setTasks(response.data.tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (taskData) => {
    try {
      const response = await axios.post("/api/tasks", taskData);
      setTasks((prev) => [response.data.task, ...prev]);
      return { success: true, task: response.data.task };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Failed to create task",
      };
    }
  };

  const updateTask = async (taskId, taskData) => {
    try {
      const response = await axios.put(`/api/tasks/${taskId}`, taskData);
      setTasks((prev) =>
        prev.map((task) => (task._id === taskId ? response.data.task : task))
      );
      return { success: true, task: response.data.task };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Failed to update task",
      };
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await axios.delete(`/api/tasks/${taskId}`);
      setTasks((prev) => prev.filter((task) => task._id !== taskId));
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Failed to delete task",
      };
    }
  };

  const toggleTaskComplete = async (taskId, isCompleted) => {
    try {
      const response = await axios.patch(`/api/tasks/${taskId}/toggle`, {
        is_completed: isCompleted,
      });
      setTasks((prev) =>
        prev.map((task) => (task._id === taskId ? response.data.task : task))
      );
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Failed to update task",
      };
    }
  };

  const toggleSubtaskComplete = async (taskId, subtaskId, isCompleted) => {
    try {
      const response = await axios.patch(
        `/api/tasks/${taskId}/subtasks/${subtaskId}/toggle`,
        {
          is_completed: isCompleted,
        }
      );
      setTasks((prev) =>
        prev.map((task) => (task._id === taskId ? response.data.task : task))
      );
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Failed to update subtask",
      };
    }
  };

  const value = {
    tasks,
    loading,
    filters,
    setFilters,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskComplete,
    toggleSubtaskComplete,
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};
