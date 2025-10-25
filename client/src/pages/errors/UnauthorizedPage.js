import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const UnauthorizedPage = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 dark:bg-red-900 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m0 0v2m0-2h2m-2 0H8m13-9a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            You don't have permission to access this page.
          </p>
          
          {user && (
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Current role: <span className="font-medium capitalize">{user.role}</span>
            </p>
          )}
        </div>

        <div className="space-y-4">
          <Link
            to="/dashboard"
            className="block w-full btn-primary"
          >
            Go to Dashboard
          </Link>
          <Link
            to="/"
            className="block w-full btn-outline"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;