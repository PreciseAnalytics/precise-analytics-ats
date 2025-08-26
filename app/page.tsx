//"C:\Users\owner\Documents\precise-analytics-ats\app\page.tsx"

'use client';

import React, { useState, useEffect } from 'react';
import { Lock, Users, Search, UserPlus, FileText, BarChart3, LogOut, Home, ExternalLink, Filter, ChevronDown, Eye, Mail, Edit3, Download, Globe, MapPin, X, Briefcase, Phone, Calendar, Clock, CheckCircle, XCircle, AlertCircle, Building, Settings, Plus, Archive, Trash2 } from 'lucide-react';
// Type definitions
type Application = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  job_title: string;
  status: string;
  applied_at?: string;
  submission_date?: string;
  created_at?: string;
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
  'new': 'applied',
  'pending': 'applied',
  'under_review': 'screening',
  'reviewing': 'screening',
  'screening': 'screening',
  'screened': 'screening',
  'phone_screen': 'screening',
  'initial_review': 'screening',
  'shortlisted': 'shortlisted',
  'shortlisted_for_interview': 'shortlisted',
  'first_interview': 'first_interview',
  'interview_1': 'first_interview',
  'second_interview': 'second_interview',
  'interview_2': 'second_interview',
  'final_interview': 'final_interview',
  'interview_3': 'final_interview',
  'background_check': 'onboarding',
  'reference_check': 'onboarding',
  'hired': 'onboarding',
  'onboarding': 'onboarding',
  'offer_made': 'onboarding',
  'offer_accepted': 'onboarding',
  'not_selected': 'not_hired',
  'not_hired': 'not_hired',
  'rejected': 'not_hired',
  'declined': 'not_hired',
  'withdrawn': 'withdrawn',
  'candidate_withdrew': 'withdrawn'
};

const normalizeStatus = (status: string): string => {
  return STATUS_MAPPING[status?.toLowerCase()] || status?.toLowerCase() || 'applied';
};

