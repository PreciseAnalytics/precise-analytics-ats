'use client';

import React, { useState, useEffect } from 'react';
import { Lock, Users, Search, UserPlus, FileText, BarChart3, LogOut, Home, ExternalLink, Filter, ChevronDown, Eye, Mail, Edit3, Download, Globe, Linkedin, X, Phone, Calendar, Clock, CheckCircle, XCircle, AlertCircle, Building, Settings, Plus } from 'lucide-react';

// Type definitions
type Application = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  job_title: string;
  status: string;
  applied_at: string;
  application_source: string;
  phone?: string;
  notes?: string;
  resume_url?: string;
  cover_letter_url?: string;
  portfolio_url?: string;
  linkedin_url?: string;
};

type Alert = {
  type: 'success' | 'error' | 'warning';
  message: string;
} | null;

// Component prop types
type NavigationProps = {
  onNavigate: (page: string) => void;
};

type PreciseAnalyticsLogoProps = {
  clickable?: boolean;
  onClick: () => void;
};

// Enhanced status mapping with proper typing
const STATUS_MAPPING: Record<string, string> = {
  'applied': 'applied',
  'submitted': 'applied',
  'shortlisted_for_interview': 'shortlisted_for_interview',
  'first_interview': 'first_interview',
  'second_interview': 'second_interview', 
  'background_check': 'onboarding',
  'hired': 'onboarding',
  'onboarding': 'onboarding',
  'not_selected': 'not_hired',
  'not_hired': 'not_hired',
  'rejected': 'not_hired',
  'withdrawn': 'withdrawn'
};

const normalizeStatus = (status: string): string => {
  return STATUS_MAPPING[status?.toLowerCase()] || status;
};

// Status categories for enhanced counters
const STATUS_CATEGORIES: Record<string, string[]> = {
  new_applications: ['applied'],
  first_interview: ['first_interview'],
  second_interview: ['second_interview'],
  onboarding: ['onboarding'],
  not_hired: ['not_hired'],
  withdrawn: ['withdrawn']
};

const PreciseAnalyticsLogo = ({ clickable = false, onClick }: PreciseAnalyticsLogoProps) => (
  <div className={`flex items-center space-x-3 ${clickable ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`} onClick={onClick}>
    <div className="flex items-center space-x-2">
      <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
        <div className="grid grid-cols-2 gap-0.5 w-4 h-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 bg-white rounded-full opacity-90"></div>
          ))}
        </div>
      </div>
      <div className="text-2xl font-bold">
        <span className="bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
          Precise Analytics
        </span>
      </div>
    </div>
  </div>
);

