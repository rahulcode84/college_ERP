import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import { 
  UserCircleIcon, 
  AcademicCapIcon, 
  IdentificationIcon,
  BuildingOffice2Icon,
  BookOpenIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const FacultyProfile = () => {
  const { user, profile, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || ''
    }
  });

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      const result = await updateProfile(data);
      
      if (result.success) {
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const InfoCard = ({ icon: Icon, title, children }) => (
    <div className="card p-6">
      <div className="flex items-center mb-4">
        <Icon className="h-5 w-5 text-primary-600 dark:text-primary-400 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      </div>
      {children}
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Faculty Profile
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your professional information
          </p>
        </div>
        
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="btn-primary"
          >
            Edit Profile
          </button>
        ) : (
          <div className="flex space-x-3">
            <button
              onClick={() => {
                reset();
                setIsEditing(false);
              }}
              className="btn-outline"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit(onSubmit)}
              className="btn-primary flex items-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" color="white" className="mr-2" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Profile Picture & Basic Info */}
          <InfoCard icon={UserCircleIcon} title="Profile">
            <div className="text-center">
              <div className="mx-auto h-24 w-24 bg-primary-600 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-white">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </span>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                {user?.fullName}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {profile?.designation}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {profile?.department?.name}
              </p>
            </div>
          </InfoCard>

          {/* Academic Information */}
          <InfoCard icon={AcademicCapIcon} title="Academic Information">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Employee ID</label>
                <p className="text-gray-900 dark:text-white">{profile?.employeeId}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Department</label>
                <p className="text-gray-900 dark:text-white">{profile?.department?.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Designation</label>
                <p className="text-gray-900 dark:text-white">{profile?.designation}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Joining Date</label>
                <p className="text-gray-900 dark:text-white">
                  {profile?.joiningDate ? new Date(profile.joiningDate).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Experience</label>
                <p className="text-gray-900 dark:text-white">{profile?.experience?.total || 0} years</p>
              </div>
            </div>
          </InfoCard>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <InfoCard icon={IdentificationIcon} title="Personal Information">
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="form-label">First Name</label>
                  {isEditing ? (
                    <input
                      {...register('firstName', { required: 'First name is required' })}
                      className="form-input"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">{user?.firstName}</p>
                  )}
                  {errors.firstName && <p className="form-error">{errors.firstName.message}</p>}
                </div>

                <div>
                  <label className="form-label">Last Name</label>
                  {isEditing ? (
                    <input
                      {...register('lastName', { required: 'Last name is required' })}
                      className="form-input"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">{user?.lastName}</p>
                  )}
                  {errors.lastName && <p className="form-error">{errors.lastName.message}</p>}
                </div>

                <div>
                  <label className="form-label">Email Address</label>
                  {isEditing ? (
                    <input
                      {...register('email', { 
                        required: 'Email is required',
                        pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' }
                      })}
                      type="email"
                      className="form-input"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">{user?.email}</p>
                  )}
                  {errors.email && <p className="form-error">{errors.email.message}</p>}
                </div>

                <div>
                  <label className="form-label">Phone Number</label>
                  {isEditing ? (
                    <input
                      {...register('phone')}
                      type="tel"
                      className="form-input"
                      placeholder="+91-9876543210"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">{user?.phone || 'Not provided'}</p>
                  )}
                </div>
              </div>
            </form>
          </InfoCard>

          {/* Office Information */}
          <InfoCard icon={BuildingOffice2Icon} title="Office Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="form-label">Office Room</label>
                <p className="text-gray-900 dark:text-white">{profile?.office?.roomNumber || 'Not assigned'}</p>
              </div>
              <div>
                <label className="form-label">Building</label>
                <p className="text-gray-900 dark:text-white">{profile?.office?.building || 'Not specified'}</p>
              </div>
              <div>
                <label className="form-label">Office Phone</label>
                <p className="text-gray-900 dark:text-white">{profile?.office?.phone || 'Not provided'}</p>
              </div>
              <div>
                <label className="form-label">Office Hours</label>
                <p className="text-gray-900 dark:text-white">{profile?.office?.officeHours || 'Not specified'}</p>
              </div>
            </div>
          </InfoCard>

          {/* Qualifications */}
          <InfoCard icon={BookOpenIcon} title="Qualifications">
            <div className="space-y-4">
              {profile?.qualifications?.length > 0 ? (
                profile.qualifications.map((qualification, index) => (
                  <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {qualification.degree}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {qualification.institution} • {qualification.year}
                    </p>
                    {qualification.specialization && (
                      <p className="text-sm text-gray-500 dark:text-gray-500">
                        Specialization: {qualification.specialization}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400">No qualifications added</p>
              )}
            </div>
          </InfoCard>

          {/* Research & Publications */}
          {profile?.research && (
            <InfoCard icon={BookOpenIcon} title="Research & Publications">
              <div className="space-y-4">
                {profile.research.areaOfInterest?.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Areas of Interest
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {profile.research.areaOfInterest.map((area, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-full text-sm"
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {profile.research.publications?.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Publications
                    </h4>
                    <div className="space-y-2">
                      {profile.research.publications.map((publication, index) => (
                        <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {publication.title}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {publication.journal} • {publication.year}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </InfoCard>
          )}
        </div>
      </div>
    </div>
  );
};

export default FacultyProfile;