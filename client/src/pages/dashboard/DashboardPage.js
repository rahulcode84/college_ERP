import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { USER_ROLES } from '../../utils/constants';

const DashboardPage = () => {
  const { user, hasRole } = useAuth();

  // Redirect to role-specific dashboard
  if (hasRole(USER_ROLES.STUDENT)) {
    return <Navigate to="/student/dashboard" replace />;
  }

  if (hasRole(USER_ROLES.FACULTY)) {
    return <Navigate to="/faculty/dashboard" replace />;
  }

  if (hasRole(USER_ROLES.ADMIN)) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Fallback dashboard for other roles
  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.fullName}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Role: <span className="capitalize font-medium">{user?.role}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Getting Started
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Complete your profile and explore the features available to you.
            </p>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Quick Actions
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Access frequently used features and shortcuts.
            </p>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Recent Activity
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              View your recent actions and updates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;