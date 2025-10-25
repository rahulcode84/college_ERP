import React, { useState } from 'react';
import { 
  PlusIcon, 
  BuildingOffice2Icon,
  UserGroupIcon,
  AcademicCapIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

const AdminDepartments = () => {
  const [showAddModal, setShowAddModal] = useState(false);

  const departments = [
    {
      id: 1,
      name: 'Computer Science and Engineering',
      code: 'CSE',
      head: 'Dr. Rajesh Kumar',
      established: '2005',
      facultyCount: 12,
      studentCount: 340,
      courses: 24,
      description: 'Department of Computer Science and Engineering focuses on cutting-edge technology and research.',
      contactInfo: {
        email: 'cse@college.edu',
        phone: '+91-1234567890',
        office: 'CSE Block, Room 101'
      }
    },
    {
      id: 2,
      name: 'Electronics and Communication Engineering',
      code: 'ECE',
      head: 'Prof. Priya Sharma',
      established: '2003',
      facultyCount: 10,
      studentCount: 285,
      courses: 20,
      description: 'Department of Electronics and Communication Engineering specializes in electronics and communication systems.',
      contactInfo: {
        email: 'ece@college.edu',
        phone: '+91-1234567891',
        office: 'ECE Block, Room 201'
      }
    },
    {
      id: 3,
      name: 'Mechanical Engineering',
      code: 'MECH',
      head: 'Dr. Amit Patel',
      established: '2000',
      facultyCount: 15,
      studentCount: 420,
      courses: 28,
      description: 'Department of Mechanical Engineering covers all aspects of mechanical systems and design.',
      contactInfo: {
        email: 'mech@college.edu',
        phone: '+91-1234567892',
        office: 'Mech Block, Room 301'
      }
    },
    {
      id: 4,
      name: 'Civil Engineering',
      code: 'CIVIL',
      head: 'Prof. Sunita Verma',
      established: '1998',
      facultyCount: 13,
      studentCount: 380,
      courses: 26,
      description: 'Department of Civil Engineering focuses on infrastructure development and construction technology.',
      contactInfo: {
        email: 'civil@college.edu',
        phone: '+91-1234567893',
        office: 'Civil Block, Room 401'
      }
    }
  ];

  const AddDepartmentModal = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Add New Department
        </h3>
        <form className="space-y-4">
          <div>
            <label className="form-label">Department Name</label>
            <input type="text" className="form-input" placeholder="Enter department name" />
          </div>
          <div>
            <label className="form-label">Department Code</label>
            <input type="text" className="form-input" placeholder="Enter department code (e.g., CSE)" />
          </div>
          <div>
            <label className="form-label">Department Head</label>
            <select className="form-input">
              <option value="">Select department head</option>
              <option value="1">Dr. Rajesh Kumar</option>
              <option value="2">Prof. Priya Sharma</option>
              <option value="3">Dr. Amit Patel</option>
            </select>
          </div>
          <div>
            <label className="form-label">Established Year</label>
            <input type="number" className="form-input" placeholder="2024" />
          </div>
          <div>
            <label className="form-label">Description</label>
            <textarea className="form-input" rows="3" placeholder="Enter department description"></textarea>
          </div>
          <div>
            <label className="form-label">Contact Email</label>
            <input type="email" className="form-input" placeholder="department@college.edu" />
          </div>
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="flex-1 btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary"
            >
              Add Department
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Department Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage academic departments and their information
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Department
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900">
              <BuildingOffice2Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Departments
              </p>
              <p className="text-2xl font-bold text-blue-600">{departments.length}</p>
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
                Total Faculty
              </p>
              <p className="text-2xl font-bold text-green-600">
                {departments.reduce((sum, dept) => sum + dept.facultyCount, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900">
              <UserGroupIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Students
              </p>
              <p className="text-2xl font-bold text-purple-600">
                {departments.reduce((sum, dept) => sum + dept.studentCount, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900">
              <AcademicCapIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Courses
              </p>
              <p className="text-2xl font-bold text-yellow-600">
                {departments.reduce((sum, dept) => sum + dept.courses, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {departments.map((department) => (
          <div key={department.id} className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {department.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {department.code} • Established {department.established}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button className="p-2 text-red-400 hover:text-red-600">
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {department.description}
            </p>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{department.facultyCount}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Faculty</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{department.studentCount}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Students</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{department.courses}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Courses</p>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Department Head:
                </span>
                <span className="text-sm text-gray-900 dark:text-white">
                  {department.head}
                </span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Contact:
                </span>
                <span className="text-sm text-gray-900 dark:text-white">
                  {department.contactInfo.email}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Office:
                </span>
                <span className="text-sm text-gray-900 dark:text-white">
                  {department.contactInfo.office}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-3">
                <button className="text-primary-600 dark:text-primary-400 hover:text-primary-500 text-sm font-medium">
                  View Faculty
                </button>
                <button className="text-primary-600 dark:text-primary-400 hover:text-primary-500 text-sm font-medium">
                  View Students
                </button>
                <button className="text-primary-600 dark:text-primary-400 hover:text-primary-500 text-sm font-medium">
                  View Courses
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showAddModal && <AddDepartmentModal />}
    </div>
  );
};

export default AdminDepartments;