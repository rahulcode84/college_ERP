import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  AcademicCapIcon,
  ClipboardDocumentListIcon,
  CurrencyDollarIcon,
  BookOpenIcon,
  CalendarIcon,
  BellIcon,
  ChartBarIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';

const StudentDashboard = () => {
  const { user, profile } = useAuth();

  const quickActions = [
    {
      name: 'View Attendance',
      href: '/student/attendance',
      icon: ClipboardDocumentListIcon,
      color: 'bg-blue-500 hover:bg-blue-600',
      description: 'Check your attendance records'
    },
    {
      name: 'View Grades',
      href: '/student/grades',
      icon: AcademicCapIcon,
      color: 'bg-green-500 hover:bg-green-600',
      description: 'View your academic performance'
    },
    {
      name: 'Fee Status',
      href: '/student/fees',
      icon: CurrencyDollarIcon,
      color: 'bg-yellow-500 hover:bg-yellow-600',
      description: 'Check fee payments and dues'
    },
    {
      name: 'Library',
      href: '/student/library',
      icon: BookOpenIcon,
      color: 'bg-purple-500 hover:bg-purple-600',
      description: 'Browse books and borrowing history'
    },
    {
      name: 'Timetable',
      href: '/student/timetable',
      icon: CalendarIcon,
      color: 'bg-indigo-500 hover:bg-indigo-600',
      description: 'View your class schedule'
    },
    {
      name: 'Profile',
      href: '/student/profile',
      icon: UserCircleIcon,
      color: 'bg-gray-500 hover:bg-gray-600',
      description: 'Update your profile information'
    }
  ];

  const statsCards = [
    {
      title: 'Current CGPA',
      value: profile?.cgpa || '0.0',
      suffix: '/10',
      icon: ChartBarIcon,
      color: 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-400'
    },
    {
      title: 'Attendance',
      value: '92',
      suffix: '%',
      icon: ClipboardDocumentListIcon,
      color: 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-400'
    },
    {
      title: 'Current Semester',
      value: profile?.semester || '1',
      suffix: '',
      icon: AcademicCapIcon,
      color: 'text-purple-600 bg-purple-100 dark:bg-purple-900 dark:text-purple-400'
    },
    {
      title: 'Total Credits',
      value: profile?.totalCredits || '0',
      suffix: '',
      icon: BookOpenIcon,
      color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-400'
    }
  ];

  const recentNotices = [
    {
      title: 'Mid-Semester Examination Schedule',
      date: '2 days ago',
      type: 'Examination',
      priority: 'High'
    },
    {
      title: 'Library New Books Arrival',
      date: '1 week ago',
      type: 'Academic',
      priority: 'Medium'
    },
    {
      title: 'Fee Payment Due Date Extended',
      date: '2 weeks ago',
      type: 'Administrative',
      priority: 'High'
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Student ID: {profile?.studentId} | {profile?.department?.name} | Semester {profile?.semester}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((stat) => (
          <div key={stat.title} className="card p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                  <span className="text-sm font-normal text-gray-500">{stat.suffix}</span>
                </p>
              </div>
            </div>
          </div>
        ))}
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

        {/* Recent Notices */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Recent Notices
            </h2>
            <BellIcon className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {recentNotices.map((notice, index) => (
              <div key={index} className="card p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      {notice.title}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {notice.date} • {notice.type}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    notice.priority === 'High' 
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  }`}>
                    {notice.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <Link
            to="/student/notices"
            className="block text-center text-primary-600 dark:text-primary-400 hover:text-primary-500 mt-4 text-sm font-medium"
          >
            View All Notices
          </Link>
        </div>
      </div>

      {/* Academic Progress Section */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          Academic Progress
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Attendance Chart */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Attendance Overview
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Database Systems</span>
                <span className="text-sm font-medium">95%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '95%' }}></div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Computer Networks</span>
                <span className="text-sm font-medium">88%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '88%' }}></div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Software Engineering</span>
                <span className="text-sm font-medium">92%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '92%' }}></div>
              </div>
            </div>
          </div>

          {/* Recent Grades */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Recent Grades
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Database Assignment 3</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Submitted 3 days ago</p>
                </div>
                <span className="badge-success">A</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Networks Quiz 2</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Completed 1 week ago</p>
                </div>
                <span className="badge-success">B+</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">SE Project Milestone</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Submitted 2 weeks ago</p>
                </div>
                <span className="badge-success">A+</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;