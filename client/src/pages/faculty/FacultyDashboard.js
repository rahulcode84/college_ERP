import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  AcademicCapIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  CalendarIcon,
  ChartBarIcon,
  BookOpenIcon,
  BellIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const FacultyDashboard = () => {
  const { user, profile } = useAuth();

  const quickActions = [
    {
      name: 'My Classes',
      href: '/faculty/classes',
      icon: AcademicCapIcon,
      color: 'bg-blue-500 hover:bg-blue-600',
      description: 'View and manage your classes'
    },
    {
      name: 'Mark Attendance',
      href: '/faculty/attendance',
      icon: ClipboardDocumentListIcon,
      color: 'bg-green-500 hover:bg-green-600',
      description: 'Mark student attendance'
    },
    {
      name: 'Students',
      href: '/faculty/students',
      icon: UserGroupIcon,
      color: 'bg-purple-500 hover:bg-purple-600',
      description: 'Manage student information'
    },
    {
      name: 'Submit Grades',
      href: '/faculty/grades',
      icon: ChartBarIcon,
      color: 'bg-yellow-500 hover:bg-yellow-600',
      description: 'Enter and update grades'
    },
    {
      name: 'Timetable',
      href: '/faculty/timetable',
      icon: CalendarIcon,
      color: 'bg-indigo-500 hover:bg-indigo-600',
      description: 'View your teaching schedule'
    },
    {
      name: 'Profile',
      href: '/faculty/profile',
      icon: BookOpenIcon,
      color: 'bg-gray-500 hover:bg-gray-600',
      description: 'Update your profile'
    }
  ];

  const statsCards = [
    {
      title: 'Classes Teaching',
      value: '6',
      icon: AcademicCapIcon,
      color: 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-400'
    },
    {
      title: 'Total Students',
      value: '180',
      icon: UserGroupIcon,
      color: 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-400'
    },
    {
      title: 'Classes This Week',
      value: '24',
      icon: CalendarIcon,
      color: 'text-purple-600 bg-purple-100 dark:bg-purple-900 dark:text-purple-400'
    },
    {
      title: 'Pending Grades',
      value: '12',
      icon: ClipboardDocumentListIcon,
      color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-400'
    }
  ];

  const todayClasses = [
    {
      subject: 'Database Management Systems',
      time: '09:00 - 10:00',
      room: 'CS-101',
      semester: '6th',
      department: 'CSE'
    },
    {
      subject: 'Computer Networks',
      time: '11:00 - 12:00',
      room: 'CS-102',
      semester: '6th',
      department: 'CSE'
    },
    {
      subject: 'Software Engineering Lab',
      time: '14:00 - 17:00',
      room: 'CS-Lab-1',
      semester: '5th',
      department: 'CSE'
    }
  ];

  const recentActivities = [
    {
      action: 'Grades submitted for Database Systems',
      time: '2 hours ago',
      type: 'grades'
    },
    {
      action: 'Attendance marked for Computer Networks',
      time: '1 day ago',
      type: 'attendance'
    },
    {
      action: 'Assignment uploaded for Software Engineering',
      time: '2 days ago',
      type: 'assignment'
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome back, Dr. {user?.firstName}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Employee ID: {profile?.employeeId} | {profile?.department?.name} | {profile?.designation}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
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

          {/* Today's Classes */}
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Today's Classes
          </h2>
          <div className="card p-6">
            <div className="space-y-4">
              {todayClasses.map((classItem, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {classItem.subject}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {classItem.department} - {classItem.semester} Semester | Room: {classItem.room}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center text-primary-600 dark:text-primary-400">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      <span className="text-sm font-medium">{classItem.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activities & Notifications */}
        <div className="space-y-6">
          {/* Recent Activities */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Recent Activities
              </h2>
              <BellIcon className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    activity.type === 'grades' ? 'bg-green-500' :
                    activity.type === 'attendance' ? 'bg-blue-500' : 'bg-purple-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 dark:text-white">
                      {activity.action}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              This Week Summary
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Classes Conducted</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">18/24</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Attendance Marked</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">16/18</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '89%' }}></div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Grades Submitted</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">12/15</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '80%' }}></div>
              </div>
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Upcoming Deadlines
            </h3>
            <div className="space-y-3">
              <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  Semester Grades Submission
                </p>
                <p className="text-xs text-red-600 dark:text-red-400">
                  Due: March 25, 2024
                </p>
              </div>
              
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Faculty Meeting
                </p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400">
                  March 20, 2024 at 2:00 PM
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyDashboard;