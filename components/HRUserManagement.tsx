'use client';

import React, { useState, useEffect } from 'react';
import { UserPlus, Mail, User, Building, Shield, CheckCircle, AlertCircle, X } from 'lucide-react';

type Alert = {
  type: 'success' | 'error' | 'warning';
  message: string;
} | null;

type HRUser = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  department?: string;
  is_active: boolean;
  email_verified: boolean;
  password_set: boolean;
  created_at: string;
};

export default function HRUserManagement() {
  const [hrUsers, setHrUsers] = useState<HRUser[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState<Alert>(null);
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    role: 'hr_staff',
    department: ''
  });

  useEffect(() => {
    fetchHRUsers();
  }, []);

  const fetchHRUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/hr-users', {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setHrUsers(data.users);
      } else {
        throw new Error(data.error || 'Failed to fetch HR users');
      }
    } catch (error) {
      console.error('Error fetching HR users:', error);
      setAlert({ 
        type: 'error', 
        message: 'Failed to load HR users. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAlert(null);

    try {
      const response = await fetch('/api/hr-users/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setAlert({ 
          type: 'success', 
          message: `Invitation sent to ${formData.email}. They will receive an email to set up their account.` 
        });
        setFormData({
          first_name: '',
          last_name: '',
          email: '',
          role: 'hr_staff',
          department: ''
        });
        setShowAddForm(false);
        fetchHRUsers();
      } else {
        throw new Error(data.error || 'Failed to invite user');
      }
    } catch (error) {
      console.error('Error inviting user:', error);
      setAlert({ 
        type: 'error', 
        message: `Failed to invite user: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendInvite = async (userId: string, email: string) => {
    try {
      const response = await fetch(`/api/hr-users/${userId}/resend-invite`, {
        method: 'POST',
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setAlert({ 
          type: 'success', 
          message: `Invitation resent to ${email}` 
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      setAlert({ 
        type: 'error', 
        message: `Failed to resend invitation: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/hr-users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ is_active: !currentStatus }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setAlert({ 
          type: 'success', 
          message: `User ${!currentStatus ? 'activated' : 'deactivated'} successfully` 
        });
        fetchHRUsers();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      setAlert({ 
        type: 'error', 
        message: `Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  };

  const getStatusBadge = (user: HRUser) => {
    if (!user.is_active) {
      return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">Deactivated</span>;
    }
    if (!user.email_verified) {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Pending Email</span>;
    }
    if (!user.password_set) {
      return <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">Pending Setup</span>;
    }
    return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Active</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">HR User Management</h2>
          <p className="text-gray-600">Manage ATS access for HR personnel</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add HR User</span>
        </button>
      </div>

      {/* Alert */}
      {alert && (
        <div className={`p-4 rounded-lg border ${
          alert.type === 'success' 
            ? 'bg-green-50 text-green-800 border-green-200' 
            : alert.type === 'error'
            ? 'bg-red-50 text-red-800 border-red-200'
            : 'bg-yellow-50 text-yellow-800 border-yellow-200'
        }`}>
          <div className="flex items-center justify-between">
            <span>{alert.message}</span>
            <button onClick={() => setAlert(null)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* HR Users List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {hrUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{user.first_name} {user.last_name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : user.role === 'hr_manager'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role === 'admin' ? 'Admin' : user.role === 'hr_manager' ? 'HR Manager' : 'HR Staff'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{user.department || '-'}</td>
                    <td className="px-6 py-4">{getStatusBadge(user)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      {!user.email_verified && (
                        <button
                          onClick={() => handleResendInvite(user.id, user.email)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Resend Invite
                        </button>
                      )}
                      <button
                        onClick={() => handleToggleActive(user.id, user.is_active)}
                        className={`font-medium ${
                          user.is_active 
                            ? 'text-red-600 hover:text-red-800' 
                            : 'text-green-600 hover:text-green-800'
                        }`}
                      >
                        {user.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add HR User Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Add HR User</h3>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="hr_staff">HR Staff</option>
                  <option value="hr_manager">HR Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department (Optional)
                </label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  placeholder="e.g., Human Resources"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending Invite...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Send Invitation
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}