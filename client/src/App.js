import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Layout components
import PublicLayout from './components/layouts/PublicLayout';
import PrivateLayout from './components/layouts/PrivateLayout';

// Public pages
import HomePage from './pages/public/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

// Protected pages
import DashboardPage from './pages/dashboard/DashboardPage';
import ProfilePage from './pages/profile/ProfilePage';

// Student pages
import StudentDashboard from './pages/student/StudentDashboard';
import StudentProfile from './pages/student/StudentProfile';
import StudentAttendance from './pages/student/StudentAttendance';
import StudentGrades from './pages/student/StudentGrades';
import StudentFees from './pages/student/StudentFees';

// Faculty pages
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import FacultyProfile from './pages/faculty/FacultyProfile';
import FacultyClasses from './pages/faculty/FacultyClasses';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminDepartments from './pages/admin/AdminDepartments';

// Components
import LoadingSpinner from './components/common/LoadingSpinner';
import NotFoundPage from './pages/errors/NotFoundPage';
import UnauthorizedPage from './pages/errors/UnauthorizedPage';

// Route protection components
import ProtectedRoute from './components/routing/ProtectedRoute';
import RoleBasedRoute from './components/routing/RoleBasedRoute';

// Constants
import { USER_ROLES, ROUTES } from './utils/constants';

function App() {
  const { isLoading, isAuthenticated } = useAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="App">
      <Routes>
        {/* Public Routes */}
        <Route
          path="/*"
          element={
            <PublicLayout>
              <Routes>
                <Route index element={<HomePage />} />
                <Route
                  path="login"
                  element={
                    isAuthenticated ? (
                      <Navigate to={ROUTES.DASHBOARD} replace />
                    ) : (
                      <LoginPage />
                    )
                  }
                />
                <Route
                  path="register"
                  element={
                    isAuthenticated ? (
                      <Navigate to={ROUTES.DASHBOARD} replace />
                    ) : (
                      <RegisterPage />
                    )
                  }
                />
                <Route
                  path="forgot-password"
                  element={
                    isAuthenticated ? (
                      <Navigate to={ROUTES.DASHBOARD} replace />
                    ) : (
                      <ForgotPasswordPage />
                    )
                  }
                />
                <Route
                  path="reset-password/:token"
                  element={
                    isAuthenticated ? (
                      <Navigate to={ROUTES.DASHBOARD} replace />
                    ) : (
                      <ResetPasswordPage />
                    )
                  }
                />
                <Route path="unauthorized" element={<UnauthorizedPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </PublicLayout>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <PrivateLayout>
                <DashboardPage />
              </PrivateLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <PrivateLayout>
                <ProfilePage />
              </PrivateLayout>
            </ProtectedRoute>
          }
        />

        {/* Student Routes */}
        <Route
          path="/student/*"
          element={
            <RoleBasedRoute allowedRoles={[USER_ROLES.STUDENT]}>
              <PrivateLayout>
                <Routes>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<StudentDashboard />} />
                  <Route path="profile" element={<StudentProfile />} />
                  <Route path="attendance" element={<StudentAttendance />} />
                  <Route path="grades" element={<StudentGrades />} />
                  <Route path="fees" element={<StudentFees />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </PrivateLayout>
            </RoleBasedRoute>
          }
        />

        {/* Faculty Routes */}
        <Route
          path="/faculty/*"
          element={
            <RoleBasedRoute allowedRoles={[USER_ROLES.FACULTY]}>
              <PrivateLayout>
                <Routes>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<FacultyDashboard />} />
                  <Route path="profile" element={<FacultyProfile />} />
                  <Route path="classes" element={<FacultyClasses />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </PrivateLayout>
            </RoleBasedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin/*"
          element={
            <RoleBasedRoute allowedRoles={[USER_ROLES.ADMIN]}>
              <PrivateLayout>
                <Routes>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="departments" element={<AdminDepartments />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </PrivateLayout>
            </RoleBasedRoute>
          }
        />

        {/* Catch all route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
}

export default App;