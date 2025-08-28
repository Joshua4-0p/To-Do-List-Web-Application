// src/pages/Dashboard.jsx
import React, { useState } from "react";
import { useTask } from "../context/TaskContext";
import TaskCard from "../components/TaskCard";
import TaskFilters from "../components/TaskFilters";
import { Plus, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const { tasks, loading } = useTask();
  const [viewMode, setViewMode] = useState("all"); // all, completed, pending

  const getFilteredTasks = () => {
    switch (viewMode) {
      case "completed":
        return tasks.filter((task) => task.is_completed);
      case "pending":
        return tasks.filter((task) => !task.is_completed);
      default:
        return tasks;
    }
  };

  const getTaskStats = () => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((task) => task.is_completed).length;
    const pendingTasks = totalTasks - completedTasks;
    const overdueTasks = tasks.filter(
      (task) =>
        !task.is_completed &&
        task.due_date &&
        new Date(task.due_date) < new Date()
    ).length;

    return { totalTasks, completedTasks, pendingTasks, overdueTasks };
  };

  const stats = getTaskStats();
  const filteredTasks = getFilteredTasks();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Task Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your tasks efficiently</p>
        </div>
        <Link
          to="/create-task"
          className="btn-primary flex items-center space-x-2 mt-4 sm:mt-0"
        >
          <Plus className="h-4 w-4" />
          <span>New Task</span>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalTasks}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.completedTasks}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.pendingTasks}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.overdueTasks}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <TaskFilters />

      {/* View Mode Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: "all", label: "All Tasks", count: stats.totalTasks },
              { id: "pending", label: "Pending", count: stats.pendingTasks },
              {
                id: "completed",
                label: "Completed",
                count: stats.completedTasks,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setViewMode(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  viewMode === tab.id
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {viewMode === "completed"
              ? "No completed tasks"
              : viewMode === "pending"
              ? "No pending tasks"
              : "No tasks yet"}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {viewMode === "all"
              ? "Get started by creating your first task."
              : `Switch to a different view to see other tasks.`}
          </p>
          {viewMode === "all" && (
            <div className="mt-6">
              <Link to="/create-task" className="btn-primary">
                Create Your First Task
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredTasks.map((task) => (
            <TaskCard key={task._id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
