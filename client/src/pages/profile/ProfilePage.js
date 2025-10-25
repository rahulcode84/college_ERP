import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { USER_ROLES } from '../../utils/constants';

const ProfilePage = () => {
  const { hasRole } = useAuth();

  // Redirect to role-specific profile
  if (hasRole(USER_ROLES.STUDENT)) {
    return <Navigate to="/student/profile" replace />;
  }

  if (hasRole(USER_ROLES.FACULTY)) {
    return <Navigate to="/faculty/profile" replace />;
  }

  if (hasRole(USER_ROLES.ADMIN)) {
    return <Navigate to="/admin/profile" replace />;
  }

  // Fallback profile page
  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Profile
        </h1>
        <div className="card p-6">
          <p className="text-gray-600 dark:text-gray-400">
            Profile management for your role is not yet implemented.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;