import React, { useState } from 'react';
import { ChartBarIcon, TrophyIcon, AcademicCapIcon } from '@heroicons/react/24/outline';

const StudentGrades = () => {
  const [selectedSemester, setSelectedSemester] = useState('current');

  const currentGrades = [
    {
      course: 'Database Management Systems',
      code: 'CS301',
      credits: 4,
      internal: { obtained: 35, total: 40 },
      external: { obtained: 52, total: 60 },
      total: { obtained: 87, total: 100 },
      grade: 'A',
      gradePoints: 9
    },
    {
      course: 'Computer Networks',
      code: 'CS302',
      credits: 4,
      internal: { obtained: 32, total: 40 },
      external: { obtained: 48, total: 60 },
      total: { obtained: 80, total: 100 },
      grade: 'B+',
      gradePoints: 8
    },
    {
      course: 'Software Engineering',
      code: 'CS303',
      credits: 3,
      internal: { obtained: 38, total: 40 },
      external: { obtained: 54, total: 60 },
      total: { obtained: 92, total: 100 },
      grade: 'A+',
      gradePoints: 10
    },
    {
      course: 'Operating Systems',
      code: 'CS304',
      credits: 4,
      internal: { obtained: 34, total: 40 },
      external: { obtained: 50, total: 60 },
      total: { obtained: 84, total: 100 },
      grade: 'A',
      gradePoints: 9
    }
  ];

  const semesterData = [
    { semester: 1, sgpa: 8.5, cgpa: 8.5, credits: 22 },
    { semester: 2, sgpa: 8.8, cgpa: 8.65, credits: 24 },
    { semester: 3, sgpa: 8.2, cgpa: 8.5, credits: 23 },
    { semester: 4, sgpa: 9.0, cgpa: 8.6, credits: 24 },
    { semester: 5, sgpa: 8.9, cgpa: 8.64, credits: 23 },
    { semester: 6, sgpa: 9.1, cgpa: 8.7, credits: 24 }
  ];

  const getGradeColor = (grade) => {
    const colors = {
      'A+': 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300',
      'A': 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300',
      'B+': 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300',
      'B': 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300',
      'C+': 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300',
      'C': 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300',
      'D': 'text-orange-600 bg-orange-100 dark:bg-orange-900 dark:text-orange-300',
      'F': 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300'
    };
    return colors[grade] || 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-300';
  };

  const calculateCurrentSGPA = () => {
    const totalPoints = currentGrades.reduce((sum, course) => sum + (course.gradePoints * course.credits), 0);
    const totalCredits = currentGrades.reduce((sum, course) => sum + course.credits, 0);
    return (totalPoints / totalCredits).toFixed(2);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Academic Grades
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View your academic performance and grades
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
            <option value="1">Semester 1</option>
            <option value="2">Semester 2</option>
            <option value="3">Semester 3</option>
            <option value="4">Semester 4</option>
            <option value="5">Semester 5</option>
          </select>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900">
              <TrophyIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Current CGPA
              </p>
              <p className="text-2xl font-bold text-green-600">8.70</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900">
              <ChartBarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Current SGPA
              </p>
              <p className="text-2xl font-bold text-blue-600">{calculateCurrentSGPA()}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900">
              <AcademicCapIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Credits
              </p>
              <p className="text-2xl font-bold text-purple-600">140</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900">
              <TrophyIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Class Rank
              </p>
              <p className="text-2xl font-bold text-yellow-600">3/45</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Current Semester Grades */}
        <div className="lg:col-span-2">
          <div className="card p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Current Semester - Semester 6
            </h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Course</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">Credits</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">Internal</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">External</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">Total</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {currentGrades.map((course, index) => (
                    <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{course.course}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{course.code}</p>
                        </div>
                      </td>
                      <td className="text-center py-4 px-4 text-gray-900 dark:text-white">
                        {course.credits}
                      </td>
                      <td className="text-center py-4 px-4">
                        <span className="text-gray-900 dark:text-white">
                          {course.internal.obtained}/{course.internal.total}
                        </span>
                      </td>
                      <td className="text-center py-4 px-4">
                        <span className="text-gray-900 dark:text-white">
                          {course.external.obtained}/{course.external.total}
                        </span>
                      </td>
                      <td className="text-center py-4 px-4">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {course.total.obtained}/{course.total.total}
                        </span>
                      </td>
                      <td className="text-center py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getGradeColor(course.grade)}`}>
                          {course.grade}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-900 dark:text-white">Semester GPA:</span>
                <span className="text-xl font-bold text-primary-600">{calculateCurrentSGPA()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Semester-wise Performance */}
        <div>
          <div className="card p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Semester-wise Performance
            </h2>
            
            <div className="space-y-4">
              {semesterData.map((semester, index) => (
                <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      Semester {semester.semester}
                    </h4>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {semester.credits} Credits
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">SGPA</p>
                      <p className="font-bold text-blue-600">{semester.sgpa}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">CGPA</p>
                      <p className="font-bold text-green-600">{semester.cgpa}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Grade Distribution */}
          <div className="card p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Grade Distribution
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">A+ Grades</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">12</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '35%' }}></div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">A Grades</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">8</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '25%' }}></div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">B+ Grades</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">4</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '15%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentGrades;