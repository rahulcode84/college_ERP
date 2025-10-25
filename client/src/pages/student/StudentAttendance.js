import React, { useState } from 'react';
import { CalendarIcon, ChartBarIcon, ClockIcon } from '@heroicons/react/24/outline';

const StudentAttendance = () => {
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  const subjects = [
    { id: 'all', name: 'All Subjects' },
    { id: 'dbms', name: 'Database Management Systems' },
    { id: 'networks', name: 'Computer Networks' },
    { id: 'se', name: 'Software Engineering' },
    { id: 'os', name: 'Operating Systems' }
  ];

  const attendanceData = [
    {
      subject: 'Database Management Systems',
      totalClasses: 24,
      attended: 23,
      percentage: 95.8,
      lastClass: '2024-03-15',
      status: 'present'
    },
    {
      subject: 'Computer Networks',
      totalClasses: 22,
      attended: 19,
      percentage: 86.4,
      lastClass: '2024-03-14',
      status: 'absent'
    },
    {
      subject: 'Software Engineering',
      totalClasses: 20,
      attended: 18,
      percentage: 90.0,
      lastClass: '2024-03-13',
      status: 'present'
    },
    {
      subject: 'Operating Systems',
      totalClasses: 18,
      attended: 17,
      percentage: 94.4,
      lastClass: '2024-03-12',
      status: 'present'
    }
  ];

  const recentAttendance = [
    { date: '2024-03-15', subject: 'DBMS', period: '1', status: 'present' },
    { date: '2024-03-15', subject: 'Networks', period: '2', status: 'absent' },
    { date: '2024-03-15', subject: 'SE', period: '3', status: 'present' },
    { date: '2024-03-14', subject: 'OS', period: '1', status: 'present' },
    { date: '2024-03-14', subject: 'DBMS', period: '2', status: 'present' }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'present':
        return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300';
      case 'absent':
        return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300';
      case 'late':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getPercentageColor = (percentage) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Attendance
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track your class attendance and performance
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900">
              <ChartBarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Overall Attendance
              </p>
              <p className="text-2xl font-bold text-blue-600">91.5%</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900">
              <CalendarIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Classes Attended
              </p>
              <p className="text-2xl font-bold text-green-600">77/84</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900">
              <ClockIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                This Week
              </p>
              <p className="text-2xl font-bold text-yellow-600">12/15</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900">
              <CalendarIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                This Month
              </p>
              <p className="text-2xl font-bold text-purple-600">45/50</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Subject-wise Attendance */}
        <div className="lg:col-span-2">
          <div className="card p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Subject-wise Attendance
            </h2>
            
            <div className="space-y-4">
              {attendanceData.map((subject, index) => (
                <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {subject.subject}
                    </h3>
                    <span className={`text-lg font-bold ${getPercentageColor(subject.percentage)}`}>
                      {subject.percentage}%
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <span>Classes: {subject.attended}/{subject.totalClasses}</span>
                    <span>Last: {new Date(subject.lastClass).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                    <div 
                      className={`h-2 rounded-full ${
                        subject.percentage >= 90 ? 'bg-green-500' :
                        subject.percentage >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${subject.percentage}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(subject.status)}`}>
                      Last class: {subject.status}
                    </span>
                    {subject.percentage < 75 && (
                      <span className="text-xs text-red-600 dark:text-red-400">
                        ⚠️ Below minimum attendance
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Attendance */}
        <div>
          <div className="card p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Recent Attendance
            </h2>
            
            <div className="space-y-3">
              {recentAttendance.map((record, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {record.subject}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(record.date).toLocaleDateString()} • Period {record.period}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(record.status)}`}>
                    {record.status}
                  </span>
                </div>
              ))}
            </div>
            
            <button className="w-full mt-4 text-center text-primary-600 dark:text-primary-400 hover:text-primary-500 text-sm font-medium">
              View All Records
            </button>
          </div>

          {/* Attendance Calendar */}
          <div className="card p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Monthly Overview
            </h3>
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">March 2024</p>
              <div className="grid grid-cols-7 gap-1 text-xs">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
                  <div key={day} className="p-2 font-medium text-gray-500">
                    {day}
                  </div>
                ))}
                {/* Calendar grid would be generated here */}
                {Array.from({ length: 31 }, (_, i) => (
                  <div key={i} className={`p-2 rounded ${
                    i % 7 === 0 || i % 7 === 6 ? 'text-gray-400' : 
                    Math.random() > 0.1 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentAttendance;