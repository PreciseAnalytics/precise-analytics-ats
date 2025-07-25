// components/PreciseAnalyticsATS.js
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, 
  Briefcase, 
  Calendar, 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  MessageSquare, 
  Star,
  Download,
  Mail,
  Phone,
  MapPin,
  Clock,
  TrendingUp,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  FileText,
  ExternalLink,
  Send,
  X
} from 'lucide-react';

const PreciseAnalyticsATS = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJob, setSelectedJob] = useState('all');
  const [selectedStage, setSelectedStage] = useState('all');
  const [loading, setLoading] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  // Real data from database
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalApplications: 0,
    activeJobs: 0,
    inProgress: 0,
    offers: 0,
    stageBreakdown: {},
    recentApplications: []
  });

  const stages = ['Applied', 'Screening', 'Technical Review', 'Interview', 'Offer', 'Hired', 'Rejected'];

  // API call helper
  const apiCall = async (endpoint, options = {}) => {
    const token = localStorage.getItem('ats_token');
    const response = await fetch(endpoint, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }
    
    return response.json();
  };

  // Fetch applications from database
  const fetchApplications = async (filters = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.position && filters.position !== 'all') params.append('position', filters.position);
      if (filters.stage && filters.stage !== 'all') params.append('stage', filters.stage);

      const data = await apiCall(`/api/applications?${params.toString()}`);
      setApplications(data.applications || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch jobs from database
  const fetchJobs = async () => {
    try {
      const data = await apiCall('/api/jobs');
      setJobs(data.jobs || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  // Fetch dashboard statistics
  const fetchDashboardStats = async () => {
    try {
      const data = await apiCall('/api/dashboard');
      setDashboardStats(data.stats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchApplications();
    fetchJobs();
    fetchDashboardStats();
  }, []);

  // Auto-refresh applications every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchApplications({ 
        search: searchTerm, 
        position: selectedJob, 
        stage: selectedStage 
      });
      fetchDashboardStats();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [searchTerm, selectedJob, selectedStage]);

  // Filter applications (now done server-side, but keep for immediate UI updates)
  const filteredCandidates = useMemo(() => {
    return applications.filter(candidate => {
      const fullName = `${candidate.first_name} ${candidate.last_name}`;
      const matchesSearch = searchTerm === '' || 
        fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.position.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesJob = selectedJob === 'all' || candidate.position === selectedJob;
      const matchesStage = selectedStage === 'all' || candidate.stage === selectedStage;
      
      return matchesSearch && matchesJob && matchesStage;
    });
  }, [applications, searchTerm, selectedJob, selectedStage]);

  const getStageColor = (stage) => {
    const colors = {
      'Applied': { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)' },
      'Screening': { bg: 'rgba(251, 191, 36, 0.1)', text: '#d97706', border: 'rgba(251, 191, 36, 0.3)' },
      'Technical Review': { bg: 'rgba(147, 51, 234, 0.1)', text: '#9333ea', border: 'rgba(147, 51, 234, 0.3)' },
      'Interview': { bg: 'rgba(251, 146, 60, 0.1)', text: '#ea580c', border: 'rgba(251, 146, 60, 0.3)' },
      'Offer': { bg: 'rgba(34, 197, 94, 0.1)', text: '#16a34a', border: 'rgba(34, 197, 94, 0.3)' },
      'Hired': { bg: 'rgba(16, 185, 129, 0.1)', text: '#059669', border: 'rgba(16, 185, 129, 0.3)' },
      'Rejected': { bg: 'rgba(239, 68, 68, 0.1)', text: '#dc2626', border: 'rgba(239, 68, 68, 0.3)' }
    };
    return colors[stage] || { bg: 'rgba(107, 114, 128, 0.1)', text: '#6b7280', border: 'rgba(107, 114, 128, 0.3)' };
  };

  const getRatingStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={16}
        fill={i < Math.floor(rating || 0) ? '#fbbf24' : 'transparent'}
        color={i < Math.floor(rating || 0) ? '#fbbf24' : '#d1d5db'}
      />
    ));
  };

  const updateCandidateStage = async (candidateId, newStage) => {
    try {
      await apiCall(`/api/applications?id=${candidateId}`, {
        method: 'PUT',
        body: JSON.stringify({ stage: newStage, userId: user.id })
      });
      
      // Update local state immediately
      setApplications(prev => 
        prev.map(candidate => 
          candidate.id === candidateId 
            ? { ...candidate, stage: newStage, last_activity: new Date().toISOString().split('T')[0] }
            : candidate
        )
      );
      
      // Refresh dashboard stats
      fetchDashboardStats();
    } catch (error) {
      console.error('Error updating candidate stage:', error);
      alert('Failed to update candidate stage. Please try again.');
    }
  };

  // Handle search with debouncing
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchApplications({ 
        search: searchTerm, 
        position: selectedJob, 
        stage: selectedStage 
      });
    }, 500);
    
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, selectedJob, selectedStage]);

  const StatCard = ({ title, value, change, icon: Icon, trend = 'up' }) => (
    <div className="stat-card">
      <div className="stat-card-content">
        <div className="stat-card-data">
          <p className="stat-card-title">{title}</p>
          <p className="stat-card-value">{value}</p>
          {change && (
            <p className={`stat-card-change ${trend}`}>
              <TrendingUp size={16} />
              {change}
            </p>
          )}
        </div>
        <div className="stat-card-icon">
          <Icon size={24} />
        </div>
      </div>
    </div>
  );

  const CandidateDetailsModal = ({ candidate, onClose }) => {
    if (!candidate) return null;

    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2 className="modal-title">
              {candidate.first_name} {candidate.last_name}
            </h2>
            <p className="modal-position">{candidate.position}</p>
            <button className="close-button" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
          
          <div className="modal-body">
            {/* Contact Information */}
            <div className="modal-section">
              <div className="modal-section-grid">
                <div>
                  <h4 className="section-title">Contact Information</h4>
                  <div className="contact-info">
                    <div className="contact-item">
                      <Mail size={16} />
                      <a href={`mailto:${candidate.email}`}>{candidate.email}</a>
                    </div>
                    <div className="contact-item">
                      <Phone size={16} />
                      <a href={`tel:${candidate.phone}`}>{candidate.phone}</a>
                    </div>
                    <div className="contact-item">
                      <MapPin size={16} />
                      {candidate.location}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="section-title">Application Status</h4>
                  <div className="status-info">
                    <div className="status-item">
                      <span>Current Stage:</span>
                      <span className="stage-tag" style={{
                        background: getStageColor(candidate.stage).bg,
                        color: getStageColor(candidate.stage).text,
                        border: `1px solid ${getStageColor(candidate.stage).border}`
                      }}>
                        {candidate.stage}
                      </span>
                    </div>
                    <div className="status-item">
                      <span>Rating:</span>
                      <div className="rating-container">
                        {getRatingStars(candidate.rating)}
                        <span>{candidate.rating || 'Not rated'}</span>
                      </div>
                    </div>
                    <div className="status-item">
                      <span>Experience:</span>
                      <strong>{candidate.experience || 'Not specified'}</strong>
                    </div>
                    <div className="status-item">
                      <span>Clearance:</span>
                      <span className="clearance-tag">{candidate.clearance_level || 'None specified'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Application Message */}
            <div className="modal-section">
              <h4 className="section-title">Why they're interested</h4>
              <div className="message-box">
                <p>{candidate.message || 'No message provided'}</p>
              </div>
            </div>

            {/* Documents */}
            <div className="modal-section">
              <h4 className="section-title">Documents</h4>
              <div className="documents-container">
                {candidate.resume_url && (
                  <button className="document-button resume">
                    <FileText size={16} />
                    <span>Resume</span>
                    <Download size={16} />
                  </button>
                )}
                {candidate.cover_letter_url && (
                  <button className="document-button cover">
                    <FileText size={16} />
                    <span>Cover Letter</span>
                    <Download size={16} />
                  </button>
                )}
                {!candidate.resume_url && !candidate.cover_letter_url && (
                  <p className="no-documents">No documents attached</p>
                )}
              </div>
            </div>

            {/* Stage Management */}
            <div className="modal-section">
              <h4 className="section-title">Update Stage</h4>
              <div className="stage-buttons">
                {stages.map((stage) => (
                  <button
                    key={stage}
                    className={`stage-button ${candidate.stage === stage ? 'active' : ''}`}
                    onClick={() => updateCandidateStage(candidate.id, stage)}
                  >
                    {stage}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="modal-section">
              <div className="action-buttons">
                <button className="action-button primary">
                  <Send size={16} />
                  <span>Send Email</span>
                </button>
                <button className="action-button success">
                  <Calendar size={16} />
                  <span>Schedule Interview</span>
                </button>
                <button className="action-button warning">
                  <ExternalLink size={16} />
                  <span>View Full Profile</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const Dashboard = () => (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2 className="page-title">Dashboard Overview</h2>
        <div className="header-actions">
          <button 
            className={`refresh-button ${loading ? 'loading' : ''}`}
            onClick={() => {
              fetchApplications();
              fetchDashboardStats();
            }}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            <span>Refresh Data</span>
          </button>
          <div className="status-text">
            Live tracking • Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard
          title="Total Applications"
          value={dashboardStats.totalApplications}
          change="+3 today"
          icon={Users}
        />
        <StatCard
          title="Active Jobs"
          value={dashboardStats.activeJobs}
          change={`${jobs.length} positions open`}
          icon={Briefcase}
        />
        <StatCard
          title="In Progress"
          value={dashboardStats.inProgress}
          change="+2 this week"
          icon={Clock}
        />
        <StatCard
          title="Ready to Hire"
          value={dashboardStats.offers}
          change="1 pending response"
          icon={UserCheck}
        />
      </div>

      <div className="content-grid">
        <div className="card">
          <h3 className="card-title">Recent Applications</h3>
          <div className="applications-list">
            {dashboardStats.recentApplications.map((candidate) => (
              <div key={candidate.id} className="application-item">
                <div className="application-avatar">
                  {candidate.first_name[0]}{candidate.last_name[0]}
                </div>
                <div className="application-info">
                  <div className="application-name">{candidate.first_name} {candidate.last_name}</div>
                  <div className="application-position">{candidate.position}</div>
                </div>
                <div className="application-status">
                  <span className="stage-tag" style={{
                    background: getStageColor(candidate.stage).bg,
                    color: getStageColor(candidate.stage).text,
                    border: `1px solid ${getStageColor(candidate.stage).border}`
                  }}>
                    {candidate.stage}
                  </span>
                  <div className="application-date">
                    {new Date(candidate.applied_date).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">Pipeline Analytics</h3>
          <div className="pipeline-list">
            {stages.map((stage) => {
              const stageCount = dashboardStats.stageBreakdown[stage] || 0;
              const percentage = dashboardStats.totalApplications > 0 ? 
                (stageCount / dashboardStats.totalApplications) * 100 : 0;
              
              return (
                <div key={stage} className="pipeline-item">
                  <span className="pipeline-stage">{stage}</span>
                  <div className="pipeline-progress">
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${percentage}%` }} />
                    </div>
                    <span className="pipeline-count">{stageCount}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  const CandidateList = () => (
    <div className="candidates-container">
      <div className="candidates-header">
        <h2 className="page-title">Candidate Applications</h2>
        <div className="header-actions">
          <div className="status-text">
            {applications.length} applications • {filteredCandidates.length} shown
          </div>
          <a 
            href="/careers"
            target="_blank"
            rel="noopener noreferrer"
            className="external-link-button"
          >
            <ExternalLink size={16} />
            <span>View Careers Page</span>
          </a>
        </div>
      </div>

      <div className="card candidates-card">
        <div className="filter-container">
          <div className="search-container">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search applications..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="filter-select"
            value={selectedJob}
            onChange={(e) => setSelectedJob(e.target.value)}
          >
            <option value="all">All Positions</option>
            {jobs.map(job => (
              <option key={job.id} value={job.title}>{job.title}</option>
            ))}
          </select>
          <select
            className="filter-select"
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
          >
            <option value="all">All Stages</option>
            {stages.map(stage => (
              <option key={stage} value={stage}>{stage}</option>
            ))}
          </select>
        </div>

        <div className="table-container">
          <table className="candidates-table">
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Position</th>
                <th>Stage</th>
                <th>Rating</th>
                <th>Clearance</th>
                <th>Applied</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="loading-cell">
                    <RefreshCw size={20} className="spin" />
                    Loading applications...
                  </td>
                </tr>
              ) : filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-cell">
                    No applications match your filters
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((candidate) => (
                  <tr key={candidate.id} className="candidate-row">
                    <td>
                      <div className="candidate-cell">
                        <div className="candidate-avatar">
                          {candidate.first_name[0]}{candidate.last_name[0]}
                        </div>
                        <div className="candidate-info">
                          <div className="candidate-name">
                            {candidate.first_name} {candidate.last_name}
                          </div>
                          <div className="candidate-details">
                            <span><Mail size={12} />{candidate.email}</span>
                            <span><MapPin size={12} />{candidate.location}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="position-cell">
                        <div className="position-name">{candidate.position}</div>
                        <div className="position-experience">{candidate.experience || 'Not specified'}</div>
                      </div>
                    </td>
                    <td>
                      <span className="stage-tag" style={{
                        background: getStageColor(candidate.stage).bg,
                        color: getStageColor(candidate.stage).text,
                        border: `1px solid ${getStageColor(candidate.stage).border}`
                      }}>
                        {candidate.stage}
                      </span>
                    </td>
                    <td>
                      <div className="rating-cell">
                        {getRatingStars(candidate.rating)}
                        <span>{candidate.rating || 'N/A'}</span>
                      </div>
                    </td>
                    <td>
                      <span className="clearance-tag">{candidate.clearance_level || 'None'}</span>
                    </td>
                    <td>
                      <div className="applied-cell">
                        <div className="applied-date">
                          {new Date(candidate.applied_date).toLocaleDateString()}
                        </div>
                        <div className="applied-source">
                          via {candidate.source === 'careers_page' ? 'Careers Page' : 'Other'}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="actions-cell">
                        <button className="action-icon" onClick={() => setSelectedCandidate(candidate)} title="View Details">
                          <Eye size={16} />
                        </button>
                        <button className="action-icon" title="Send Message">
                          <MessageSquare size={16} />
                        </button>
                        <button className="action-icon" title="Download Resume">
                          <Download size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const JobsList = () => (
    <div className="jobs-container">
      <div className="jobs-header">
        <h2 className="page-title">Active Job Postings</h2>
        <div className="header-actions">
          <a 
            href="/careers"
            target="_blank"
            rel="noopener noreferrer"
            className="external-link-button success"
          >
            <ExternalLink size={16} />
            <span>View Live Careers Page</span>
          </a>
          <button className="primary-button">
            <Plus size={16} />
            <span>New Job Posting</span>
          </button>
        </div>
      </div>

      <div className="jobs-grid">
        {jobs.map((job) => {
          const jobApplications = applications.filter(c => c.position === job.title);
          return (
            <div key={job.id} className="job-card">
              <div className="job-card-header">
                <h3 className="job-title">{job.title}</h3>
                <span className={`job-status ${job.status.toLowerCase()}`}>
                  {job.status}
                </span>
              </div>
              
              <p className="job-description">{job.description}</p>
              
              <div className="job-details">
                <div className="job-detail">
                  <Briefcase size={16} />
                  {job.department}
                </div>
                <div className="job-detail">
                  <MapPin size={16} />
                  {job.location}
                </div>
                <div className="job-detail">
                  <Clock size={16} />
                  Posted {new Date(job.created_at).toLocaleDateString()}
                </div>
              </div>

              <div className="job-metrics">
                <div className="job-metric">
                  <div className="metric-value">{job.openings}</div>
                  <div className="metric-label">Openings</div>
                </div>
                <div className="job-metric">
                  <div className="metric-value applications">{job.application_count || 0}</div>
                  <div className="metric-label">Applications</div>
                </div>
                <div className="job-metric">
                  <div className="metric-value progress">
                    {jobApplications.filter(c => ['Interview', 'Offer'].includes(c.stage)).length}
                  </div>
                  <div className="metric-label">In Progress</div>
                </div>
              </div>

              <div className="job-actions">
                <button 
                  className="secondary-button"
                  onClick={() => {
                    setSelectedJob(job.title);
                    setActiveTab('candidates');
                  }}
                >
                  View Applications
                </button>
                <button className="outline-button">
                  Edit Job
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="ats-wrapper">
      <style jsx>{`
        .ats-wrapper {
          min-height: 100vh;
          background: #f8fafc;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        /* Header Styles */
        .header {
          background: rgba(255, 255, 255, 0.95);
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
          backdrop-filter: blur(10px);
        }

        .header-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 20px;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          height: 70px;
        }

        .logo-section {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .logo {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #ff7d00, #ffa500);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 16px;
        }

        .logo-text {
          display: flex;
          flex-direction: column;
        }

        .company-name {
          font-size: 20px;
          font-weight: 700;
          color: #1f2937;
          margin: 0;
        }

        .system-name {
          font-size: 12px;
          color: #6b7280;
          margin: 0;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 15px;
          background: rgba(255, 125, 0, 0.1);
          border-radius: 20px;
        }

        .user-name {
          font-size: 14px;
          font-weight: 500;
          color: #ff7d00;
        }

        .logout-button {
          background: none;
          border: 1px solid #ff7d00;
          color: #ff7d00;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .logout-button:hover {
          background: #ff7d00;
          color: white;
        }

        .certification-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #6b7280;
        }

        .live-indicator {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          color: #9ca3af;
        }

        .live-dot {
          width: 8px;
          height: 8px;
          background: #22c55e;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        /* Navigation Styles */
        .navigation {
          background: rgba(255, 255, 255, 0.9);
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        }

        .navigation-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 20px;
        }

        .navigation-tabs {
          display: flex;
          gap: 20px;
        }

        .navigation-tab {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 20px 5px;
          border: none;
          background: none;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.3s ease;
          white-space: nowrap;
        }

        .navigation-tab.active {
          color: #ff7d00;
          border-bottom-color: #ff7d00;
        }

        .navigation-tab:not(.active) {
          color: #6b7280;
        }

        .navigation-tab:hover:not(.active) {
          color: #1f2937;
        }

        /* Main Content Styles */
        .main-content {
          padding: 40px 0 80px;
        }

        .container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 20px;
        }

        .page-title {
          font-size: 32px;
          font-weight: 700;
          color: #1f2937;
          margin: 0;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .status-text {
          font-size: 14px;
          color: #6b7280;
        }

        /* Button Styles */
        .primary-button {
          background: linear-gradient(135deg, #ff7d00, #ffa500);
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.3s ease;
        }

        .primary-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(255, 125, 0, 0.3);
        }

        .secondary-button {
          background: rgba(255, 125, 0, 0.1);
          color: #ff7d00;
          border: none;
          padding: 10px 18px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .secondary-button:hover {
          background: rgba(255, 125, 0, 0.2);
          transform: translateY(-1px);
        }

        .outline-button {
          background: transparent;
          color: #6b7280;
          border: 1px solid rgba(0, 0, 0, 0.2);
          padding: 10px 18px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .outline-button:hover {
          background: rgba(0, 0, 0, 0.05);
          color: #1f2937;
        }

        .refresh-button {
          background: #ff7d00;
          color: white;
          border: none;
          padding: 10px 18px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.3s ease;
        }

        .refresh-button:hover:not(:disabled) {
          background: #ffa500;
          transform: translateY(-2px);
        }

        .refresh-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .external-link-button {
          background: #22c55e;
          color: white;
          border: none;
          padding: 10px 18px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          transition: all 0.3s ease;
        }

        .external-link-button:hover {
          background: #16a34a;
          transform: translateY(-2px);
        }

        .external-link-button.success {
          background: #22c55e;
        }

        /* Dashboard Styles */
        .dashboard-container {
          display: flex;
          flex-direction: column;
          gap: 30px;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }

        .stat-card {
          background: rgba(255, 255, 255, 0.9);
          border-radius: 16px;
          padding: 25px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          border-left: 4px solid #ff7d00;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .stat-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }

        .stat-card-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .stat-card-data {
          flex: 1;
        }

        .stat-card-title {
          font-size: 14px;
          font-weight: 500;
          color: #6b7280;
          margin: 0 0 8px 0;
        }

        .stat-card-value {
          font-size: 30px;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 8px 0;
        }

        .stat-card-change {
          font-size: 13px;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .stat-card-change.up {
          color: #22c55e;
        }

        .stat-card-change.down {
          color: #ef4444;
        }

        .stat-card-icon {
          background: rgba(255, 125, 0, 0.1);
          padding: 15px;
          border-radius: 50%;
          color: #ff7d00;
        }

        .content-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
        }

        .card {
          background: rgba(255, 255, 255, 0.9);
          border-radius: 16px;
          padding: 25px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }

        .card-title {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 20px 0;
        }

        .applications-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .application-item {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 15px;
          background: rgba(248, 250, 252, 0.5);
          border-radius: 10px;
          transition: background 0.3s ease;
        }

        .application-item:hover {
          background: rgba(248, 250, 252, 0.8);
        }

        .application-avatar {
          width: 40px;
          height: 40px;
          background: rgba(255, 125, 0, 0.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ff7d00;
          font-weight: 600;
          font-size: 14px;
        }

        .application-info {
          flex: 1;
        }

        .application-name {
          font-size: 15px;
          font-weight: 500;
          color: #1f2937;
          margin-bottom: 4px;
        }

        .application-position {
          font-size: 13px;
          color: #6b7280;
        }

        .application-status {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
        }

        .application-date {
          font-size: 12px;
          color: #9ca3af;
        }

        .stage-tag {
          padding: 4px 8px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          border: 1px solid;
        }

        .pipeline-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .pipeline-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .pipeline-stage {
          font-size: 14px;
          font-weight: 500;
          color: #1f2937;
        }

        .pipeline-progress {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .progress-bar {
          width: 100px;
          height: 8px;
          background: rgba(0, 0, 0, 0.1);
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: #ff7d00;
          border-radius: 4px;
          transition: width 0.5s ease;
        }

        .pipeline-count {
          font-size: 14px;
          font-weight: 500;
          color: #6b7280;
          min-width: 20px;
        }

        /* Candidates Page Styles */
        .candidates-container {
          display: flex;
          flex-direction: column;
          gap: 30px;
        }

        .candidates-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .candidates-card {
          padding: 30px;
        }

        .filter-container {
          display: flex;
          gap: 20px;
          margin-bottom: 30px;
        }

        .search-container {
          position: relative;
          flex: 1;
        }

        .search-container svg {
          position: absolute;
          left: 15px;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
        }

        .search-input {
          width: 100%;
          padding: 15px 15px 15px 45px;
          font-size: 16px;
          border: 2px solid rgba(0, 0, 0, 0.2);
          border-radius: 10px;
          background: rgba(248, 250, 252, 0.9);
          color: #1f2937;
          transition: border-color 0.3s ease;
        }

        .search-input:focus {
          outline: none;
          border-color: #ff7d00;
        }

        .search-input::placeholder {
          color: #9ca3af;
        }

        .filter-select {
          padding: 15px;
          font-size: 14px;
          border: 2px solid rgba(0, 0, 0, 0.2);
          border-radius: 10px;
          background: rgba(248, 250, 252, 0.9);
          color: #1f2937;
          cursor: pointer;
          transition: border-color 0.3s ease;
        }

        .filter-select:focus {
          outline: none;
          border-color: #ff7d00;
        }

        .table-container {
          overflow-x: auto;
        }

        .candidates-table {
          width: 100%;
          border-collapse: collapse;
        }

        .candidates-table th {
          text-align: left;
          padding: 15px 20px;
          font-size: 14px;
          font-weight: 600;
          color: #6b7280;
          border-bottom: 2px solid rgba(0, 0, 0, 0.1);
          white-space: nowrap;
        }

        .candidate-row {
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
          transition: background 0.3s ease;
        }

        .candidate-row:hover {
          background: rgba(248, 250, 252, 0.5);
        }

        .candidate-row td {
          padding: 20px;
          vertical-align: middle;
        }

        .loading-cell, .empty-cell {
          text-align: center;
          padding: 40px 20px;
          color: #6b7280;
          font-size: 16px;
        }

        .loading-cell {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .candidate-cell {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .candidate-avatar {
          width: 40px;
          height: 40px;
          background: rgba(255, 125, 0, 0.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ff7d00;
          font-weight: 600;
          font-size: 14px;
        }

        .candidate-info {
          flex: 1;
        }

        .candidate-name {
          font-size: 15px;
          font-weight: 500;
          color: #1f2937;
          margin-bottom: 6px;
        }

        .candidate-details {
          display: flex;
          gap: 20px;
          font-size: 13px;
          color: #6b7280;
        }

        .candidate-details span {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .position-cell {
        }

        .position-name {
          font-size: 15px;
          font-weight: 500;
          color: #1f2937;
          margin-bottom: 4px;
        }

        .position-experience {
          font-size: 13px;
          color: #6b7280;
        }

        .rating-cell {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .rating-cell span {
          font-size: 13px;
          color: #6b7280;
        }

        .clearance-tag {
          background: rgba(34, 197, 94, 0.1);
          color: #16a34a;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 13px;
          font-weight: 500;
        }

        .applied-cell {
        }

        .applied-date {
          font-size: 14px;
          color: #1f2937;
          margin-bottom: 4px;
        }

        .applied-source {
          font-size: 12px;
          color: #9ca3af;
        }

        .actions-cell {
          display: flex;
          gap: 8px;
        }

        .action-icon {
          background: none;
          border: none;
          padding: 8px;
          border-radius: 6px;
          cursor: pointer;
          color: #6b7280;
          transition: all 0.3s ease;
        }

        .action-icon:hover {
          background: rgba(0, 0, 0, 0.1);
          color: #1f2937;
        }

        /* Jobs Page Styles */
        .jobs-container {
          display: flex;
          flex-direction: column;
          gap: 30px;
        }

        .jobs-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .jobs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 30px;
        }

        .job-card {
          background: rgba(255, 255, 255, 0.9);
          border-radius: 16px;
          padding: 30px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          border-left: 4px solid #ff7d00;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .job-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }

        .job-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
        }

        .job-title {
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
        }

        .job-status {
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
        }

        .job-status.active {
          background: rgba(34, 197, 94, 0.1);
          color: #16a34a;
        }

        .job-description {
          font-size: 14px;
          line-height: 1.6;
          color: #6b7280;
          margin-bottom: 20px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .job-details {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 20px;
        }

        .job-detail {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #6b7280;
        }

        .job-metrics {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .job-metric {
          text-align: center;
        }

        .metric-value {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .metric-value {
          color: #ff7d00;
        }

        .metric-value.applications {
          color: #22c55e;
        }

        .metric-value.progress {
          color: #f59e0b;
        }

        .metric-label {
          font-size: 12px;
          color: #6b7280;
        }

        .job-actions {
          display: flex;
          gap: 10px;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-content {
          background: rgba(255, 255, 255, 0.98);
          border-radius: 20px;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
          max-width: 800px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
        }

        .modal-header {
          padding: 30px 30px 20px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
          position: relative;
        }

        .modal-title {
          font-size: 24px;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 5px 0;
        }

        .modal-position {
          font-size: 16px;
          color: #6b7280;
          margin: 0;
        }

        .close-button {
          position: absolute;
          top: 20px;
          right: 20px;
          background: none;
          border: none;
          color: #6b7280;
          cursor: pointer;
          padding: 5px;
          border-radius: 5px;
          transition: all 0.3s ease;
        }

        .close-button:hover {
          background: rgba(0, 0, 0, 0.1);
          color: #1f2937;
        }

        .modal-body {
          padding: 0 30px 30px;
          display: flex;
          flex-direction: column;
          gap: 30px;
        }

        .modal-section {
        }

        .modal-section-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
        }

        .section-title {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 15px;
        }

        .contact-info {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .contact-item {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #6b7280;
        }

        .contact-item a {
          color: #ff7d00;
          text-decoration: none;
        }

        .contact-item a:hover {
          text-decoration: underline;
        }

        .status-info {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .status-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: #6b7280;
        }

        .status-item span:first-child {
          color: #6b7280;
        }

        .status-item strong {
          color: #1f2937;
        }

        .rating-container {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .message-box {
          background: rgba(248, 250, 252, 0.7);
          border-radius: 10px;
          padding: 20px;
        }

        .message-box p {
          font-size: 15px;
          line-height: 1.6;
          color: #6b7280;
          margin: 0;
        }

        .documents-container {
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
        }

        .document-button {
          display: flex;
          align-items: center;
          gap: 8px;
          border: none;
          padding: 12px 18px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .document-button.resume {
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
        }

        .document-button.resume:hover {
          background: rgba(59, 130, 246, 0.2);
        }

        .document-button.cover {
          background: rgba(34, 197, 94, 0.1);
          color: #16a34a;
        }

        .document-button.cover:hover {
          background: rgba(34, 197, 94, 0.2);
        }

        .no-documents {
          color: #9ca3af;
          font-style: italic;
        }

        .stage-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .stage-button {
          border: none;
          padding: 8px 15px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .stage-button:not(.active) {
          background: rgba(0, 0, 0, 0.1);
          color: #6b7280;
        }

        .stage-button:not(.active):hover {
          background: rgba(0, 0, 0, 0.2);
        }

        .stage-button.active {
          background: #ff7d00;
          color: white;
        }

        .stage-button.active:hover {
          background: #ffa500;
        }

        .action-buttons {
          display: flex;
          gap: 15px;
          padding-top: 20px;
          border-top: 1px solid rgba(0, 0, 0, 0.1);
        }

        .action-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          border: none;
          transition: all 0.3s ease;
        }

        .action-button.primary {
          background: #ff7d00;
          color: white;
        }

        .action-button.primary:hover {
          background: #ffa500;
          transform: translateY(-2px);
        }

        .action-button.success {
          background: #22c55e;
          color: white;
        }

        .action-button.success:hover {
          background: #16a34a;
          transform: translateY(-2px);
        }

        .action-button.warning {
          background: #f59e0b;
          color: white;
        }

        .action-button.warning:hover {
          background: #d97706;
          transform: translateY(-2px);
        }

        /* Empty State Styles */
        .empty-state {
          text-align: center;
          padding: 80px 20px;
          color: #9ca3af;
        }

        .empty-state-title {
          font-size: 20px;
          font-weight: 500;
          color: #1f2937;
          margin: 20px 0 10px;
        }

        .empty-state-text {
          font-size: 16px;
          color: #6b7280;
          margin: 0;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .header-right {
            gap: 10px;
          }

          .certification-badge {
            display: none;
          }

          .navigation-tabs {
            gap: 0;
            overflow-x: auto;
          }

          .navigation-tab {
            padding: 15px 10px;
            font-size: 12px;
          }

          .page-title {
            font-size: 24px;
          }

          .header-actions {
            flex-direction: column;
            align-items: flex-end;
            gap: 10px;
          }

          .stats-grid {
            grid-template-columns: 1fr;
            gap: 15px;
          }

          .stat-card {
            padding: 20px;
          }

          .stat-card-value {
            font-size: 24px;
          }

          .content-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .card {
            padding: 20px;
          }

          .progress-bar {
            width: 60px;
          }

          .filter-container {
            flex-direction: column;
            gap: 15px;
          }

          .candidates-card {
            padding: 20px;
          }

          .candidates-table th {
            padding: 10px;
            font-size: 12px;
          }

          .candidate-row td {
            padding: 15px 10px;
          }

          .candidate-details {
            flex-direction: column;
            gap: 4px;
          }

          .jobs-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .job-card {
            padding: 20px;
          }

          .job-title {
            font-size: 18px;
          }

          .job-actions {
            flex-direction: column;
          }

          .modal-section-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .modal-body {
            padding: 0 20px 20px;
            gap: 20px;
          }

          .action-buttons {
            flex-direction: column;
          }
        }
      `}</style>

      {/* Header */}
      <header className="header">
        <div className="header-container">
          <div className="header-content">
            <div className="logo-section">
              <div className="logo">PA</div>
              <div className="logo-text">
                <h1 className="company-name">Precise Analytics</h1>
                <p className="system-name">Applicant Tracking System</p>
              </div>
            </div>
            
            <div className="header-right">
              <div className="user-info">
                <span className="user-name">Welcome, {user?.name || 'Admin'}</span>
                <button className="logout-button" onClick={onLogout}>
                  Logout
                </button>
              </div>
              <div className="certification-badge">
                <CheckCircle2 size={16} />
                <span>SDVOSB Certified • Federal Ready</span>
              </div>
              <div className="live-indicator">
                <div className="live-dot" />
                <span>Live Tracking</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="navigation">
        <div className="navigation-container">
          <div className="navigation-tabs">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
              { id: 'candidates', label: 'Applications', icon: Users },
              { id: 'jobs', label: 'Job Postings', icon: Briefcase },
              { id: 'analytics', label: 'Analytics', icon: Calendar }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={`navigation-tab ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        <div className="container">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'candidates' && <CandidateList />}
          {activeTab === 'jobs' && <JobsList />}
          {activeTab === 'analytics' && (
            <div className="empty-state">
              <TrendingUp size={48} />
              <h3 className="empty-state-title">Advanced Analytics</h3>
              <p className="empty-state-text">Detailed reporting and analytics dashboard coming soon.</p>
            </div>
          )}
        </div>
      </main>

      {/* Candidate Details Modal */}
      <CandidateDetailsModal 
        candidate={selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
      />
    </div>
  );
};

export default PreciseAnalyticsATS;