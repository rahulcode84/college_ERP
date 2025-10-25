import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import { 
  UserCircleIcon, 
  AcademicCapIcon, 
  IdentificationIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-hot-toast';

const StudentProfile = () => {
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
      phone: user?.phone || '',
      dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
      gender: user?.gender || '',
      address: {
        street: user?.address?.street || '',
        city: user?.address?.city || '',
        state: user?.address?.state || '',
        zipCode: user?.address?.zipCode || ''
      },
      emergencyContact: {
        name: user?.emergencyContact?.name || '',
        phone: user?.emergencyContact?.phone || '',
        relationship: user?.emergencyContact?.relationship || ''
      }
    }
  });

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      const result = await updateProfile(data);
      
      if (result.success) {
        setIsEditing(false);
        toast.success('Profile updated successfully');
      }
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    reset();
    setIsEditing(false);
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
            My Profile
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your personal information and academic details
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
              onClick={handleCancel}
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

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Profile Picture & Basic Info */}
            <InfoCard icon={UserCircleIcon} title="Profile Picture">
              <div className="text-center">
                <div className="mx-auto h-24 w-24 bg-primary-600 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-white">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </span>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {user?.fullName}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                  {user?.role}
                </p>
              </div>
            </InfoCard>

            {/* Academic Information */}
            <InfoCard icon={AcademicCapIcon} title="Academic Information">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Student ID</label>
                  <p className="text-gray-900 dark:text-white">{profile?.studentId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Roll Number</label>
                  <p className="text-gray-900 dark:text-white">{profile?.rollNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Department</label>
                  <p className="text-gray-900 dark:text-white">{profile?.department?.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Semester</label>
                  <p className="text-gray-900 dark:text-white">{profile?.semester}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Batch</label>
                  <p className="text-gray-900 dark:text-white">{profile?.batch}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">CGPA</label>
                  <p className="text-gray-900 dark:text-white">{profile?.cgpa || 'N/A'}</p>
                </div>
              </div>
            </InfoCard>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <InfoCard icon={IdentificationIcon} title="Personal Information">
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
                  <label className="form-label">Date of Birth</label>
                  {isEditing ? (
                    <input
                      {...register('dateOfBirth')}
                      type="date"
                      className="form-input"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">
                      {user?.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : 'Not provided'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="form-label">Gender</label>
                  {isEditing ? (
                    <select {...register('gender')} className="form-input">
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  ) : (
                    <p className="text-gray-900 dark:text-white capitalize">
                      {user?.gender || 'Not specified'}
                    </p>
                  )}
                </div>
              </div>
            </InfoCard>

            {/* Contact Information */}
            <InfoCard icon={PhoneIcon} title="Contact Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="form-label">Email Address</label>
                  <div className="flex items-center">
                    <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-2" />
                    {isEditing ? (
                      <input
                        {...register('email', { 
                          required: 'Email is required',
                          pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' }
                        })}
                        type="email"
                        className="form-input flex-1"
                      />
                    ) : (
                      <p className="text-gray-900 dark:text-white">{user?.email}</p>
                    )}
                  </div>
                  {errors.email && <p className="form-error">{errors.email.message}</p>}
                </div>

                <div>
                  <label className="form-label">Phone Number</label>
                  <div className="flex items-center">
                    <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                    {isEditing ? (
                      <input
                        {...register('phone')}
                        type="tel"
                        className="form-input flex-1"
                        placeholder="+91-9876543210"
                      />
                    ) : (
                      <p className="text-gray-900 dark:text-white">{user?.phone || 'Not provided'}</p>
                    )}
                  </div>
                </div>
              </div>
            </InfoCard>

            {/* Address Information */}
            <InfoCard icon={MapPinIcon} title="Address">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="form-label">Street Address</label>
                  {isEditing ? (
                    <input
                      {...register('address.street')}
                      className="form-input"
                      placeholder="Street address"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">
                      {user?.address?.street || 'Not provided'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="form-label">City</label>
                  {isEditing ? (
                    <input
                      {...register('address.city')}
                      className="form-input"
                      placeholder="City"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">
                      {user?.address?.city || 'Not provided'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="form-label">State</label>
                  {isEditing ? (
                    <input
                      {...register('address.state')}
                      className="form-input"
                      placeholder="State"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">
                      {user?.address?.state || 'Not provided'}
                    </p>
                  )}
                </div>
              </div>
            </InfoCard>

            {/* Emergency Contact */}
            <InfoCard icon={PhoneIcon} title="Emergency Contact">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="form-label">Contact Name</label>
                  {isEditing ? (
                    <input
                      {...register('emergencyContact.name')}
                      className="form-input"
                      placeholder="Emergency contact name"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">
                      {user?.emergencyContact?.name || 'Not provided'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="form-label">Phone Number</label>
                  {isEditing ? (
                    <input
                      {...register('emergencyContact.phone')}
                      type="tel"
                      className="form-input"
                      placeholder="+91-9876543210"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">
                      {user?.emergencyContact?.phone || 'Not provided'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="form-label">Relationship</label>
                  {isEditing ? (
                    <select {...register('emergencyContact.relationship')} className="form-input">
                      <option value="">Select relationship</option>
                      <option value="parent">Parent</option>
                      <option value="guardian">Guardian</option>
                      <option value="sibling">Sibling</option>
                      <option value="spouse">Spouse</option>
                      <option value="other">Other</option>
                    </select>
                  ) : (
                    <p className="text-gray-900 dark:text-white capitalize">
                      {user?.emergencyContact?.relationship || 'Not provided'}
                    </p>
                  )}
                </div>
              </div>
            </InfoCard>
          </div>
        </div>
      </form>
    </div>
  );
};

export default StudentProfile;