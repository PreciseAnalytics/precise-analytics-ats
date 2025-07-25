'use client';

import React, { useState, useEffect } from 'react';
import { Lock, Users, Search, UserPlus, FileText, BarChart3 } from 'lucide-react';

// Define types for your application
type User = {
  id: string;
  name?: string;
  email: string;
};

type Application = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  position: string;
  location: string;
  stage: string;
  applied_date: string;
  source: string;
};

type LoginData = {
  email: string;
  password: string;
};

type StageColors = {
  bg: string;
  text: string;
  border: string;
};

export default function PreciseAnalyticsATSHomepage() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginData, setLoginData] = useState<LoginData>({ email: '', password: '' });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // Added filter state
  // Add these state variables with your existing ones (around line 37-43)
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordStatus, setForgotPasswordStatus] = useState('');

  // Theme matching your branding - More muted and professional
  const theme = {
    primaryGreen: '#7BA428', // More muted green
    primaryOrange: '#E6650D', // More muted orange  
    darkBlue: '#2B4566',
    tealAccent: '#2D9B95', // More muted teal
    gradient: 'linear-gradient(135deg, #7BA428, #2D9B95)',
    orangeGradient: 'linear-gradient(135deg, #E6650D, #F07B3C)',
    textColor: 'rgb(51, 65, 85)',
    textLight: 'rgba(51, 65, 85, 0.7)',
    textMuted: 'rgba(51, 65, 85, 0.5)',
    cardBackground: 'rgba(255, 255, 255, 0.98)',
    background: 'rgb(248, 250, 252)',
    backgroundSecondary: 'rgb(241, 245, 249)',
    shadowSm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    shadowMd: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    shadowLg: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    borderLight: 'rgba(226, 232, 240, 0.8)',
    success: '#059669',
    warning: '#D97706', 
    danger: '#DC2626',
    info: '#0284C7'
  };

  // Check for existing authentication on component mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/verify');
      const result = await response.json();
      
      if (result.success) {
        setIsLoggedIn(true);
        setUser(result.user);
        await fetchApplications();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      const result = await response.json();

      if (result.success) {
        setIsLoggedIn(true);
        setUser(result.user);
        setIsLoginOpen(false);
        setLoginData({ email: '', password: '' });
        await fetchApplications();
      } else {
        setLoginError(result.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Add this after handleLogin function
  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail) {
      setForgotPasswordStatus('Please enter your email address');
      return;
    }

    setIsLoading(true);
    setForgotPasswordStatus('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotPasswordEmail }),
      });

      const result = await response.json();

      if (result.success || result.message) {
        setForgotPasswordStatus('✅ Password reset instructions sent to your email');
        setTimeout(() => {
          setShowForgotPassword(false);
          setForgotPasswordEmail('');
          setForgotPasswordStatus('');
        }, 3000);
      } else {
        setForgotPasswordStatus(result.error || 'Failed to send reset instructions');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      setForgotPasswordStatus('Network error. Please contact your administrator.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/applications');
      const result = await response.json();
      
      if (result.success) {
        setApplications(result.applications);
      } else {
        console.error('Failed to fetch applications:', result.error);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/login', { method: 'DELETE' });
      setIsLoggedIn(false);
      setUser(null);
      setApplications([]);
      setActiveFilter('all'); // Reset filter on logout
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggedIn(false);
      setUser(null);
      setApplications([]);
      setActiveFilter('all');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStageColors = (stage: string): StageColors => {
    const colors: Record<string, StageColors> = {
      'applied': { bg: 'rgba(59, 130, 246, 0.08)', text: '#1D4ED8', border: 'rgba(59, 130, 246, 0.2)' },
      'submitted': { bg: 'rgba(59, 130, 246, 0.08)', text: '#1D4ED8', border: 'rgba(59, 130, 246, 0.2)' },
      'screening': { bg: 'rgba(217, 119, 6, 0.08)', text: '#A16207', border: 'rgba(217, 119, 6, 0.2)' },
      'technical review': { bg: 'rgba(147, 51, 234, 0.08)', text: '#7C2D12', border: 'rgba(147, 51, 234, 0.2)' },
      'interview': { bg: 'rgba(230, 101, 13, 0.08)', text: '#C2410C', border: 'rgba(230, 101, 13, 0.2)' },
      'offer': { bg: 'rgba(5, 150, 105, 0.08)', text: '#047857', border: 'rgba(5, 150, 105, 0.2)' },
      'hired': { bg: 'rgba(5, 150, 105, 0.12)', text: '#065F46', border: 'rgba(5, 150, 105, 0.3)' },
      'rejected': { bg: 'rgba(220, 38, 38, 0.08)', text: '#B91C1C', border: 'rgba(220, 38, 38, 0.2)' }
    };
    return colors[stage.toLowerCase()] || colors['applied'];
  };

  // Create dots pattern for logo
  const createDotsPattern = () => {
    const pattern = [
      [0,1,0,1,0],
      [1,1,1,1,1],
      [0,1,1,1,0],
      [1,1,1,1,1],
      [0,1,0,1,0]
    ];
    
    return pattern.map((row, i) => 
      row.map((dot, j) => (
        <div 
          key={`${i}-${j}`} 
          style={{ 
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            opacity: dot ? 1 : 0.2,
            background: dot ? theme.tealAccent : 'rgba(64, 224, 208, 0.2)'
          }} 
        />
      ))
    ).flat();
  };

  const ApplicationsDashboard = () => {
    // Filter applications based on active filter
    const getFilteredApplications = () => {
      switch (activeFilter) {
        case 'in_review':
          return applications.filter(app => app.stage === 'interview');
        case 'new_today':
          return applications.filter(app => 
            new Date(app.applied_date).toDateString() === new Date().toDateString()
          );
        case 'all':
        default:
          return applications;
      }
    };

    const filteredApplications = getFilteredApplications();

    // Calculate stats
    const totalApplications = applications.length;
    const inReviewCount = applications.filter(app => app.stage === 'interview').length;
    const newTodayCount = applications.filter(app => 
      new Date(app.applied_date).toDateString() === new Date().toDateString()
    ).length;

    // Handle filter clicks
    const handleFilterClick = (filterType: string) => {
      setActiveFilter(activeFilter === filterType ? 'all' : filterType);
    };

    return (
      <div style={{ 
        background: theme.backgroundSecondary,
        minHeight: 'calc(100vh - 120px)',
        padding: '2rem 0'
      }}>
        <div style={{ 
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 2rem'
        }}>
          {/* Header Section */}
          <div style={{
            background: theme.cardBackground,
            borderRadius: '16px',
            padding: '2rem',
            marginBottom: '2rem',
            boxShadow: theme.shadowMd,
            border: `1px solid ${theme.borderLight}`
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div>
                <h1 style={{
                  fontSize: '2.5rem',
                  fontWeight: '700',
                  color: theme.textColor,
                  margin: '0 0 0.5rem 0',
                  letterSpacing: '-0.025em'
                }}>
                  Applications Dashboard
                </h1>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  flexWrap: 'wrap'
                }}>
                  <p style={{
                    color: theme.textLight,
                    margin: 0,
                    fontSize: '1.1rem'
                  }}>
                    Welcome back, <span style={{ fontWeight: '600', color: theme.textColor }}>{user?.name || user?.email}</span>
                  </p>
                  {activeFilter !== 'all' && (
                    <button
                      onClick={() => setActiveFilter('all')}
                      style={{
                        background: 'rgba(220, 38, 38, 0.05)',
                        color: theme.danger,
                        border: `1px solid rgba(220, 38, 38, 0.15)`,
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: '500',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = 'rgba(220, 38, 38, 0.1)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'rgba(220, 38, 38, 0.05)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      Clear Filter ×
                    </button>
                  )}
                </div>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  background: 'rgba(220, 38, 38, 0.05)',
                  color: theme.danger,
                  border: `1px solid rgba(220, 38, 38, 0.15)`,
                  padding: '0.75rem 1.5rem',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '1rem',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(220, 38, 38, 0.1)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(220, 38, 38, 0.05)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                Logout
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            {/* Total Applications Card */}
            <div 
              onClick={() => handleFilterClick('all')}
              style={{
                background: activeFilter === 'all' ? 
                  `linear-gradient(135deg, rgba(123, 164, 40, 0.05), rgba(45, 155, 149, 0.05))` : 
                  theme.cardBackground,
                padding: '2rem',
                borderRadius: '16px',
                boxShadow: activeFilter === 'all' ? theme.shadowLg : theme.shadowMd,
                cursor: 'pointer',
                border: activeFilter === 'all' ? 
                  `2px solid rgba(123, 164, 40, 0.2)` : 
                  `1px solid ${theme.borderLight}`,
                transition: 'all 0.3s ease',
                transform: activeFilter === 'all' ? 'translateY(-4px)' : 'translateY(0)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseOver={(e) => {
                if (activeFilter !== 'all') {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = theme.shadowLg;
                }
              }}
              onMouseOut={(e) => {
                if (activeFilter !== 'all') {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = theme.shadowMd;
                }
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem'
              }}>
                <h3 style={{ 
                  color: theme.textColor, 
                  margin: 0,
                  fontSize: '1.1rem',
                  fontWeight: '600'
                }}>Total Applications</h3>
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: theme.primaryGreen,
                  opacity: activeFilter === 'all' ? 1 : 0.3
                }} />
              </div>
              <p style={{ 
                fontSize: '3rem', 
                fontWeight: '800', 
                color: theme.primaryGreen, 
                margin: '0 0 0.5rem 0',
                lineHeight: 1
              }}>
                {totalApplications}
              </p>
              <p style={{ 
                fontSize: '0.9rem', 
                color: theme.textMuted, 
                margin: 0
              }}>
                Click to view all applications
              </p>
            </div>

            {/* In Review Card */}
            <div 
              onClick={() => handleFilterClick('in_review')}
              style={{
                background: activeFilter === 'in_review' ? 
                  `linear-gradient(135deg, rgba(230, 101, 13, 0.05), rgba(240, 123, 60, 0.05))` : 
                  theme.cardBackground,
                padding: '2rem',
                borderRadius: '16px',
                boxShadow: activeFilter === 'in_review' ? theme.shadowLg : theme.shadowMd,
                cursor: 'pointer',
                border: activeFilter === 'in_review' ? 
                  `2px solid rgba(230, 101, 13, 0.2)` : 
                  `1px solid ${theme.borderLight}`,
                transition: 'all 0.3s ease',
                transform: activeFilter === 'in_review' ? 'translateY(-4px)' : 'translateY(0)'
              }}
              onMouseOver={(e) => {
                if (activeFilter !== 'in_review') {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = theme.shadowLg;
                }
              }}
              onMouseOut={(e) => {
                if (activeFilter !== 'in_review') {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = theme.shadowMd;
                }
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem'
              }}>
                <h3 style={{ 
                  color: theme.textColor, 
                  margin: 0,
                  fontSize: '1.1rem',
                  fontWeight: '600'
                }}>In Review</h3>
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: theme.primaryOrange,
                  opacity: activeFilter === 'in_review' ? 1 : 0.3
                }} />
              </div>
              <p style={{ 
                fontSize: '3rem', 
                fontWeight: '800', 
                color: theme.primaryOrange, 
                margin: '0 0 0.5rem 0',
                lineHeight: 1
              }}>
                {inReviewCount}
              </p>
              <p style={{ 
                fontSize: '0.9rem', 
                color: theme.textMuted, 
                margin: 0
              }}>
                Applications in interview stage
              </p>
            </div>

            {/* New Today Card */}
            <div 
              onClick={() => handleFilterClick('new_today')}
              style={{
                background: activeFilter === 'new_today' ? 
                  `linear-gradient(135deg, rgba(45, 155, 149, 0.05), rgba(72, 187, 120, 0.05))` : 
                  theme.cardBackground,
                padding: '2rem',
                borderRadius: '16px',
                boxShadow: activeFilter === 'new_today' ? theme.shadowLg : theme.shadowMd,
                cursor: 'pointer',
                border: activeFilter === 'new_today' ? 
                  `2px solid rgba(45, 155, 149, 0.2)` : 
                  `1px solid ${theme.borderLight}`,
                transition: 'all 0.3s ease',
                transform: activeFilter === 'new_today' ? 'translateY(-4px)' : 'translateY(0)'
              }}
              onMouseOver={(e) => {
                if (activeFilter !== 'new_today') {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = theme.shadowLg;
                }
              }}
              onMouseOut={(e) => {
                if (activeFilter !== 'new_today') {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = theme.shadowMd;
                }
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem'
              }}>
                <h3 style={{ 
                  color: theme.textColor, 
                  margin: 0,
                  fontSize: '1.1rem',
                  fontWeight: '600'
                }}>New Today</h3>
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: theme.tealAccent,
                  opacity: activeFilter === 'new_today' ? 1 : 0.3
                }} />
              </div>
              <p style={{ 
                fontSize: '3rem', 
                fontWeight: '800', 
                color: theme.tealAccent, 
                margin: '0 0 0.5rem 0',
                lineHeight: 1
              }}>
                {newTodayCount}
              </p>
              <p style={{ 
                fontSize: '0.9rem', 
                color: theme.textMuted, 
                margin: 0
              }}>
                Applications received today
              </p>
            </div>
          </div>

          {/* Applications Table */}
          <div style={{
            background: theme.cardBackground,
            borderRadius: '16px',
            boxShadow: theme.shadowMd,
            overflow: 'hidden',
            border: `1px solid ${theme.borderLight}`
          }}>
            <div style={{
              padding: '2rem',
              borderBottom: `1px solid ${theme.borderLight}`,
              background: `linear-gradient(135deg, rgba(123, 164, 40, 0.02), rgba(45, 155, 149, 0.02))`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div>
                <h2 style={{
                  fontSize: '1.8rem',
                  fontWeight: '700',
                  color: theme.textColor,
                  margin: '0 0 0.25rem 0'
                }}>
                  {activeFilter === 'all' && 'All Applications'}
                  {activeFilter === 'in_review' && 'Applications In Review'}
                  {activeFilter === 'new_today' && 'Today\'s Applications'}
                </h2>
                <p style={{
                  fontSize: '1rem',
                  color: theme.textLight,
                  margin: 0
                }}>
                  Manage and track candidate applications
                </p>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <span style={{
                  fontSize: '0.9rem',
                  color: theme.textLight,
                  background: `rgba(123, 164, 40, 0.05)`,
                  padding: '0.5rem 1rem',
                  borderRadius: '25px',
                  border: `1px solid rgba(123, 164, 40, 0.1)`,
                  fontWeight: '500'
                }}>
                  {filteredApplications.length} {filteredApplications.length === 1 ? 'application' : 'applications'}
                </span>
              </div>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: theme.backgroundSecondary }}>
                  <tr>
                    <th style={{
                      padding: '1.25rem 1.5rem',
                      textAlign: 'left',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: theme.textLight,
                      letterSpacing: '0.025em',
                      textTransform: 'uppercase'
                    }}>Candidate</th>
                    <th style={{
                      padding: '1.25rem 1.5rem',
                      textAlign: 'left',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: theme.textLight,
                      letterSpacing: '0.025em',
                      textTransform: 'uppercase'
                    }}>Position</th>
                    <th style={{
                      padding: '1.25rem 1.5rem',
                      textAlign: 'left',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: theme.textLight,
                      letterSpacing: '0.025em',
                      textTransform: 'uppercase'
                    }}>Stage</th>
                    <th style={{
                      padding: '1.25rem 1.5rem',
                      textAlign: 'left',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: theme.textLight,
                      letterSpacing: '0.025em',
                      textTransform: 'uppercase'
                    }}>Applied</th>
                    <th style={{
                      padding: '1.25rem 1.5rem',
                      textAlign: 'left',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: theme.textLight,
                      letterSpacing: '0.025em',
                      textTransform: 'uppercase'
                    }}>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplications.map((application, index) => {
                    const stageColors = getStageColors(application.stage);
                    return (
                      <tr 
                        key={application.id} 
                        style={{
                          borderBottom: `1px solid ${theme.borderLight}`,
                          transition: 'background 0.2s ease'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.background = 'rgba(123, 164, 40, 0.02)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <td style={{ padding: '1.5rem' }}>
                          <div>
                            <div style={{
                              fontSize: '1rem',
                              fontWeight: '600',
                              color: theme.textColor,
                              marginBottom: '0.25rem'
                            }}>
                              {application.first_name} {application.last_name}
                            </div>
                            <div style={{
                              fontSize: '0.875rem',
                              color: theme.textLight
                            }}>
                              {application.email}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '1.5rem' }}>
                          <div style={{
                            fontSize: '0.95rem',
                            fontWeight: '500',
                            color: theme.textColor,
                            marginBottom: '0.25rem'
                          }}>
                            {application.position}
                          </div>
                          <div style={{
                            fontSize: '0.875rem',
                            color: theme.textLight
                          }}>
                            {application.location}
                          </div>
                        </td>
                        <td style={{ padding: '1.5rem' }}>
                          <span style={{
                            display: 'inline-flex',
                            padding: '0.5rem 1rem',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            borderRadius: '20px',
                            background: stageColors.bg,
                            color: stageColors.text,
                            border: `1px solid ${stageColors.border}`,
                            textTransform: 'capitalize'
                          }}>
                            {application.stage}
                          </span>
                        </td>
                        <td style={{ 
                          padding: '1.5rem',
                          fontSize: '0.95rem',
                          color: theme.textLight,
                          fontWeight: '500'
                        }}>
                          {formatDate(application.applied_date)}
                        </td>
                        <td style={{ 
                          padding: '1.5rem',
                          fontSize: '0.875rem',
                          color: theme.textMuted,
                          textTransform: 'capitalize'
                        }}>
                          {application.source.replace('_', ' ')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              {filteredApplications.length === 0 && (
                <div style={{
                  padding: '4rem 2rem',
                  textAlign: 'center',
                  color: theme.textLight
                }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    background: `rgba(123, 164, 40, 0.1)`,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.5rem',
                    border: `2px solid rgba(123, 164, 40, 0.2)`
                  }}>
                    <Search size={24} color={theme.primaryGreen} />
                  </div>
                  <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: theme.textColor,
                    margin: '0 0 0.5rem 0'
                  }}>
                    {activeFilter === 'all' && 'No applications found'}
                    {activeFilter === 'in_review' && 'No applications in review'}
                    {activeFilter === 'new_today' && 'No new applications today'}
                  </h3>
                  <p style={{
                    color: theme.textLight,
                    margin: 0,
                    fontSize: '1rem'
                  }}>
                    {activeFilter === 'all' && 'Applications from your careers page will appear here.'}
                    {activeFilter === 'in_review' && 'Applications will appear here when they reach interview stage.'}
                    {activeFilter === 'new_today' && 'Check back later for today\'s applications.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const quickActions = [
    { icon: <Search size={24} />, title: 'View Applications', description: 'Browse candidates' },
    { icon: <UserPlus size={24} />, title: 'Add Position', description: 'Create job posting' },
    { icon: <FileText size={24} />, title: 'Reports', description: 'Generate analytics' },
    { icon: <BarChart3 size={24} />, title: 'Pipeline', description: 'Track progress' }
  ];

  if (isLoggedIn) {
    return (
      <div style={{ 
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${theme.darkBlue} 0%, #1F2937 100%)`,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <header style={{
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
          padding: '1rem 0',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}>
          <div style={{
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '0 2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1.5rem'
            }}>
              <div style={{
                background: 'rgba(43, 69, 102, 0.8)',
                padding: '1rem',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minWidth: '200px',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gap: '3px',
                  marginBottom: '0.5rem'
                }}>
                  {createDotsPattern()}
                </div>
                <h1 style={{
                  fontSize: '1.2rem',
                  fontWeight: '700',
                  color: theme.primaryGreen,
                  margin: '0.5rem 0 0.2rem 0',
                  letterSpacing: '1px'
                }}>PRECISE</h1>
                <h1 style={{
                  fontSize: '1.2rem',
                  fontWeight: '700',
                  color: theme.primaryGreen,
                  margin: '0 0 0.2rem 0',
                  letterSpacing: '1px'
                }}>ANALYTICS</h1>
                <p style={{
                  fontSize: '0.7rem',
                  color: theme.primaryOrange,
                  margin: 0,
                  fontWeight: '600',
                  letterSpacing: '0.5px'
                }}>YOUR DATA, OUR INSIGHTS!</p>
              </div>
              <div style={{ color: 'white' }}>
                <h2 style={{
                  fontSize: '1.8rem',
                  fontWeight: '700',
                  color: 'white',
                  margin: 0
                }}>
                  Applicant Tracking System
                </h2>
                <p style={{
                  fontSize: '1rem',
                  color: 'rgba(255, 255, 255, 0.7)',
                  margin: '0.5rem 0 0 0'
                }}>
                  Human Resources Portal
                </p>
              </div>
            </div>
          </div>
        </header>
        <ApplicationsDashboard />
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${theme.darkBlue} 0%, #34495e 100%)`,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <header style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
        padding: '1rem 0'
      }}>
        <div style={{
          maxWidth: '120rem',
          margin: '0 auto',
          padding: '0 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem'
          }}>
            <div style={{
              background: theme.darkBlue,
              padding: '1rem',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              minWidth: '200px'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '3px',
                marginBottom: '0.5rem'
              }}>
                {createDotsPattern()}
              </div>
              <h1 style={{
                fontSize: '1.2rem',
                fontWeight: '700',
                color: theme.primaryGreen,
                margin: '0.5rem 0 0.2rem 0',
                letterSpacing: '1px'
              }}>PRECISE</h1>
              <h1 style={{
                fontSize: '1.2rem',
                fontWeight: '700',
                color: theme.primaryGreen,
                margin: '0 0 0.2rem 0',
                letterSpacing: '1px'
              }}>ANALYTICS</h1>
              <p style={{
                fontSize: '0.7rem',
                color: theme.primaryOrange,
                margin: 0,
                fontWeight: '600',
                letterSpacing: '0.5px'
              }}>YOUR DATA, OUR INSIGHTS!</p>
            </div>
            <div style={{ color: 'white' }}>
              <h2 style={{
                fontSize: '1.8rem',
                fontWeight: '700',
                color: 'white',
                margin: 0
              }}>
                Applicant Tracking System
              </h2>
              <p style={{
                fontSize: '1rem',
                color: 'rgba(255, 255, 255, 0.8)',
                margin: '0.5rem 0 0 0'
              }}>
                Human Resources Portal
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setIsLoginOpen(true)}
            style={{
              background: theme.orangeGradient,
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 12px rgba(255, 127, 0, 0.3)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(255, 127, 0, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 127, 0, 0.3)';
            }}
          >
            <Lock size={18} />
            HR Login
          </button>
        </div>
      </header>

      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4rem 2rem'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '20px',
          padding: '4rem',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)',
          textAlign: 'center',
          maxWidth: '600px',
          width: '100%',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: theme.gradient,
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 2rem',
            boxShadow: '0 8px 25px rgba(154, 205, 50, 0.3)'
          }}>
            <Users size={36} color="white" />
          </div>

          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: '700',
            color: theme.textColor,
            marginBottom: '1rem'
          }}>Welcome to HR Portal</h2>
          
          <p style={{
            fontSize: '1.2rem',
            color: theme.textLight,
            marginBottom: '3rem',
            lineHeight: '1.6'
          }}>
            Manage recruitment, track applications, and streamline your hiring process 
            with Precise Analytics' comprehensive applicant tracking system.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '1.5rem',
            marginBottom: '3rem'
          }}>
            {quickActions.map((action, index) => (
              <div 
                key={index}
                style={{
                  background: 'linear-gradient(135deg, rgba(154, 205, 50, 0.1), rgba(64, 224, 208, 0.1))',
                  border: '1px solid rgba(154, 205, 50, 0.3)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(154, 205, 50, 0.2)';
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(154, 205, 50, 0.15), rgba(64, 224, 208, 0.15))';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(154, 205, 50, 0.1), rgba(64, 224, 208, 0.1))';
                }}
              >
                <div style={{
                  color: theme.primaryGreen,
                  marginBottom: '0.5rem',
                  display: 'flex',
                  justifyContent: 'center'
                }}>
                  {action.icon}
                </div>
                <h4 style={{
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: theme.textColor,
                  margin: '0 0 0.3rem 0'
                }}>
                  {action.title}
                </h4>
                <p style={{
                  fontSize: '0.75rem',
                  color: theme.textLight,
                  margin: 0
                }}>
                  {action.description}
                </p>
              </div>
            ))}
          </div>

          <button
            onClick={() => setIsLoginOpen(true)}
            style={{
              background: theme.orangeGradient,
              color: 'white',
              border: 'none',
              padding: '1.2rem 3rem',
              borderRadius: '12px',
              fontSize: '1.1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(255, 127, 0, 0.3)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(255, 127, 0, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 127, 0, 0.3)';
            }}
          >
            Access HR Dashboard
          </button>
        </div>
      </div>

      {/* LOGIN MODAL WITH FORGOT PASSWORD */}
      {isLoginOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          backdropFilter: 'blur(5px)'
        }}>
          <div style={{
            background: 'white',
            padding: '3rem',
            borderRadius: '20px',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.4)',
            width: '90%',
            maxWidth: '450px',
            position: 'relative'
          }}>
            <button
              onClick={() => {
                setIsLoginOpen(false);
                setShowForgotPassword(false);
                setForgotPasswordEmail('');
                setForgotPasswordStatus('');
                setLoginError('');
              }}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: '#64748b'
              }}
            >
              ×
            </button>
            
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: theme.gradient,
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
                boxShadow: '0 8px 25px rgba(154, 205, 50, 0.3)'
              }}>
                <Lock size={32} color="white" />
              </div>
              <h2 style={{
                fontSize: '2rem',
                fontWeight: '700',
                color: theme.textColor,
                margin: '0 0 0.5rem 0'
              }}>
                {showForgotPassword ? 'Reset Password' : 'HR Portal Login'}
              </h2>
              <p style={{
                color: theme.textLight,
                margin: 0,
                fontSize: '1rem'
              }}>
                {showForgotPassword 
                  ? 'Enter your email to receive reset instructions' 
                  : 'Welcome back! Please sign in to continue.'
                }
              </p>
            </div>

            {!showForgotPassword ? (
              // Regular Login Form
              <div>
                {loginError && (
                  <div style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#ef4444',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    marginBottom: '1rem',
                    fontSize: '0.9rem'
                  }}>
                    {loginError}
                  </div>
                )}

                <form onSubmit={handleLogin}>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    marginBottom: '1.5rem'
                  }}>
                    <label style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: theme.textColor,
                      marginBottom: '0.5rem'
                    }}>Email Address</label>
                    <input
                      type="email"
                      placeholder="careers@preciseanalytics.io"
                      value={loginData.email}
                      onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                      disabled={isLoading}
                      required
                      style={{
                        padding: '1rem',
                        fontSize: '1rem',
                        border: `2px solid rgba(154, 205, 50, 0.3)`,
                        borderRadius: '8px',
                        background: 'rgba(248, 250, 252, 0.9)',
                        color: theme.textColor,
                        transition: 'border-color 0.3s ease',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = theme.primaryGreen}
                      onBlur={(e) => e.target.style.borderColor = 'rgba(154, 205, 50, 0.3)'}
                    />
                  </div>

                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    marginBottom: '1rem'
                  }}>
                    <label style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: theme.textColor,
                      marginBottom: '0.5rem'
                    }}>Password</label>
                    <input
                      type="password"
                      placeholder="Enter your password"
                      value={loginData.password}
                      onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                      disabled={isLoading}
                      required
                      style={{
                        padding: '1rem',
                        fontSize: '1rem',
                        border: `2px solid rgba(154, 205, 50, 0.3)`,
                        borderRadius: '8px',
                        background: 'rgba(248, 250, 252, 0.9)',
                        color: theme.textColor,
                        transition: 'border-color 0.3s ease',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = theme.primaryGreen}
                      onBlur={(e) => e.target.style.borderColor = 'rgba(154, 205, 50, 0.3)'}
                    />
                  </div>

                  {/* Forgot Password Link */}
                  <div style={{
                    textAlign: 'right',
                    marginBottom: '1.5rem'
                  }}>
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: theme.primaryGreen,
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        transition: 'color 0.2s ease'
                      }}
                      onMouseOver={(e) => (e.currentTarget as HTMLButtonElement).style.color = theme.tealAccent}
                      onMouseOut={(e) => (e.currentTarget as HTMLButtonElement).style.color = theme.primaryGreen}
                    >
                      Forgot password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    style={{
                      width: '100%',
                      background: theme.gradient,
                      color: 'white',
                      border: 'none',
                      padding: '1.2rem',
                      borderRadius: '10px',
                      fontSize: '1.1rem',
                      fontWeight: '600',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 15px rgba(154, 205, 50, 0.3)',
                      opacity: isLoading ? 0.7 : 1
                    }}
                    onMouseOver={(e) => {
                      if (!isLoading) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(154, 205, 50, 0.4)';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!isLoading) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(154, 205, 50, 0.3)';
                      }
                    }}
                  >
                    {isLoading ? 'Signing In...' : 'Sign In to Dashboard'}
                  </button>
                </form>
              </div>
            ) : (
              // Forgot Password Form
              <div>
                {forgotPasswordStatus && (
                  <div style={{
                    background: forgotPasswordStatus.includes('✅') 
                      ? 'rgba(5, 150, 105, 0.1)' 
                      : 'rgba(239, 68, 68, 0.1)',
                    border: forgotPasswordStatus.includes('✅')
                      ? '1px solid rgba(5, 150, 105, 0.3)'
                      : '1px solid rgba(239, 68, 68, 0.3)',
                    color: forgotPasswordStatus.includes('✅') ? '#059669' : '#ef4444',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    marginBottom: '1rem',
                    fontSize: '0.9rem'
                  }}>
                    {forgotPasswordStatus}
                  </div>
                )}

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  marginBottom: '1.5rem'
                }}>
                  <label style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: theme.textColor,
                    marginBottom: '0.5rem'
                  }}>Email Address</label>
                  <input
                    type="email"
                    placeholder="careers@preciseanalytics.io"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    disabled={isLoading}
                    style={{
                      padding: '1rem',
                      fontSize: '1rem',
                      border: `2px solid rgba(154, 205, 50, 0.3)`,
                      borderRadius: '8px',
                      background: 'rgba(248, 250, 252, 0.9)',
                      color: theme.textColor,
                      transition: 'border-color 0.3s ease',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = theme.primaryGreen}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(154, 205, 50, 0.3)'}
                  />
                </div>

                <p style={{
                  fontSize: '0.9rem',
                  color: theme.textLight,
                  marginBottom: '2rem',
                  lineHeight: '1.5'
                }}>
                  Enter your email address and we'll send you instructions to reset your password.
                </p>

                <div style={{
                  display: 'flex',
                  gap: '1rem'
                }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setForgotPasswordEmail('');
                      setForgotPasswordStatus('');
                    }}
                    style={{
                      flex: 1,
                      background: 'rgba(107, 114, 128, 0.1)',
                      color: theme.textColor,
                      border: '2px solid rgba(107, 114, 128, 0.3)',
                      padding: '1rem',
                      borderRadius: '10px',
                      fontSize: '1rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = 'rgba(107, 114, 128, 0.15)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = 'rgba(107, 114, 128, 0.1)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    Back to Login
                  </button>
                  
                  <button
                    onClick={handleForgotPassword}
                    disabled={isLoading || !forgotPasswordEmail}
                    style={{
                      flex: 1,
                      background: theme.gradient,
                      color: 'white',
                      border: 'none',
                      padding: '1rem',
                      borderRadius: '10px',
                      fontSize: '1rem',
                      fontWeight: '600',
                      cursor: (isLoading || !forgotPasswordEmail) ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 15px rgba(154, 205, 50, 0.3)',
                      opacity: (isLoading || !forgotPasswordEmail) ? 0.5 : 1
                    }}
                    onMouseOver={(e) => {
                      if (!isLoading && forgotPasswordEmail) {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(154, 205, 50, 0.4)';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!isLoading && forgotPasswordEmail) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(154, 205, 50, 0.3)';
                      }
                    }}
                  >
                    {isLoading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </div>
              </div>
            )}

            <div style={{
              textAlign: 'center',
              marginTop: '1.5rem',
              fontSize: '0.85rem',
              color: theme.textLight
            }}>
              Authorized HR personnel only
            </div>
          </div>
        </div>
      )}
    </div>
  );
}