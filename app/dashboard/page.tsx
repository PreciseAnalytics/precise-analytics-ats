'use client';

import React, { useState, useEffect } from 'react';
import { Lock, Users, Search, UserPlus, FileText, BarChart3, LogOut, Home, ExternalLink } from 'lucide-react';

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
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordStatus, setForgotPasswordStatus] = useState('');

  // Enhanced theme with better colors and spacing
  const theme = {
    primaryGreen: '#9ACD32',
    primaryOrange: '#FF7F00',
    darkBlue: '#2B4566',
    tealAccent: '#40E0D0',
    gradient: 'linear-gradient(135deg, #9ACD32, #40E0D0)',
    orangeGradient: 'linear-gradient(135deg, #FF7F00, #FF8C00)',
    textColor: 'rgb(51, 65, 85)',
    textLight: 'rgba(51, 65, 85, 0.8)',
    cardBackground: 'rgba(255, 255, 255, 0.98)',
    background: 'rgb(248, 250, 252)',
    shadowMd: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    shadowLg: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    shadowXl: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
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
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggedIn(false);
      setUser(null);
      setApplications([]);
    }
  };

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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: forgotPasswordEmail }),
      });

      const result = await response.json();

      if (result.success) {
        setForgotPasswordStatus('Password reset instructions sent to your email');
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

  // Homepage redirect function
  const goToHomepage = () => {
    window.open('https://preciseanalytics.io', '_blank');
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
      'Applied': { bg: 'rgba(59, 130, 246, 0.12)', text: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)' },
      'Screening': { bg: 'rgba(251, 191, 36, 0.12)', text: '#f59e0b', border: 'rgba(251, 191, 36, 0.3)' },
      'Technical Review': { bg: 'rgba(147, 51, 234, 0.12)', text: '#9333ea', border: 'rgba(147, 51, 234, 0.3)' },
      'Interview': { bg: 'rgba(255, 125, 0, 0.12)', text: '#ff7d00', border: 'rgba(255, 125, 0, 0.3)' },
      'Offer': { bg: 'rgba(34, 197, 94, 0.12)', text: '#22c55e', border: 'rgba(34, 197, 94, 0.3)' },
      'Hired': { bg: 'rgba(34, 197, 94, 0.2)', text: '#15803d', border: 'rgba(34, 197, 94, 0.5)' },
      'Rejected': { bg: 'rgba(239, 68, 68, 0.12)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' }
    };
    return colors[stage] || colors['Applied'];
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

  const ApplicationsDashboard = () => (
    <div style={{ padding: '2.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '3rem',
        padding: '2rem',
        background: theme.cardBackground,
        borderRadius: '16px',
        boxShadow: theme.shadowMd
      }}>
        <div>
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: '800',
            color: theme.textColor,
            margin: '0 0 0.5rem 0',
            letterSpacing: '-0.025em'
          }}>
            Applications Dashboard
          </h2>
          <p style={{
            color: theme.textLight,
            margin: 0,
            fontSize: '1.2rem',
            fontWeight: '500'
          }}>
            Welcome back, <span style={{color: theme.primaryGreen, fontWeight: '600'}}>{user?.name || user?.email}</span>
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button
            onClick={goToHomepage}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(59, 130, 246, 0.1)',
              color: '#3b82f6',
              border: '2px solid rgba(59, 130, 246, 0.2)',
              padding: '0.75rem 1.25rem',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              textDecoration: 'none'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(59, 130, 246, 0.2)';
              e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
            }}
          >
            <Home size={18} />
            Website
            <ExternalLink size={14} />
          </button>
          
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: theme.orangeGradient,
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(255, 127, 0, 0.3)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(255, 127, 0, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 127, 0, 0.3)';
            }}
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '2rem',
        marginBottom: '3rem'
      }}>
        <div style={{
          background: theme.cardBackground,
          padding: '2rem',
          borderRadius: '16px',
          boxShadow: theme.shadowMd,
          border: '1px solid rgba(154, 205, 50, 0.1)',
          transition: 'all 0.3s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{
              background: 'rgba(154, 205, 50, 0.1)',
              padding: '0.75rem',
              borderRadius: '12px',
              marginRight: '1rem'
            }}>
              <FileText size={24} color={theme.primaryGreen} />
            </div>
            <h3 style={{ 
              color: theme.textColor, 
              margin: 0,
              fontSize: '1.1rem',
              fontWeight: '600'
            }}>Total Applications</h3>
          </div>
          <p style={{ 
            fontSize: '2.5rem', 
            fontWeight: '800', 
            color: theme.primaryGreen, 
            margin: 0,
            letterSpacing: '-0.02em'
          }}>
            {applications.length}
          </p>
          <p style={{
            fontSize: '0.9rem',
            color: theme.textLight,
            margin: '0.5rem 0 0 0'
          }}>
            All time submissions
          </p>
        </div>
        
        <div style={{
          background: theme.cardBackground,
          padding: '2rem',
          borderRadius: '16px',
          boxShadow: theme.shadowMd,
          border: '1px solid rgba(255, 127, 0, 0.1)',
          transition: 'all 0.3s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{
              background: 'rgba(255, 127, 0, 0.1)',
              padding: '0.75rem',
              borderRadius: '12px',
              marginRight: '1rem'
            }}>
              <Users size={24} color={theme.primaryOrange} />
            </div>
            <h3 style={{ 
              color: theme.textColor, 
              margin: 0,
              fontSize: '1.1rem',
              fontWeight: '600'
            }}>In Review</h3>
          </div>
          <p style={{ 
            fontSize: '2.5rem', 
            fontWeight: '800', 
            color: theme.primaryOrange, 
            margin: 0,
            letterSpacing: '-0.02em'
          }}>
            {applications.filter(app => app.stage === 'Interview').length}
          </p>
          <p style={{
            fontSize: '0.9rem',
            color: theme.textLight,
            margin: '0.5rem 0 0 0'
          }}>
            Active interviews
          </p>
        </div>
        
        <div style={{
          background: theme.cardBackground,
          padding: '2rem',
          borderRadius: '16px',
          boxShadow: theme.shadowMd,
          border: '1px solid rgba(64, 224, 208, 0.1)',
          transition: 'all 0.3s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{
              background: 'rgba(64, 224, 208, 0.1)',
              padding: '0.75rem',
              borderRadius: '12px',
              marginRight: '1rem'
            }}>
              <BarChart3 size={24} color={theme.tealAccent} />
            </div>
            <h3 style={{ 
              color: theme.textColor, 
              margin: 0,
              fontSize: '1.1rem',
              fontWeight: '600'
            }}>New Today</h3>
          </div>
          <p style={{ 
            fontSize: '2.5rem', 
            fontWeight: '800', 
            color: theme.tealAccent, 
            margin: 0,
            letterSpacing: '-0.02em'
          }}>
            {applications.filter(app => 
              new Date(app.applied_date).toDateString() === new Date().toDateString()
            ).length}
          </p>
          <p style={{
            fontSize: '0.9rem',
            color: theme.textLight,
            margin: '0.5rem 0 0 0'
          }}>
            Today's submissions
          </p>
        </div>
      </div>

      <div style={{
        background: theme.cardBackground,
        borderRadius: '16px',
        boxShadow: theme.shadowLg,
        overflow: 'hidden',
        border: '1px solid rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{
          padding: '2rem',
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
          background: 'linear-gradient(135deg, rgba(154, 205, 50, 0.08), rgba(64, 224, 208, 0.08))'
        }}>
          <h3 style={{
            fontSize: '1.8rem',
            fontWeight: '700',
            color: theme.textColor,
            margin: '0 0 0.5rem 0'
          }}>
            Recent Applications
          </h3>
          <p style={{
            color: theme.textLight,
            margin: 0,
            fontSize: '1.1rem'
          }}>
            Latest candidate submissions from preciseanalytics.io/careers
          </p>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: 'rgba(248, 250, 252, 0.8)' }}>
              <tr>
                <th style={{
                  padding: '1.5rem',
                  textAlign: 'left',
                  fontSize: '1rem',
                  fontWeight: '700',
                  color: theme.textColor,
                  borderBottom: '2px solid rgba(0, 0, 0, 0.1)'
                }}>Candidate</th>
                <th style={{
                  padding: '1.5rem',
                  textAlign: 'left',
                  fontSize: '1rem',
                  fontWeight: '700',
                  color: theme.textColor,
                  borderBottom: '2px solid rgba(0, 0, 0, 0.1)'
                }}>Position</th>
                <th style={{
                  padding: '1.5rem',
                  textAlign: 'left',
                  fontSize: '1rem',
                  fontWeight: '700',
                  color: theme.textColor,
                  borderBottom: '2px solid rgba(0, 0, 0, 0.1)'
                }}>Status</th>
                <th style={{
                  padding: '1.5rem',
                  textAlign: 'left',
                  fontSize: '1rem',
                  fontWeight: '700',
                  color: theme.textColor,
                  borderBottom: '2px solid rgba(0, 0, 0, 0.1)'
                }}>Applied</th>
                <th style={{
                  padding: '1.5rem',
                  textAlign: 'left',
                  fontSize: '1rem',
                  fontWeight: '700',
                  color: theme.textColor,
                  borderBottom: '2px solid rgba(0, 0, 0, 0.1)'
                }}>Source</th>
                <th style={{
                  padding: '1.5rem',
                  textAlign: 'left',
                  fontSize: '1rem',
                  fontWeight: '700',
                  color: theme.textColor,
                  borderBottom: '2px solid rgba(0, 0, 0, 0.1)'
                }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((application) => {
                const stageColors = getStageColors(application.stage);
                return (
                  <tr key={application.id} style={{
                    borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
                    transition: 'background 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'rgba(248, 250, 252, 0.5)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}>
                    <td style={{ padding: '1.5rem' }}>
                      <div>
                        <div style={{
                          fontSize: '1.1rem',
                          fontWeight: '700',
                          color: theme.textColor,
                          marginBottom: '0.3rem'
                        }}>
                          {application.first_name} {application.last_name}
                        </div>
                        <div style={{
                          fontSize: '0.95rem',
                          color: theme.textLight
                        }}>
                          {application.email}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1.5rem' }}>
                      <div style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: theme.textColor,
                        marginBottom: '0.2rem'
                      }}>
                        {application.position}
                      </div>
                      <div style={{
                        fontSize: '0.9rem',
                        color: theme.textLight
                      }}>
                        {application.location}
                      </div>
                    </td>
                    <td style={{ padding: '1.5rem' }}>
                      <span style={{
                        display: 'inline-flex',
                        padding: '0.5rem 1rem',
                        fontSize: '0.9rem',
                        fontWeight: '700',
                        borderRadius: '20px',
                        background: stageColors.bg,
                        color: stageColors.text,
                        border: `2px solid ${stageColors.border}`
                      }}>
                        {application.stage}
                      </span>
                    </td>
                    <td style={{ 
                      padding: '1.5rem',
                      fontSize: '1rem',
                      fontWeight: '500',
                      color: theme.textLight
                    }}>
                      {formatDate(application.applied_date)}
                    </td>
                    <td style={{ 
                      padding: '1.5rem',
                      fontSize: '0.95rem',
                      color: theme.textLight
                    }}>
                      <span style={{
                        background: 'rgba(154, 205, 50, 0.1)',
                        color: theme.primaryGreen,
                        padding: '0.3rem 0.8rem',
                        borderRadius: '12px',
                        fontSize: '0.8rem',
                        fontWeight: '600'
                      }}>
                        {application.source}
                      </span>
                    </td>
                    <td style={{ padding: '1.5rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button style={{
                          background: 'rgba(59, 130, 246, 0.1)',
                          color: '#3b82f6',
                          border: '1px solid rgba(59, 130, 246, 0.2)',
                          padding: '0.5rem 1rem',
                          borderRadius: '8px',
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}>
                          View
                        </button>
                        <button style={{
                          background: 'rgba(255, 127, 0, 0.1)',
                          color: theme.primaryOrange,
                          border: '1px solid rgba(255, 127, 0, 0.2)',
                          padding: '0.5rem 1rem',
                          borderRadius: '8px',
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}>
                          Contact
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {applications.length === 0 && (
            <div style={{
              padding: '3rem',
              textAlign: 'center',
              color: theme.textLight
            }}>
              <div style={{
                fontSize: '1.2rem',
                marginBottom: '0.5rem',
                fontWeight: '600'
              }}>
                No applications yet
              </div>
              <p style={{ margin: 0, fontSize: '1rem' }}>
                Applications from your careers page will appear here automatically.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Footer */}
      <div style={{
        marginTop: '3rem',
        textAlign: 'center',
        padding: '2rem',
        background: theme.cardBackground,
        borderRadius: '16px',
        boxShadow: theme.shadowMd
      }}>
        <p style={{
          fontSize: '1rem',
          fontWeight: '600',
          color: theme.textColor,
          margin: '0 0 0.5rem 0'
        }}>
          Precise Analytics ATS • Virginia SDVOSB • Minority-Owned Business
        </p>
        <p style={{
          fontSize: '0.9rem',
          color: theme.textLight,
          margin: 0
        }}>
          Secure federal contracting recruitment platform
        </p>
      </div>
    </div>
  );

  const quickActions = [
    { icon: <Search size={28} />, title: 'View Applications', description: 'Browse all candidates' },
    { icon: <UserPlus size={28} />, title: 'Add Position', description: 'Create job posting' },
    { icon: <FileText size={28} />, title: 'Reports', description: 'Generate analytics' },
    { icon: <BarChart3 size={28} />, title: 'Pipeline', description: 'Track progress' }
  ];

  if (isLoggedIn) {
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
          padding: '1.5rem 0'
        }}>
          <div style={{
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '0 2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2rem',
                cursor: 'pointer'
              }}
              onClick={goToHomepage}
            >
              <div style={{
                background: theme.darkBlue,
                padding: '1.5rem',
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minWidth: '220px',
                transition: 'all 0.3s ease',
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.2)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 12px 35px rgba(0, 0, 0, 0.3)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.2)';
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gap: '4px',
                  marginBottom: '0.75rem'
                }}>
                  {createDotsPattern()}
                </div>
                <h1 style={{
                  fontSize: '1.4rem',
                  fontWeight: '800',
                  color: theme.primaryGreen,
                  margin: '0.5rem 0 0.2rem 0',
                  letterSpacing: '1.5px'
                }}>PRECISE</h1>
                <h1 style={{
                  fontSize: '1.4rem',
                  fontWeight: '800',
                  color: theme.primaryGreen,
                  margin: '0 0 0.3rem 0',
                  letterSpacing: '1.5px'
                }}>ANALYTICS</h1>
                <p style={{
                  fontSize: '0.8rem',
                  color: theme.primaryOrange,
                  margin: 0,
                  fontWeight: '700',
                  letterSpacing: '0.8px'
                }}>YOUR DATA, OUR INSIGHTS!</p>
              </div>
              <div style={{ color: 'white' }}>
                <h2 style={{
                  fontSize: '2.2rem',
                  fontWeight: '800',
                  color: 'white',
                  margin: '0 0 0.5rem 0',
                  letterSpacing: '-0.02em'
                }}>
                  Applicant Tracking System
                </h2>
                <p style={{
                  fontSize: '1.2rem',
                  color: 'rgba(255, 255, 255, 0.8)',
                  margin: 0,
                  fontWeight: '500'
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
        padding: '1.5rem 0'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2rem',
              cursor: 'pointer'
            }}
            onClick={goToHomepage}
          >
            <div style={{
              background: theme.darkBlue,
              padding: '1.5rem',
              borderRadius: '16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              minWidth: '220px',
              transition: 'all 0.3s ease',
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.2)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 12px 35px rgba(0, 0, 0, 0.3)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.2)';
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '4px',
                marginBottom: '0.75rem'
              }}>
                {createDotsPattern()}
              </div>
              <h1 style={{
                fontSize: '1.4rem',
                fontWeight: '800',
                color: theme.primaryGreen,
                margin: '0.5rem 0 0.2rem 0',
                letterSpacing: '1.5px'
              }}>PRECISE</h1>
              <h1 style={{
                fontSize: '1.4rem',
                fontWeight: '800',
                color: theme.primaryGreen,
                margin: '0 0 0.3rem 0',
                letterSpacing: '1.5px'
              }}>ANALYTICS</h1>
              <p style={{
                fontSize: '0.8rem',
                color: theme.primaryOrange,
                margin: 0,
                fontWeight: '700',
                letterSpacing: '0.8px'
              }}>YOUR DATA, OUR INSIGHTS!</p>
            </div>
            <div style={{ color: 'white' }}>
              <h2 style={{
                fontSize: '2.2rem',
                fontWeight: '800',
                color: 'white',
                margin: '0 0 0.5rem 0',
                letterSpacing: '-0.02em'
              }}>
                Applicant Tracking System
              </h2>
              <p style={{
                fontSize: '1.2rem',
                color: 'rgba(255, 255, 255, 0.8)',
                margin: 0,
                fontWeight: '500'
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
              padding: '1rem 2rem',
              borderRadius: '12px',
              fontSize: '1.1rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              transition: 'all 0.3s ease',
              boxShadow: '0 6px 20px rgba(255, 127, 0, 0.4)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(255, 127, 0, 0.5)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 127, 0, 0.4)';
            }}
          >
            <Lock size={20} />
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
          background: 'rgba(255, 255, 255, 0.98)',
          borderRadius: '24px',
          padding: '4rem',
          boxShadow: theme.shadowXl,
          textAlign: 'center',
          maxWidth: '700px',
          width: '100%',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            width: '100px',
            height: '100px',
            background: theme.gradient,
            borderRadius: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 2.5rem',
            boxShadow: '0 12px 35px rgba(154, 205, 50, 0.4)'
          }}>
            <Users size={44} color="white" />
          </div>

          <h2 style={{
            fontSize: '3rem',
            fontWeight: '800',
            color: theme.textColor,
            marginBottom: '1.5rem',
            letterSpacing: '-0.02em'
          }}>Welcome to HR Portal</h2>
          
          <p style={{
            fontSize: '1.3rem',
            color: theme.textLight,
            marginBottom: '3.5rem',
            lineHeight: '1.6',
            fontWeight: '500'
          }}>
            Manage recruitment, track applications, and streamline your hiring process 
            with Precise Analytics' comprehensive applicant tracking system.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '2rem',
            marginBottom: '3.5rem'
          }}>
            {quickActions.map((action, index) => (
              <div 
                key={index}
                style={{
                  background: 'linear-gradient(135deg, rgba(154, 205, 50, 0.1), rgba(64, 224, 208, 0.1))',
                  border: '2px solid rgba(154, 205, 50, 0.2)',
                  borderRadius: '16px',
                  padding: '2rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 12px 30px rgba(154, 205, 50, 0.25)';
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(154, 205, 50, 0.15), rgba(64, 224, 208, 0.15))';
                  e.currentTarget.style.borderColor = 'rgba(154, 205, 50, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(154, 205, 50, 0.1), rgba(64, 224, 208, 0.1))';
                  e.currentTarget.style.borderColor = 'rgba(154, 205, 50, 0.2)';
                }}
              >
                <div style={{
                  color: theme.primaryGreen,
                  marginBottom: '1rem',
                  display: 'flex',
                  justifyContent: 'center'
                }}>
                  {action.icon}
                </div>
                <h4 style={{
                  fontSize: '1rem',
                  fontWeight: '700',
                  color: theme.textColor,
                  margin: '0 0 0.5rem 0'
                }}>
                  {action.title}
                </h4>
                <p style={{
                  fontSize: '0.9rem',
                  color: theme.textLight,
                  margin: 0,
                  fontWeight: '500'
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
              padding: '1.5rem 3.5rem',
              borderRadius: '16px',
              fontSize: '1.2rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 6px 20px rgba(255, 127, 0, 0.4)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(255, 127, 0, 0.5)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 127, 0, 0.4)';
            }}
          >
            Access HR Dashboard
          </button>
        </div>
      </div>

      {isLoginOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          backdropFilter: 'blur(8px)'
        }}>
          <div style={{
            background: 'white',
            padding: '3.5rem',
            borderRadius: '24px',
            boxShadow: theme.shadowXl,
            width: '90%',
            maxWidth: '500px',
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
                top: '1.5rem',
                right: '1.5rem',
                background: 'none',
                border: 'none',
                fontSize: '2rem',
                cursor: 'pointer',
                color: '#64748b',
                fontWeight: '300'
              }}
            >
              ×
            </button>
            
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <div style={{
                width: '90px',
                height: '90px',
                background: theme.gradient,
                borderRadius: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 2rem',
                boxShadow: '0 12px 35px rgba(154, 205, 50, 0.4)'
              }}>
                <Lock size={40} color="white" />
              </div>
              <h2 style={{
                fontSize: '2.5rem',
                fontWeight: '800',
                color: theme.textColor,
                margin: '0 0 0.75rem 0'
              }}>
                HR Portal Login
              </h2>
              <p style={{
                color: theme.textLight,
                margin: 0,
                fontSize: '1.1rem',
                fontWeight: '500'
              }}>
                Welcome back! Please sign in to continue.
              </p>
            </div>

            <div>
              {loginError && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '2px solid rgba(239, 68, 68, 0.3)',
                  color: '#ef4444',
                  padding: '1rem',
                  borderRadius: '12px',
                  marginBottom: '1.5rem',
                  fontSize: '1rem',
                  fontWeight: '600'
                }}>
                  {loginError}
                </div>
              )}

              {!showForgotPassword ? (
                <>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    marginBottom: '2rem'
                  }}>
                    <label style={{
                      fontSize: '1.1rem',
                      fontWeight: '700',
                      color: theme.textColor,
                      marginBottom: '0.75rem'
                    }}>Email Address</label>
                    <input
                      type="email"
                      placeholder="careers@preciseanalytics.io"
                      value={loginData.email}
                      onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                      disabled={isLoading}
                      style={{
                        padding: '1.25rem',
                        fontSize: '1.1rem',
                        border: `2px solid rgba(154, 205, 50, 0.3)`,
                        borderRadius: '12px',
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
                    marginBottom: '2rem'
                  }}>
                    <label style={{
                      fontSize: '1.1rem',
                      fontWeight: '700',
                      color: theme.textColor,
                      marginBottom: '0.75rem'
                    }}>Password</label>
                    <input
                      type="password"
                      placeholder="Enter your password"
                      value={loginData.password}
                      onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                      disabled={isLoading}
                      style={{
                        padding: '1.25rem',
                        fontSize: '1.1rem',
                        border: `2px solid rgba(154, 205, 50, 0.3)`,
                        borderRadius: '12px',
                        background: 'rgba(248, 250, 252, 0.9)',
                        color: theme.textColor,
                        transition: 'border-color 0.3s ease',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = theme.primaryGreen}
                      onBlur={(e) => e.target.style.borderColor = 'rgba(154, 205, 50, 0.3)'}
                    />
                  </div>

                  <button
                    onClick={handleLogin}
                    disabled={isLoading}
                    style={{
                      width: '100%',
                      background: theme.gradient,
                      color: 'white',
                      border: 'none',
                      padding: '1.5rem',
                      borderRadius: '14px',
                      fontSize: '1.2rem',
                      fontWeight: '700',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 6px 20px rgba(154, 205, 50, 0.4)',
                      opacity: isLoading ? 0.7 : 1,
                      marginBottom: '1.5rem'
                    }}
                    onMouseOver={(e) => {
                      if (!isLoading) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 10px 30px rgba(154, 205, 50, 0.5)';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!isLoading) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(154, 205, 50, 0.4)';
                      }
                    }}
                  >
                    {isLoading ? 'Signing In...' : 'Sign In to Dashboard'}
                  </button>

                  <div style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => setShowForgotPassword(true)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: theme.primaryOrange,
                        fontSize: '1rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        padding: '0.5rem'
                      }}
                    >
                      Forgot your password?
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div style={{
                    textAlign: 'center',
                    marginBottom: '2rem',
                    padding: '1.5rem',
                    background: 'rgba(154, 205, 50, 0.08)',
                    borderRadius: '12px',
                    border: '1px solid rgba(154, 205, 50, 0.2)'
                  }}>
                    <h3 style={{
                      fontSize: '1.4rem',
                      fontWeight: '700',
                      color: theme.textColor,
                      margin: '0 0 0.5rem 0'
                    }}>Reset Your Password</h3>
                    <p style={{
                      color: theme.textLight,
                      margin: 0,
                      fontSize: '1rem'
                    }}>
                      Enter your email address and we'll send you instructions to reset your password.
                    </p>
                  </div>

                  {forgotPasswordStatus && (
                    <div style={{
                      background: forgotPasswordStatus.includes('sent') ? 
                        'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                      border: `2px solid ${forgotPasswordStatus.includes('sent') ? 
                        'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                      color: forgotPasswordStatus.includes('sent') ? '#22c55e' : '#ef4444',
                      padding: '1rem',
                      borderRadius: '12px',
                      marginBottom: '1.5rem',
                      fontSize: '1rem',
                      fontWeight: '600',
                      textAlign: 'center'
                    }}>
                      {forgotPasswordStatus}
                    </div>
                  )}

                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    marginBottom: '2rem'
                  }}>
                    <label style={{
                      fontSize: '1.1rem',
                      fontWeight: '700',
                      color: theme.textColor,
                      marginBottom: '0.75rem'
                    }}>Email Address</label>
                    <input
                      type="email"
                      placeholder="careers@preciseanalytics.io"
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      disabled={isLoading}
                      style={{
                        padding: '1.25rem',
                        fontSize: '1.1rem',
                        border: `2px solid rgba(154, 205, 50, 0.3)`,
                        borderRadius: '12px',
                        background: 'rgba(248, 250, 252, 0.9)',
                        color: theme.textColor,
                        transition: 'border-color 0.3s ease',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = theme.primaryGreen}
                      onBlur={(e) => e.target.style.borderColor = 'rgba(154, 205, 50, 0.3)'}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                      onClick={() => {
                        setShowForgotPassword(false);
                        setForgotPasswordEmail('');
                        setForgotPasswordStatus('');
                      }}
                      style={{
                        flex: 1,
                        background: 'rgba(156, 163, 175, 0.2)',
                        color: theme.textLight,
                        border: '2px solid rgba(156, 163, 175, 0.3)',
                        padding: '1.25rem',
                        borderRadius: '12px',
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      Back to Login
                    </button>
                    
                    <button
                      onClick={handleForgotPassword}
                      disabled={isLoading}
                      style={{
                        flex: 1,
                        background: theme.orangeGradient,
                        color: 'white',
                        border: 'none',
                        padding: '1.25rem',
                        borderRadius: '12px',
                        fontSize: '1.1rem',
                        fontWeight: '700',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 4px 15px rgba(255, 127, 0, 0.3)',
                        opacity: isLoading ? 0.7 : 1
                      }}
                      onMouseOver={(e) => {
                        if (!isLoading) {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 8px 25px rgba(255, 127, 0, 0.4)';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (!isLoading) {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 127, 0, 0.3)';
                        }
                      }}
                    >
                      {isLoading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                  </div>
                </>
              )}
            </div>

            <div style={{
              textAlign: 'center',
              marginTop: '2rem',
              fontSize: '0.95rem',
              color: theme.textLight,
              fontWeight: '500'
            }}>
              Authorized HR personnel only
            </div>
          </div>
        </div>
      )}
    </div>
  );
}