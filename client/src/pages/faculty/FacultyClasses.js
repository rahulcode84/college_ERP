import React, { useState } from 'react';
import { 
  AcademicCapIcon, 
  CalendarIcon, 
  ClockIcon, 
  UserGroupIcon,
  MapPinIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

const FacultyClasses = () => {
  const [selectedSemester, setSelectedSemester] = useState('current');

  const classes = [
    {
      id: 1,
      course: 'Database Management Systems',
      code: 'CS301',
      semester: 6,
      department: 'Computer Science',
      students: 45,
      schedule: [
        { day: 'Monday', time: '09:00-10:00', room: 'CS-101' },
        { day: 'Wednesday', time: '11:00-12:00', room: 'CS-101' },
        { day: 'Friday', time: '14:00-15:00', room: 'CS-101' }
      ],
      credits: 4,
      type: 'Theory'
    },
    {
      id: 2,
      course: 'Computer Networks',
      code: 'CS302',
      semester: 6,
      department: 'Computer Science',
      students: 42,
      schedule: [
        { day: 'Tuesday', time: '10:00-11:00', room: 'CS-102' },
        { day: 'Thursday', time: '09:00-10:00', room: 'CS-102' }
      ],
      credits: 4,
      type: 'Theory'
    },
    {
      id: 3,
      course: 'Software Engineering Lab',
      code: 'CS303',
      semester: 5,
      department: 'Computer Science',
      students: 38,
      schedule: [
        { day: 'Wednesday', time: '14:00-17:00', room: 'CS-Lab-1' }
      ],
      credits: 2,
      type: 'Practical'
    }
  ];

  const upcomingClasses = [
    {
      course: 'Database Management Systems',
      time: '09:00 - 10:00',
      room: 'CS-101',
      date: 'Today',
      students: 45
    },
    {
      course: 'Computer Networks',
      time: '10:00 - 11:00',
      room: 'CS-102',
      date: 'Tomorrow',
      students: 42
    },
    {
      course: 'Software Engineering Lab',
      time: '14:00 - 17:00',
      room: 'CS-Lab-1',
      date: 'Tomorrow',
      students: 38
    }
  ];

  const getTypeColor = (type) => {
    return type === 'Theory' 
      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            My Classes
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your teaching assignments and schedules
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="form-input"
          >
            <option value="current">Current Semester</option>
            <option value="all">All Semesters</option>
          </select>
          <button className="btn-primary flex items-center">
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Class Material
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900">
              <AcademicCapIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Classes
              </p>
              <p className="text-2xl font-bold text-blue-600">{classes.length}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900">
              <UserGroupIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Students
              </p>
              <p className="text-2xl font-bold text-green-600">
                {classes.reduce((sum, cls) => sum + cls.students, 0)}
              </p>
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
                Classes This Week
              </p>
              <p className="text-2xl font-bold text-purple-600">18</p>
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
                Hours/Week
              </p>
              <p className="text-2xl font-bold text-yellow-600">24</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Classes List */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Current Classes
          </h2>
          
          <div className="space-y-6">
            {classes.map((classItem) => (
              <div key={classItem.id} className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {classItem.course}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {classItem.code} • {classItem.department} • Semester {classItem.semester}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(classItem.type)}`}>
                      {classItem.type}
                    </span>
                    <span className="text-sm font-medium text-gray-500">
                      {classItem.credits} Credits
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <UserGroupIcon className="h-4 w-4 mr-2" />
                    <span className="text-sm">{classItem.students} Students</span>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                    Schedule
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {classItem.schedule.map((schedule, index) => (
                      <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {schedule.day}
                          </span>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            <div className="flex items-center">
                              <ClockIcon className="h-3 w-3 mr-1" />
                              {schedule.time}
                            </div>
                            <div className="flex items-center mt-1">
                              <MapPinIcon className="h-3 w-3 mr-1" />
                              {schedule.room}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex space-x-3">
                    <button className="text-primary-600 dark:text-primary-400 hover:text-primary-500 text-sm font-medium">
                      View Students
                    </button>
                    <button className="text-primary-600 dark:text-primary-400 hover:text-primary-500 text-sm font-medium">
                      Mark Attendance
                    </button>
                    <button className="text-primary-600 dark:text-primary-400 hover:text-primary-500 text-sm font-medium">
                      Upload Material
                    </button>
                  </div>
                  <button className="btn-outline text-sm">
                    Manage Class
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Classes & Quick Actions */}
        <div className="space-y-6">
          {/* Upcoming Classes */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Upcoming Classes
            </h3>
            
            <div className="space-y-3">
              {upcomingClasses.map((classItem, index) => (
                <div key={index} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      {classItem.course}
                    </h4>
                    <span className="text-xs text-primary-600 dark:text-primary-400">
                      {classItem.date}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <ClockIcon className="h-3 w-3 mr-1" />
                      {classItem.time}
                    </div>
                    <div className="flex items-center">
                      <MapPinIcon className="h-3 w-3 mr-1" />
                      {classItem.room}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {classItem.students} students
                    </span>
                    <button className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-500">
                      Mark Attendance
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h3>
            
            <div className="space-y-3">
              <button className="w-full p-3 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-center">
                  <ClockIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Mark Today's Attendance
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Mark attendance for current classes
                    </p>
                  </div>
                </div>
              </button>
              
              <button className="w-full p-3 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-center">
                  <AcademicCapIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Submit Grades
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Enter grades for assignments and exams
                    </p>
                  </div>
                </div>
              </button>
              
              <button className="w-full p-3 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-center">
                  <CalendarIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      View Timetable
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Check your weekly schedule
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Class Statistics */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              This Week Statistics
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Classes Conducted</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">18/20</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '90%' }}></div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Attendance Marked</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">16/18</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '89%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyClasses;