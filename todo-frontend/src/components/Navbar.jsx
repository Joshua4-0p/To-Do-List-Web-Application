// src/components/Navbar.jsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { CheckSquare, User, Bell, LogOut, Plus } from "lucide-react";

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white shadow-lg border-b">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link
            to="/"
            className="flex items-center space-x-2 text-xl font-bold text-primary-600"
          >
            <CheckSquare className="h-6 w-6" />
            <span>TaskMaster</span>
          </Link>

          {isAuthenticated ? (
            <div className="flex items-center space-x-4">
              <Link
                to="/create-task"
                className="btn-primary flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>New Task</span>
              </Link>

              <Link
                to="/notifications"
                className={`p-2 rounded-lg transition-colors ${
                  isActive("/notifications")
                    ? "bg-primary-100 text-primary-600"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Bell className="h-5 w-5" />
              </Link>

              <Link
                to="/profile"
                className={`p-2 rounded-lg transition-colors ${
                  isActive("/profile")
                    ? "bg-primary-100 text-primary-600"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <User className="h-5 w-5" />
              </Link>

              <button
                onClick={logout}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>

              <span className="text-sm text-gray-600">
                Welcome, {user?.email}
              </span>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-600 hover:text-primary-600 transition-colors"
              >
                Login
              </Link>
              <Link to="/register" className="btn-primary">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;