const LoginPage = ({ onNavigate }: NavigationProps) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      // Simple authentication check
      if (formData.email === 'careers@preciseanalytics.io' && formData.password === 'admin123') {
        localStorage.setItem('ats_auth', 'true');
        onNavigate('dashboard');
      } else {
        setError('Invalid credentials. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    const subject = 'ATS Password Reset Request';
    const body = 'Please reset my ATS password for careers@preciseanalytics.io';
    const mailtoLink = `mailto:admin@preciseanalytics.io?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink, '_blank');
    setShowForgotPassword(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <PreciseAnalyticsLogo onClick={() => {}} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Applicant Tracking System</h1>
          <p className="text-gray-600 font-medium">YOUR DATA, OUR INSIGHTS!</p>
          
          {/* Badges */}
          <div className="flex justify-center space-x-2 mt-4">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">VOSB</span>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">SDVOSB</span>
            <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">MBE</span>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter your email address"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter your password"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-green-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-green-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing In...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Lock className="w-4 h-4 mr-2" />
                  Sign In to ATS
                </div>
              )}
            </button>

            <div className="text-center">
              <button
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Forgot your password?
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            © 2025 Precise Analytics. All rights reserved.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Minority-Owned • Veteran-Owned • SDVOSB Certified
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reset Password</h3>
            <p className="text-gray-600 mb-6">
              Click the button below to send a password reset request to the administrator.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleForgotPassword}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Send Reset Request
              </button>
              <button
                onClick={() => setShowForgotPassword(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MainDashboard = ({ onNavigate }: NavigationProps) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedCandidate, setSelectedCandidate] = useState<Application | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [showAlert, setShowAlert] = useState<Alert>(null);

  // Status counts based on new categories
  const getStatusCounts = () => {
    const counts: Record<string, number> = {
      new_applications: 0,
      first_interview: 0,
      second_interview: 0,
      onboarding: 0,
      not_hired: 0,
      withdrawn: 0
    };

    applications.forEach((app: Application) => {
      const normalizedStatus = normalizeStatus(app.status);
      
      Object.keys(STATUS_CATEGORIES).forEach(category => {
        if (STATUS_CATEGORIES[category].includes(normalizedStatus)) {
          counts[category]++;
        }
      });
    });

    return counts;
  };

  const statusCounts = getStatusCounts();

  const tabs = [
    { 
      id: 'all', 
      label: 'All Applications', 
      icon: Users, 
      count: applications.length,
      color: 'bg-blue-100 text-blue-700 border-blue-200'
    },
    { 
      id: 'new_applications', 
      label: 'New Applications', 
      icon: FileText, 
      count: statusCounts.new_applications,
      color: 'bg-green-100 text-green-700 border-green-200'
    },
    { 
      id: 'first_interview', 
      label: '1st Interview', 
      icon: Users, 
      count: statusCounts.first_interview,
      color: 'bg-yellow-100 text-yellow-700 border-yellow-200'
    },
    { 
      id: 'second_interview', 
      label: '2nd Interview', 
      icon: Users, 
      count: statusCounts.second_interview,
      color: 'bg-orange-100 text-orange-700 border-orange-200'
    },
    { 
      id: 'onboarding', 
      label: 'Onboarding', 
      icon: CheckCircle, 
      count: statusCounts.onboarding,
      color: 'bg-blue-100 text-blue-700 border-blue-200'
    },
    { 
      id: 'not_hired', 
      label: 'Not Hired', 
      icon: XCircle, 
      count: statusCounts.not_hired,
      color: 'bg-red-100 text-red-700 border-red-200'
    },
    { 
      id: 'withdrawn', 
      label: 'Withdrawn', 
      icon: AlertCircle, 
      count: statusCounts.withdrawn,
      color: 'bg-gray-100 text-gray-700 border-gray-200'
    }
  ];

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    filterApplications();
  }, [searchTerm, activeTab, applications]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      console.log('Fetching applications...');
      
      const response = await fetch('/api/applications');
      const data = await response.json();
      
      if (data.success) {
        setApplications(data.applications);
        console.log('Applications fetched successfully:', data.applications.length);
      } else {
        throw new Error(data.error || 'Failed to fetch applications');
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      setShowAlert({ type: 'error', message: 'Failed to load applications. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const filterApplications = () => {
    let filtered = applications;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((app: Application) =>
        `${app.first_name} ${app.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.job_title?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by active tab
    if (activeTab !== 'all') {
      const statusesForTab = STATUS_CATEGORIES[activeTab] || [];
      filtered = filtered.filter((app: Application) => 
        statusesForTab.includes(normalizeStatus(app.status))
      );
    }

    setFilteredApplications(filtered);
  };

  const updateApplicationStatus = async (applicationId: string, newStatus: string) => {
    setIsUpdating(applicationId);
    
    try {
      console.log('Updating application:', applicationId, 'to status:', newStatus);
      
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Refresh applications to get updated counts
        await fetchApplications();
        setShowAlert({ type: 'success', message: 'Status updated successfully!' });
        
        // Close modal
        setSelectedCandidate(null);
      } else {
        throw new Error(result.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      setShowAlert({ 
        type: 'error', 
        message: `Failed to update status: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    } finally {
      setIsUpdating(null);
    }
  };

  const handleView = (application: Application) => {
    setSelectedCandidate(application);
  };

  const handleContact = (application: Application) => {
    const subject = `RE: Your Application for ${application.job_title || 'Position'} at Precise Analytics`;
    const body = `Dear ${application.first_name} ${application.last_name},\n\nThank you for your interest in joining Precise Analytics.\n\nBest regards,\nPrecise Analytics HR Team`;
    const mailtoLink = `mailto:${application.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink, '_blank');
  };

  const handleLogout = () => {
    console.log('Logging out...');
    localStorage.removeItem('ats_auth');
    onNavigate('login');
  };

  const getStatusDisplayName = (status: string) => {
    const statusMap: Record<string, string> = {
      'applied': 'Applied',
      'first_interview': '1st Interview',
      'second_interview': '2nd Interview',
      'onboarding': 'Onboarding',
      'not_hired': 'Not Hired',
      'withdrawn': 'Withdrawn'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'applied': 'bg-green-100 text-green-800',
      'first_interview': 'bg-yellow-100 text-yellow-800',
      'second_interview': 'bg-orange-100 text-orange-800',
      'onboarding': 'bg-blue-100 text-blue-800',
      'not_hired': 'bg-red-100 text-red-800',
      'withdrawn': 'bg-gray-100 text-gray-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  // Auto-hide alerts after 5 seconds
  useEffect(() => {
    if (showAlert) {
      const timer = setTimeout(() => setShowAlert(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [showAlert]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <PreciseAnalyticsLogo clickable onClick={() => onNavigate('dashboard')} />
            
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2 text-sm">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">VOSB</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">SDVOSB</span>
                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">MBE</span>
              </div>
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => onNavigate('jobs')}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Building className="w-4 h-4" />
                  <span>Manage Jobs</span>
                </button>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Alert */}
      {showAlert && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          showAlert.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
          'bg-red-100 text-red-800 border border-red-200'
        }`}>
          <div className="flex items-center justify-between">
            <span>{showAlert.message}</span>
            <button onClick={() => setShowAlert(null)} className="ml-4 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all ${
                  activeTab === tab.id
                    ? tab.color + ' shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  activeTab === tab.id ? 'bg-white/30' : 'bg-gray-100'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search candidates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Applications Table */}
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredApplications.map((application: Application) => (
                    <tr key={application.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{application.first_name} {application.last_name}</div>
                          <div className="text-sm text-gray-500">{application.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{application.job_title || 'Position Not Listed'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(normalizeStatus(application.status))}`}>
                          {getStatusDisplayName(normalizeStatus(application.status))}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(application.applied_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleView(application)}
                          className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </button>
                        <button
                          onClick={() => handleContact(application)}
                          className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                        >
                          <Mail className="w-4 h-4 mr-1" />
                          Contact
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredApplications.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No applications found</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Candidate Detail Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedCandidate.first_name} {selectedCandidate.last_name}</h2>
                  <p className="text-gray-600">{selectedCandidate.job_title || 'Position Not Listed'}</p>
                </div>
                <button
                  onClick={() => setSelectedCandidate(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Contact Information */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact Information</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{selectedCandidate.email}</span>
                    </div>
                    {selectedCandidate.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{selectedCandidate.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">Applied: {new Date(selectedCandidate.applied_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Application Documents</h3>
                  <div className="space-y-2">
                    {selectedCandidate.resume_url && (
                      <a
                        href={selectedCandidate.resume_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                      >
                        <Download className="w-4 h-4" />
                        <span className="text-sm">Resume</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {selectedCandidate.cover_letter_url && (
                      <a
                        href={selectedCandidate.cover_letter_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                      >
                        <Download className="w-4 h-4" />
                        <span className="text-sm">Cover Letter</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {selectedCandidate.portfolio_url && (
                      <a
                        href={selectedCandidate.portfolio_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                      >
                        <Globe className="w-4 h-4" />
                        <span className="text-sm">Portfolio</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {selectedCandidate.linkedin_url && (
                      <a
                        href={selectedCandidate.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                      >
                        <Linkedin className="w-4 h-4" />
                        <span className="text-sm">LinkedIn Profile</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Update Status */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Update Application Status</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { value: 'applied', label: 'Applied', color: 'bg-green-100 hover:bg-green-200 text-green-800' },
                    { value: 'first_interview', label: '1st Interview', color: 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800' },
                    { value: 'second_interview', label: '2nd Interview', color: 'bg-orange-100 hover:bg-orange-200 text-orange-800' },
                    { value: 'background_check', label: 'Background Check', color: 'bg-blue-100 hover:bg-blue-200 text-blue-800' },
                    { value: 'hired', label: 'Hired', color: 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800' },
                    { value: 'not_hired', label: 'Not Hired', color: 'bg-red-100 hover:bg-red-200 text-red-800' },
                    { value: 'withdrawn', label: 'Withdrawn', color: 'bg-gray-100 hover:bg-gray-200 text-gray-800' }
                  ].map((status) => (
                    <button
                      key={status.value}
                      onClick={() => updateApplicationStatus(selectedCandidate.id, status.value)}
                      disabled={isUpdating === selectedCandidate.id}
                      className={`px-4 py-3 rounded-lg font-medium transition-colors ${status.color} ${
                        isUpdating === selectedCandidate.id ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {isUpdating === selectedCandidate.id ? 'Updating...' : status.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes Section */}
              {selectedCandidate.notes && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Notes</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700">{selectedCandidate.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const JobManagementPage = ({ onNavigate }: NavigationProps) => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showJobForm, setShowJobForm] = useState(false);
  const [editingJob, setEditingJob] = useState<any>(null);
  const [showAlert, setShowAlert] = useState<Alert>(null);
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    location: '',
    employment_type: 'full_time',
    salary_range: '',
    description: '',
    requirements: '',
    posted: true
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/jobs');
      const data = await response.json();
      
      if (data.success) {
        setJobs(data.jobs);
      } else {
        throw new Error(data.error || 'Failed to fetch jobs');
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setShowAlert({ type: 'error', message: 'Failed to load jobs. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async () => {
    try {
      const url = editingJob ? `/api/jobs/${editingJob.id}` : '/api/jobs';
      const method = editingJob ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      
      if (result.success) {
        await fetchJobs();
        setShowJobForm(false);
        setEditingJob(null);
        setFormData({
          title: '',
          department: '',
          location: '',
          employment_type: 'full_time',
          salary_range: '',
          description: '',
          requirements: '',
          posted: true
        });
        setShowAlert({ 
          type: 'success', 
          message: editingJob ? 'Job updated successfully!' : 'Job created successfully!' 
        });
      } else {
        throw new Error(result.error || 'Failed to save job');
      }
    } catch (error) {
      console.error('Error saving job:', error);
      setShowAlert({ type: 'error', message: `Failed to save job: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  };

  const handleEdit = (job: any) => {
    setEditingJob(job);
    setFormData({
      title: job.title || '',
      department: job.department || '',
      location: job.location || '',
      employment_type: job.employment_type || 'full_time',
      salary_range: job.salary_range || '',
      description: job.description || '',
      requirements: job.requirements || '',
      posted: job.posted ?? true
    });
    setShowJobForm(true);
  };

  const handleDelete = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job posting?')) return;
    
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      
      if (result.success) {
        await fetchJobs();
        setShowAlert({ type: 'success', message: 'Job deleted successfully!' });
      } else {
        throw new Error(result.error || 'Failed to delete job');
      }
    } catch (error) {
      console.error('Error deleting job:', error);
      setShowAlert({ type: 'error', message: `Failed to delete job: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  };

  const toggleJobStatus = async (jobId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ posted: !currentStatus }),
      });

      const result = await response.json();
      
      if (result.success) {
        await fetchJobs();
        setShowAlert({ 
          type: 'success', 
          message: `Job ${!currentStatus ? 'published' : 'unpublished'} successfully!` 
        });
      } else {
        throw new Error(result.error || 'Failed to update job status');
      }
    } catch (error) {
      console.error('Error updating job status:', error);
      setShowAlert({ type: 'error', message: `Failed to update job status: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  };

  // Auto-hide alerts after 5 seconds
  useEffect(() => {
    if (showAlert) {
      const timer = setTimeout(() => setShowAlert(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [showAlert]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <PreciseAnalyticsLogo clickable onClick={() => onNavigate('dashboard')} />
              <span className="text-lg font-semibold text-gray-700">Job Management</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => onNavigate('dashboard')}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Dashboard</span>
              </button>
              
              <button
                onClick={() => {
                  localStorage.removeItem('ats_auth');
                  onNavigate('login');
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Alert */}
      {showAlert && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          showAlert.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
          'bg-red-100 text-red-800 border border-red-200'
        }`}>
          <div className="flex items-center justify-between">
            <span>{showAlert.message}</span>
            <button onClick={() => setShowAlert(null)} className="ml-4 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Manage Job Postings</h1>
          <button
            onClick={() => {
              setEditingJob(null);
              setFormData({
                title: '',
                department: '',
                location: '',
                employment_type: 'full_time',
                salary_range: '',
                description: '',
                requirements: '',
                posted: true
              });
              setShowJobForm(true);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Job</span>
          </button>
        </div>

        {/* Jobs List */}
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{job.title}</div>
                          <div className="text-sm text-gray-500">{job.salary_range}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {job.department}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {job.location}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {job.employment_type?.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          job.posted 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {job.posted ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleEdit(job)}
                          className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                        >
                          <Edit3 className="w-4 h-4 mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={() => toggleJobStatus(job.id, job.posted)}
                          className={`inline-flex items-center px-3 py-1 rounded-lg transition-colors ${
                            job.posted 
                              ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {job.posted ? 'Unpublish' : 'Publish'}
                        </button>
                        <button
                          onClick={() => handleDelete(job.id)}
                          className="inline-flex items-center px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {jobs.length === 0 && (
              <div className="text-center py-12">
                <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No job postings found</p>
                <button
                  onClick={() => setShowJobForm(true)}
                  className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
                >
                  Create your first job posting
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Job Form Modal */}
      {showJobForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingJob ? 'Edit Job Posting' : 'Create New Job Posting'}
                </h2>
                <button
                  onClick={() => {
                    setShowJobForm(false);
                    setEditingJob(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    Job Title *
                  </label>
                  <input
                    id="title"
                    name="title"
                    type="text"
                    required
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Senior Data Analyst"
                  />
                </div>

                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
                    Department *
                  </label>
                  <input
                    id="department"
                    name="department"
                    type="text"
                    required
                    value={formData.department}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Data Analytics"
                  />
                </div>

                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                    Location *
                  </label>
                  <input
                    id="location"
                    name="location"
                    type="text"
                    required
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Richmond, VA / Remote"
                  />
                </div>

                <div>
                  <label htmlFor="employment_type" className="block text-sm font-medium text-gray-700 mb-2">
                    Employment Type *
                  </label>
                  <select
                    id="employment_type"
                    name="employment_type"
                    required
                    value={formData.employment_type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="full_time">Full Time</option>
                    <option value="part_time">Part Time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="salary_range" className="block text-sm font-medium text-gray-700 mb-2">
                    Salary Range
                  </label>
                  <input
                    id="salary_range"
                    name="salary_range"
                    type="text"
                    value={formData.salary_range}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., $70,000 - $90,000"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Job Description *
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    required
                    rows={4}
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe the role, responsibilities, and what the candidate will be doing..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="requirements" className="block text-sm font-medium text-gray-700 mb-2">
                    Requirements *
                  </label>
                  <textarea
                    id="requirements"
                    name="requirements"
                    required
                    rows={4}
                    value={formData.requirements}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="List the qualifications, skills, and experience required..."
                  />
                </div>

                <div className="md:col-span-2">
                  <div className="flex items-center">
                    <input
                      id="posted"
                      name="posted"
                      type="checkbox"
                      checked={formData.posted}
                      onChange={(e) => setFormData({ ...formData, posted: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="posted" className="ml-2 block text-sm text-gray-900">
                      Publish immediately to careers page
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowJobForm(false);
                    setEditingJob(null);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  {editingJob ? 'Update Job' : 'Create Job'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Main App Component
export default function App() {
  const [currentPage, setCurrentPage] = useState('login');

  // Check authentication on load
  useEffect(() => {
    const isAuthenticated = localStorage.getItem('ats_auth') === 'true';
    if (isAuthenticated) {
      setCurrentPage('dashboard');
    }
  }, []);

  const handleNavigation = (page: string) => {
    setCurrentPage(page);
  };

  if (currentPage === 'login') {
    return <LoginPage onNavigate={handleNavigation} />;
  }

  if (currentPage === 'jobs') {
    return <JobManagementPage onNavigate={handleNavigation} />;
  }

  return <MainDashboard onNavigate={handleNavigation} />;
}