// Status categories for enhanced counters
const STATUS_CATEGORIES: Record<string, string[]> = {
  new_applications: ['applied'],
  screening: ['screening'],
  shortlisted: ['shortlisted'],
  first_interview: ['first_interview'],
  second_interview: ['second_interview'],
  final_interview: ['final_interview'],
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
      screening: 0,
      shortlisted: 0,
      first_interview: 0,
      second_interview: 0,
      final_interview: 0,
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
      id: 'screening', 
      label: 'Screening', 
      icon: Search, 
      count: statusCounts.screening,
      color: 'bg-purple-100 text-purple-700 border-purple-200'
    },
    { 
      id: 'shortlisted', 
      label: 'Shortlisted', 
      icon: CheckCircle, 
      count: statusCounts.shortlisted,
      color: 'bg-indigo-100 text-indigo-700 border-indigo-200'
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
      id: 'final_interview', 
      label: 'Final Interview', 
      icon: Users, 
      count: statusCounts.final_interview,
      color: 'bg-pink-100 text-pink-700 border-pink-200'
    },
    { 
      id: 'onboarding', 
      label: 'Onboarding', 
      icon: CheckCircle, 
      count: statusCounts.onboarding,
      color: 'bg-emerald-100 text-emerald-700 border-emerald-200'
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
        const normalized = normalizeStatus(newStatus);

        // Debug logs
        console.log('✅ New status:', newStatus);
        console.log('✅ Normalized:', normalized);

        // Map to matching tab
        const newTab = Object.entries(STATUS_CATEGORIES).find(([_, list]) =>
          list.includes(normalized)
        )?.[0];

        // Switch tab if needed
        if (newTab && newTab !== activeTab) {
          setActiveTab(newTab);
        }

        // Let DB update finalize
        await new Promise((r) => setTimeout(r, 300));

        await fetchApplications();
        setShowAlert({ type: 'success', message: 'Status updated successfully!' });
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
      'screening': 'Screening',
      'shortlisted': 'Shortlisted',
      'first_interview': '1st Interview',
      'second_interview': '2nd Interview',
      'final_interview': 'Final Interview',
      'onboarding': 'Onboarding',
      'not_hired': 'Not Hired',
      'withdrawn': 'Withdrawn'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'applied': 'bg-green-100 text-green-800',
      'screening': 'bg-purple-100 text-purple-800',
      'shortlisted': 'bg-indigo-100 text-indigo-800',
      'first_interview': 'bg-yellow-100 text-yellow-800',
      'second_interview': 'bg-orange-100 text-orange-800',
      'final_interview': 'bg-pink-100 text-pink-800',
      'onboarding': 'bg-emerald-100 text-emerald-800',
      'not_hired': 'bg-red-100 text-red-800',
      'withdrawn': 'bg-gray-100 text-gray-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

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
                        {new Date(application.applied_at || application.submission_date || application.created_at || '').toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium space-x-2">
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
                      <span className="text-sm">
                        Applied: {new Date(selectedCandidate.applied_at || selectedCandidate.submission_date || selectedCandidate.created_at || '').toLocaleDateString()}
                      </span>
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
                    { value: 'screening', label: 'Screening', color: 'bg-purple-100 hover:bg-purple-200 text-purple-800' },
                    { value: 'shortlisted', label: 'Shortlisted', color: 'bg-indigo-100 hover:bg-indigo-200 text-indigo-800' },
                    { value: 'first_interview', label: '1st Interview', color: 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800' },
                    { value: 'second_interview', label: '2nd Interview', color: 'bg-orange-100 hover:bg-orange-200 text-orange-800' },
                    { value: 'final_interview', label: 'Final Interview', color: 'bg-pink-100 hover:bg-pink-200 text-pink-800' },
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

// Type definitions
type JobStatus = 'active' | 'inactive' | 'expired' | 'draft' | 'archived' | 'deactivated';

// Normalize job status for backward compatibility
const getNormalizedJobStatus = (job: any): JobStatus => {
  if (!job) return 'inactive';
  if (job.status === 'archived') return 'archived';
  if (job.status === 'deactivated') return 'deactivated';
  if (job.status === 'expired') return 'expired';
  if (job.status === 'draft') return 'inactive';
  if (job.status === 'published' || (job.posted === true && !job.status)) {
    return 'active';
  }
  if (job.status === 'unpublished' || job.posted === false || job.status === 'inactive') {
    return 'inactive';
  }
  return 'inactive';
};



// JobManagementPage Component
const JobManagementPage = ({ onNavigate }: NavigationProps) => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showJobForm, setShowJobForm] = useState(false);
  const [editingJob, setEditingJob] = useState<any>(null);
  const [showAlert, setShowAlert] = useState<Alert>(null);
  const [isSubmittingJob, setIsSubmittingJob] = useState(false);
  const [activeJobTab, setActiveJobTab] = useState('all');
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    location: '',
    employment_type: 'full_time',
    salary_range: '',
    description: '',
    requirements: '',
    posted: true,
    auto_expire_days: 30,
    max_applications: 50,
  });

  // Job status categories
  const jobTabs = [
    { id: 'all', label: 'All Jobs (Debug)', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    { id: 'active', label: 'Active Jobs', color: 'bg-green-100 text-green-700 border-green-200' },
    { id: 'inactive', label: 'Inactive Jobs', color: 'bg-gray-100 text-gray-700 border-gray-200' },
    { id: 'expired', label: 'Expired Jobs', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    { id: 'draft', label: 'Draft Jobs', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { id: 'archived', label: 'Archived Jobs', color: 'bg-red-100 text-red-700 border-red-200' },
    { id: 'deactivated', label: 'Deactivated Jobs', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  ];

  // Get job counts by status
  const getJobCounts = () => {
    const counts = {
      active: 0,
      inactive: 0,
      expired: 0,
      draft: 0,
      archived: 0,
      deactivated: 0,
    };

    jobs.forEach((job) => {
      const normalizedStatus = getNormalizedJobStatus(job);
      counts[normalizedStatus]++;
    });

    return counts;
  };

  const jobCounts = getJobCounts();

  // Filter jobs by active tab
  const filteredJobs = jobs.filter((job) => {
    const normalizedStatus = getNormalizedJobStatus(job);
    if (activeJobTab === 'all') return true;
    return normalizedStatus === activeJobTab;
  });

  // Check if job should be auto-expired
  const checkJobExpiry = (job: any) => {
    if (job.status !== 'active' || !job.posted_date) return false;

    const postedDate = new Date(job.posted_date);
    const expiryDays = job.auto_expire_days || 30;
    const expiryDate = new Date(postedDate.getTime() + expiryDays * 24 * 60 * 60 * 1000);

    return new Date() > expiryDate;
  };

  // Check if job should be auto-expired by application count
  const checkApplicationLimit = (job: any) => {
    if (job.status !== 'active' || !job.max_applications) return false;
    return (job.application_count || 0) >= job.max_applications;
  };

  // Get job status display info
  const getJobStatusInfo = (job: any) => {
    const normalizedStatus = getNormalizedJobStatus(job);
    const isExpired = checkJobExpiry(job);
    const isAtLimit = checkApplicationLimit(job);

    if (isExpired || isAtLimit) {
      return {
        status: 'expired',
        label: isExpired ? 'Auto-Expired' : 'Application Limit Reached',
        color: 'bg-yellow-100 text-yellow-800',
        canReactivate: true,
        originalStatus: job.status,
        posted: job.posted,
      };
    }

    switch (normalizedStatus) {
      case 'archived':
        return {
          status: 'archived',
          label: 'Archived',
          color: 'bg-red-100 text-red-800',
          canReactivate: true,
          originalStatus: job.status,
          posted: job.posted,
        };
      case 'deactivated':
        return {
          status: 'deactivated',
          label: 'Deactivated',
          color: 'bg-yellow-100 text-yellow-800',
          canReactivate: true,
          originalStatus: job.status,
          posted: job.posted,
        };
      case 'active':
        return {
          status: 'active',
          label: 'Live on Site',
          color: 'bg-green-100 text-green-800',
          canReactivate: false,
          originalStatus: job.status,
          posted: job.posted,
        };
      case 'inactive':
        return {
          status: 'inactive',
          label: 'Inactive',
          color: 'bg-gray-100 text-gray-800',
          canReactivate: true,
          originalStatus: job.status,
          posted: job.posted,
        };
      case 'expired':
        return {
          status: 'expired',
          label: 'Expired',
          color: 'bg-yellow-100 text-yellow-800',
          canReactivate: true,
          originalStatus: job.status,
          posted: job.posted,
        };
      case 'draft':
        return {
          status: 'draft',
          label: 'Draft',
          color: 'bg-blue-100 text-blue-800',
          canReactivate: false,
          originalStatus: job.status,
          posted: job.posted,
        };
      default:
        return {
          status: 'draft',
          label: `Legacy (${job.status || 'unknown'})`,
          color: 'bg-purple-100 text-purple-800',
          canReactivate: false,
          originalStatus: job.status,
          posted: job.posted,
        };
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching jobs...');

      const response = await fetch('/api/jobs?' + new Date().getTime(), {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      });

      const data = await response.json();

      if (data.success) {
        setJobs(data.jobs);
        console.log(`✅ Fetched ${data.jobs.length} jobs`);
      } else {
        throw new Error(data.error || 'Failed to fetch jobs');
      }
    } catch (error) {
      console.error('❌ Error fetching jobs:', error);
      setShowAlert({ type: 'error', message: 'Failed to load jobs. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const target = e.target;
    const { name, value, type } = target;
    const newValue = type === 'checkbox' ? (target as HTMLInputElement).checked : value;

    if (editingJob) {
      setEditingJob({
        ...editingJob,
        [name]: newValue,
      });
    } else {
      setFormData({
        ...formData,
        [name]: newValue,
      });
    }
  };

  

  const handleSubmit = async () => {
    try {
      setIsSubmittingJob(true);

      const dataToSend = editingJob
        ? {
            title: editingJob.title,
            department: editingJob.department,
            location: editingJob.location,
            employment_type: editingJob.employment_type || editingJob.type,
            salary_range: editingJob.salary_range,
            description: editingJob.description,
            requirements: editingJob.requirements,
            benefits: editingJob.benefits || '',
            auto_expire_days: editingJob.auto_expire_days || 30,
            max_applications: editingJob.max_applications || 50,
            status: editingJob.posted ? 'published' : 'draft',  // ✅ CHANGED: 'active' to 'published'
            posted_date: editingJob.posted ? editingJob.posted_date || new Date().toISOString() : null,
          }
        : {
            ...formData,
            status: formData.posted ? 'published' : 'draft',  // ✅ CHANGED: 'active' to 'published'
            posted_date: formData.posted ? new Date().toISOString() : null,
          };

      const url = editingJob ? `/api/jobs/${editingJob.id}` : '/api/jobs';
      const method = editingJob ? 'PUT' : 'POST';

      console.log(`🔄 ${editingJob ? 'Updating' : 'Creating'} job:`, dataToSend);

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      const result = await response.json();
      console.log('📝 Job API response:', result);

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
          posted: true,
          auto_expire_days: 30,
          max_applications: 50,
        });
        setShowAlert({
          type: 'success',
          message: editingJob ? 'Job updated successfully!' : 'Job created successfully!',
        });
        console.log(`✅ Job ${editingJob ? 'updated' : 'created'} successfully`);
      } else {
        throw new Error(result.error || 'Failed to save job');
      }
    } catch (error) {
      console.error('❌ Error saving job:', error);
      setShowAlert({
        type: 'error',
        message: `Failed to save job: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setIsSubmittingJob(false);
    }
  };

  const handleEdit = (job: any) => {
    console.log('📝 Editing job:', job);

    setEditingJob({
      ...job,
      title: job.title || '',
      department: job.department || '',
      location: job.location || '',
      employment_type: job.employment_type || job.type || 'full_time',
      salary_range: job.salary_range || '',
      description: job.description || '',
      requirements: job.requirements || '',
      benefits: job.benefits || '',
      auto_expire_days: job.auto_expire_days || 30,
      max_applications: job.max_applications || 50,
      posted: job.status === 'published' || job.posted === true,  // ✅ CHANGED: 'active' to 'published'
    });

    setShowJobForm(true);
  };

  const handleDelete = async (jobId: string) => {
    if (!confirm('Are you sure you want to permanently delete this job posting? This action cannot be undone and will remove all associated applications.')) return;

    try {
      setLoading(true);
      console.log('🗑️ Permanently deleting job:', jobId);

      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        await fetchJobs();
        setActiveJobTab('all');
        setShowAlert({ type: 'success', message: 'Job permanently deleted!' });
        console.log('✅ Job deleted:', jobId);
      } else {
        throw new Error(result.error || 'Failed to delete job');
      }
    } catch (error) {
      console.error('❌ Error deleting job:', error);
      setShowAlert({
        type: 'error',
        message: `Failed to delete job: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async (jobId: string) => {
    if (!confirm('Are you sure you want to archive this job posting? It will be hidden from the careers page but kept in your repository.')) return;

    try {
      setLoading(true);
      console.log('🗄️ Archiving job:', jobId);

      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'archived', posted: false }),
      });

      const result = await response.json();

      if (result.success) {
        await fetchJobs();
        setActiveJobTab('archived');
        setShowAlert({ type: 'success', message: 'Job archived successfully!' });
        console.log('✅ Job archived:', jobId);
      } else {
        throw new Error(result.error || 'Failed to archive job');
      }
    } catch (error) {
      console.error('❌ Error archiving job:', error);
      setShowAlert({
        type: 'error',
        message: `Failed to archive job: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const updateJobStatus = async (jobId: string, newStatus: string) => {
    try {
      setLoading(true);
      const updateData: any = { status: newStatus };
      if (newStatus === 'deactivated') {
        updateData.posted = false; // Set posted to false for deactivated jobs
      } else if (newStatus === 'published') {
        updateData.posted = true;
        updateData.posted_date = new Date().toISOString();
      }
      console.log('Updating job status:', { jobId, updateData }); // Debug log
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to update job status');

      await fetchJobs(); // Refresh job list

      setShowAlert({
        type: 'success',
        message: `Job has been ${newStatus === 'published' ? 'reactivated and published' : 'deactivated'} successfully!`,
      });
    } catch (error) {
      console.error('Error updating job status:', error);
      setShowAlert({ type: 'error', message: `Failed to update job status: ${error instanceof Error ? error.message : 'Unknown error'}` });
    } finally {
      setLoading(false);
    }
  };

  const reactivateJob = async (jobId: string) => {
    if (!confirm('Reactivate this job and publish it to the careers page?')) return;
    await updateJobStatus(jobId, 'published');  // ✅ CHANGED: 'active' to 'published'
  };


  const deactivateJob = async (jobId: string) => {
    if (!confirm('Deactivate this job and remove it from the careers page? It will be kept in your job repository.')) return;
    await updateJobStatus(jobId, 'deactivated');
  };

  useEffect(() => {
    if (showAlert) {
      const timer = setTimeout(() => setShowAlert(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [showAlert]);

  // Helper function to get the right value source
  const getFieldValue = (fieldName: string) => {
    return editingJob ? editingJob[fieldName] : formData[fieldName];
  };

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
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
            showAlert.type === 'success'
              ? 'bg-green-100 text-green-800 border border-green-200'
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}
        >
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
          <div className="flex space-x-3">
            <button
              onClick={() => window.open('https://preciseanalytics.io/careers', '_blank')}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Globe className="w-4 h-4" />
              <span>View Careers Page</span>
            </button>
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
                  posted: true,
                  auto_expire_days: 30,
                  max_applications: 50,
                });
                setShowJobForm(true);
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Job</span>
            </button>
          </div>
        </div>

        {/* Job Status Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {jobTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveJobTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all ${
                activeJobTab === tab.id
                  ? tab.color + ' shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <span className="font-medium">{tab.label}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  activeJobTab === tab.id ? 'bg-white/30' : 'bg-gray-100'
                }`}
              >
                {jobCounts[tab.id] || 0}
              </span>
            </button>
          ))}
        </div>

        {/* Jobs List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-[1100px] w-full table-fixed">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Job Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applications
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expires
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredJobs.map((job) => {
                    const statusInfo = getJobStatusInfo(job);
                    const expiryDate = job.posted_date && job.auto_expire_days
                      ? new Date(new Date(job.posted_date).getTime() + job.auto_expire_days * 24 * 60 * 60 * 1000)
                      : null;

                    return (
                      <tr key={job.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{job.title}</div>
                            <div className="text-sm text-gray-500">{job.salary_range}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{job.department}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{job.location}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {job.application_count || 0}
                            {job.max_applications && <span className="text-gray-500">/{job.max_applications}</span>}
                          </div>
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {job.employment_type?.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                            {statusInfo.status === 'active' && (
                              <div>
                                <Globe className="w-4 h-4 text-green-600" />
                              </div>
                            )}
                            {activeJobTab === 'all' && (
                              <div className="text-xs text-gray-500 ml-2">
                                <div>Raw: {statusInfo.originalStatus || 'null'}</div>
                                <div>Posted: {statusInfo.posted ? 'true' : 'false'}</div>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {statusInfo.status === 'active' && expiryDate ? (
                            <div>
                              <div>{expiryDate.toLocaleDateString()}</div>
                              <div className="text-xs">
                                ({Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days)
                              </div>
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium">
                          <div className="flex flex-wrap gap-2">
                            <button
                              title="Edit Job"
                              onClick={() => handleEdit(job)}
                              className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                            >
                              <Edit3 className="w-4 h-4 mr-1" />
                              <span>Edit</span>
                            </button>

                            {statusInfo.status === 'active' ? (
                              <>
                                <button
                                  title="Deactivate Job"
                                  onClick={() => deactivateJob(job.id)}
                                  className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  <span>Deactivate</span>
                                </button>
                                <button
                                  title="Archive Job"
                                  onClick={() => handleArchive(job.id)}
                                  className="inline-flex items-center px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                                >
                                  <Archive className="w-4 h-4 mr-1" />
                                  <span>Archive</span>
                                </button>
                              </>
                            ) : statusInfo.canReactivate ? (
                              <button
                                title="Reactivate Job"
                                onClick={() => reactivateJob(job.id)}
                                className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                              >
                                <Globe className="w-4 h-4 mr-1" />
                                <span>Reactivate</span>
                              </button>
                            ) : job.status === 'draft' ? (
                              <button
                                title="Publish Job"
                                onClick={() => updateJobStatus(job.id, 'published')}
                                className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                              >
                                <Globe className="w-4 h-4 mr-1" />
                                <span>Publish</span>
                              </button>
                            ) : null}

                            {(statusInfo.status === 'archived' || statusInfo.status === 'deactivated' || statusInfo.status === 'expired' || statusInfo.status === 'draft') && (
                              <button
                                title="Delete Job"
                                onClick={() => handleDelete(job.id)}
                                className="inline-flex items-center px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                <span>Delete</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredJobs.length === 0 && (
              <div className="text-center py-12">
                <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {activeJobTab === 'active' && 'No active jobs found'}
                  {activeJobTab === 'inactive' && 'No inactive jobs found'}
                  {activeJobTab === 'expired' && 'No expired jobs found'}
                  {activeJobTab === 'draft' && 'No draft jobs found'}
                </p>
                {activeJobTab === 'draft' && (
                  <button
                    onClick={() => setShowJobForm(true)}
                    className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Create your first job posting
                  </button>
                )}
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
                    setFormData({
                      title: '',
                      department: '',
                      location: '',
                      employment_type: 'full_time',
                      salary_range: '',
                      description: '',
                      requirements: '',
                      posted: true,
                      auto_expire_days: 30,
                      max_applications: 50,
                    });
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
                    value={getFieldValue('title') || ''}
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
                    value={getFieldValue('department') || ''}
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
                    value={getFieldValue('location') || ''}
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
                    value={getFieldValue('employment_type') || 'full_time'}
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
                    value={getFieldValue('salary_range') || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., $70,000 - $90,000"
                  />
                </div>

                <div>
                  <label htmlFor="auto_expire_days" className="block text-sm font-medium text-gray-700 mb-2">
                    Auto-Expire After (Days)
                  </label>
                  <select
                    id="auto_expire_days"
                    name="auto_expire_days"
                    value={getFieldValue('auto_expire_days') || 30}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={30}>30 days</option>
                    <option value={45}>45 days</option>
                    <option value={60}>60 days</option>
                    <option value={90}>90 days</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Job will automatically move to expired after this period
                  </p>
                </div>

                <div>
                  <label htmlFor="max_applications" className="block text-sm font-medium text-gray-700 mb-2">
                    Max Applications
                  </label>
                  <input
                    id="max_applications"
                    name="max_applications"
                    type="number"
                    min="1"
                    max="200"
                    value={getFieldValue('max_applications') || 50}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="50"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Job will be removed from careers page when this limit is reached
                  </p>
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
                    value={getFieldValue('description') || ''}
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
                    value={getFieldValue('requirements') || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="List the qualifications, skills, and experience required..."
                  />
                </div>

                <div className="md:col-span-2">
                  <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <input
                      id="posted"
                      name="posted"
                      type="checkbox"
                      checked={getFieldValue('posted') || false}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="posted" className="block text-sm text-gray-900">
                      <div className="font-medium">Activate and Publish to Careers Page</div>
                      <div className="text-xs text-gray-600">
                        Make this job active and visible to applicants.
                        {getFieldValue('auto_expire_days') &&
                          ` Will auto-expire after ${getFieldValue('auto_expire_days')} days.`}
                        {getFieldValue('max_applications') &&
                          ` Limited to ${getFieldValue('max_applications')} applications.`}
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
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
                      posted: true,
                      auto_expire_days: 30,
                      max_applications: 50,
                    });
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmittingJob}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingJob ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {editingJob ? 'Updating...' : 'Creating...'}
                    </div>
                  ) : editingJob ? (
                    'Update Job'
                  ) : (
                    'Create Job'
                  )}
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