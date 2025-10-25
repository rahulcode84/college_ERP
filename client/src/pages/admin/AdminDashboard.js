import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  UserGroupIcon,
  AcademicCapIcon,
  BuildingOffice2Icon,
  ChartBarIcon,
  CogIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const AdminDashboard = () => {
  const { user } = useAuth();

  const quickActions = [
    {
      name: 'Manage Users',
      href: '/admin/users',
      icon: UserGroupIcon,
      color: 'bg-blue-500 hover:bg-blue-600',
      description: 'Add, edit, and manage users'
    },
    {
      name: 'Departments',
      href: '/admin/departments',
      icon: BuildingOffice2Icon,
      color: 'bg-green-500 hover:bg-green-600',
      description: 'Manage departments and courses'
    },
    {
      name: 'Reports',
      href: '/admin/reports',
      icon: ChartBarIcon,
      color: 'bg-purple-500 hover:bg-purple-600',
      description: 'Generate system reports'
    },
    {
      name: 'Settings',
      href: '/admin/settings',
      icon: CogIcon,
      color: 'bg-gray-500 hover:bg-gray-600',
      description: 'System configuration'
    },
    {
      name: 'Analytics',
      href: '/admin/analytics',
      icon: DocumentTextIcon,
      color: 'bg-yellow-500 hover:bg-yellow-600',
      description: 'View system analytics'
    },
    {
      name: 'Finance',
      href: '/admin/finance',
      icon: CurrencyDollarIcon,
      color: 'bg-indigo-500 hover:bg-indigo-600',
      description: 'Financial management'
    }
  ];

  const statsCards = [
    {
      title: 'Total Students',
      value: '1,247',
      change: '+12%',
      changeType: 'increase',
      icon: UserGroupIcon,
      color: 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-400'
    },
    {
      title: 'Faculty Members',
      value: '89',
      change: '+3%',
      changeType: 'increase',
      icon: AcademicCapIcon,
      color: 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-400'
    },
    {
      title: 'Departments',
      value: '12',
      change: '0%',
      changeType: 'neutral',
      icon: BuildingOffice2Icon,
      color: 'text-purple-600 bg-purple-100 dark:bg-purple-900 dark:text-purple-400'
    },
    {
      title: 'Total Revenue',
      value: '₹24.2L',
      change: '+8%',
      changeType: 'increase',
      icon: CurrencyDollarIcon,
      color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-400'
    }
  ];

  const recentActivities = [
    {
      user: 'Dr. Rajesh Kumar',
      action: 'submitted grades for CS301',
      time: '2 hours ago',
      type: 'grades'
    },
    {
      user: 'Arjun Reddy',
      action: 'paid semester fees',
      time: '3 hours ago',
      type: 'payment'
    },
    {
      user: 'Prof. Priya Sharma',
      action: 'marked attendance for ECE302',
      time: '4 hours ago',
      type: 'attendance'
    },
    {
      user: 'System',
      action: 'generated monthly reports',
      time: '6 hours ago',
      type: 'system'
    }
  ];

  const systemAlerts = [
    {
      message: 'Server maintenance scheduled for tonight',
      type: 'info',
      time: '1 hour ago'
    },
    {
      message: '15 fee payments are overdue',
      type: 'warning',
      time: '2 hours ago'
    },
    {
      message: 'Database backup completed successfully',
      type: 'success',
      time: '3 hours ago'
    }
  ];

  const getChangeColor = (changeType) => {
    switch (changeType) {
      case 'increase':
        return 'text-green-600 dark:text-green-400';
      case 'decrease':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getAlertColor = (type) => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-800 dark:text-yellow-200';
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-800 dark:text-green-200';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-200';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Admin Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Welcome back, {user?.fullName}! Manage your institution efficiently.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((stat) => (
          <div key={stat.title} className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
                <p className={`text-sm ${getChangeColor(stat.changeType)}`}>
                  {stat.change} from last month
                </p>
              </div>
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* System Alerts */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          System Alerts
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {systemAlerts.map((alert, index) => (
            <div key={index} className={`p-4 border rounded-lg ${getAlertColor(alert.type)}`}>
              <div className="flex items-start">
                <ExclamationTriangleIcon className="h-5 w-5 mr-2 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{alert.message}</p>
                  <p className="text-xs opacity-75 mt-1">{alert.time}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.name}
                to={action.href}
                className="card card-hover p-6 text-center group"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg text-white transition-colors ${action.color} mb-4`}>
                  <action.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {action.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {action.description}
                </p>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activities */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Recent Activities
          </h2>
          <div className="card p-6">
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    activity.type === 'grades' ? 'bg-green-500' :
                    activity.type === 'payment' ? 'bg-blue-500' :
                    activity.type === 'attendance' ? 'bg-yellow-500' : 'bg-purple-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 dark:text-white">
                      <span className="font-medium">{activity.user}</span> {activity.action}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 text-center text-primary-600 dark:text-primary-400 hover:text-primary-500 text-sm font-medium">
              View All Activities
            </button>
          </div>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          Performance Overview
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Student Performance */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Student Performance
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Overall Attendance</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">87%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '87%' }}></div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Average CGPA</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">7.8/10</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '78%' }}></div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Fee Collection</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">92%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '92%' }}></div>
              </div>
            </div>
          </div>

          {/* System Health */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              System Health
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Server Uptime</span>
                <span className="text-sm font-medium text-green-600">99.9%</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Database Performance</span>
                <span className="text-sm font-medium text-green-600">Excellent</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Storage Used</span>
                <span className="text-sm font-medium text-yellow-600">68%</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Active Users</span>
                <span className="text-sm font-medium text-blue-600">1,156</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;