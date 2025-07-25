'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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

export default function HomePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  
  // Login modal state
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginData, setLoginData] = useState<LoginData>({ email: '', password: '' });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  
  // NEW: Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordStatus, setForgotPasswordStatus] = useState('');

  useEffect(() => {
    setMounted(true);
    
    // Check if user is already logged in
    const token = localStorage.getItem('ats-token');
    const user = localStorage.getItem('ats-user');
    
    if (token && user) {
      router.push('/dashboard');
    }
  }, [router]);

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
        router.push('/dashboard');
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

  // NEW: Forgot password handler
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

      if (result.success) {
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

  if (!mounted) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f766e 0%, #134e4a 25%, #1e3a3a 50%, #0f766e 75%, #134e4a 100%)'
      }}>
        <div style={{
          color: 'white',
          fontSize: '1.2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            width: '20px',
            height: '20px',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            borderTop: '2px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          Loading ATS Portal...
        </div>
      </div>
    );
  }

  const quickActions = [
    { 
      icon: '👥', 
      title: 'View Applications', 
      description: 'Browse all candidate submissions',
      color: 'rgba(59, 130, 246, 0.1)',
      borderColor: 'rgba(59, 130, 246, 0.3)'
    },
    { 
      icon: '➕', 
      title: 'Manage Positions', 
      description: 'Create and edit job postings',
      color: 'rgba(34, 197, 94, 0.1)',
      borderColor: 'rgba(34, 197, 94, 0.3)'
    },
    { 
      icon: '📊', 
      title: 'Reports & Analytics', 
      description: 'Generate hiring insights',
      color: 'rgba(147, 51, 234, 0.1)',
      borderColor: 'rgba(147, 51, 234, 0.3)'
    },
    { 
      icon: '🔄', 
      title: 'Track Pipeline', 
      description: 'Monitor recruitment progress',
      color: 'rgba(249, 115, 22, 0.1)',
      borderColor: 'rgba(249, 115, 22, 0.3)'
    }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f766e 0%, #134e4a 25%, #1e3a3a 50%, #0f766e 75%, #134e4a 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Header Navigation */}
      <header style={{
        background: 'rgba(0, 0, 0, 0.2)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '1.5rem 0'
      }}>
        <div style={{
          maxWidth: '1200px',
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
              gap: '1rem',
              cursor: 'pointer'
            }}
            onClick={() => router.push('/')}
          >
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '50px',
              height: '50px',
              background: 'linear-gradient(135deg, #0f766e, #134e4a)',
              borderRadius: '0.75rem',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
            }}>
              <span style={{
                fontSize: '1.5rem',
                fontWeight: '800',
                color: 'white',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
              }}>
                PA
              </span>
            </div>
            <div>
              <h1 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: 'white',
                margin: 0,
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
              }}>
                Precise Analytics ATS
              </h1>
              <p style={{
                fontSize: '0.9rem',
                color: 'rgba(255, 255, 255, 0.8)',
                margin: 0
              }}>
                Applicant Tracking System
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsLoginOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.75rem',
              background: 'linear-gradient(135deg, #f97316, #ea580c)',
              border: 'none',
              color: 'white',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(249, 115, 22, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(249, 115, 22, 0.3)';
            }}
          >
            <span>🔐</span>
            HR Login
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 100px)',
        padding: '4rem 2rem'
      }}>
        <div style={{
          maxWidth: '800px',
          width: '100%',
          textAlign: 'center'
        }}>
          {/* Hero Section */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(20px)',
            borderRadius: '2rem',
            padding: '4rem',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            marginBottom: '3rem'
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100px',
              height: '100px',
              background: 'linear-gradient(135deg, #0f766e, #134e4a)',
              borderRadius: '1.5rem',
              marginBottom: '2rem',
              border: '3px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 12px 24px rgba(0, 0, 0, 0.3)'
            }}>
              <span style={{
                fontSize: '3rem',
                fontWeight: '800',
                color: 'white',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
              }}>
                👥
              </span>
            </div>

            <h1 style={{
              fontSize: 'clamp(3rem, 6vw, 4rem)',
              fontWeight: '800',
              color: 'white',
              margin: '0 0 1.5rem 0',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
              lineHeight: '1.1'
            }}>
              Welcome to HR Portal
            </h1>

            <p style={{
              fontSize: 'clamp(1.2rem, 3vw, 1.5rem)',
              color: 'rgba(255, 255, 255, 0.9)',
              margin: '0 0 2rem 0',
              lineHeight: '1.5',
              fontWeight: '400'
            }}>
              Streamline your recruitment process with Precise Analytics' 
              comprehensive applicant tracking system designed for federal contracting excellence.
            </p>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '1rem 2rem',
              background: 'rgba(34, 197, 94, 0.1)',
              borderRadius: '1rem',
              border: '2px solid rgba(34, 197, 94, 0.3)',
              marginBottom: '3rem'
            }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: '#22c55e',
                boxShadow: '0 0 15px rgba(34, 197, 94, 0.6)'
              }}></div>
              <span style={{
                fontSize: '1.1rem',
                color: '#86efac',
                fontWeight: '600'
              }}>
                🔒 Secure Internal Portal • SDVOSB Certified
              </span>
            </div>

            <button
              onClick={() => setIsLoginOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1.5rem 3rem',
                borderRadius: '1.25rem',
                background: 'linear-gradient(135deg, #f97316, #ea580c)',
                border: 'none',
                color: 'white',
                fontSize: '1.3rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 8px 20px rgba(249, 115, 22, 0.4)',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 12px 30px rgba(249, 115, 22, 0.5)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(249, 115, 22, 0.4)';
              }}
            >
              <span style={{ fontSize: '1.5rem' }}>🚀</span>
              Access ATS Dashboard
            </button>
          </div>

          {/* Features Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1.5rem',
            marginBottom: '3rem'
          }}>
            {quickActions.map((action, index) => (
              <div 
                key={index}
                style={{
                  background: 'rgba(0, 0, 0, 0.2)',
                  backdropFilter: 'blur(15px)',
                  border: `2px solid ${action.borderColor}`,
                  borderRadius: '1.25rem',
                  padding: '2rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textAlign: 'center'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.background = action.color;
                  e.currentTarget.style.boxShadow = '0 12px 25px rgba(0, 0, 0, 0.3)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.2)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  fontSize: '2.5rem',
                  marginBottom: '1rem',
                  display: 'block'
                }}>
                  {action.icon}
                </div>
                <h3 style={{
                  fontSize: '1.1rem',
                  fontWeight: '700',
                  color: 'white',
                  margin: '0 0 0.5rem 0'
                }}>
                  {action.title}
                </h3>
                <p style={{
                  fontSize: '0.9rem',
                  color: 'rgba(255, 255, 255, 0.7)',
                  margin: 0,
                  lineHeight: '1.4'
                }}>
                  {action.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        background: 'rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '2rem 0'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 2rem',
          textAlign: 'center'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '2rem',
            flexWrap: 'wrap',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.9rem',
              color: 'rgba(255, 255, 255, 0.7)',
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '0.75rem 1.25rem',
              borderRadius: '0.75rem',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <span>🏛️</span>
              SDVOSB Certified
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.9rem',
              color: 'rgba(255, 255, 255, 0.7)',
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '0.75rem 1.25rem',
              borderRadius: '0.75rem',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <span>⭐</span>
              SWaM Certified
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.9rem',
              color: 'rgba(255, 255, 255, 0.7)',
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '0.75rem 1.25rem',
              borderRadius: '0.75rem',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <span>🇺🇸</span>
              Veteran-Owned
            </div>
          </div>

          <p style={{
            fontSize: '1rem',
            color: 'rgba(255, 255, 255, 0.8)',
            margin: '0 0 0.5rem 0',
            fontWeight: '600'
          }}>
            Precise Analytics ATS • Virginia-Based Federal Contractor
          </p>
          
          <p style={{
            fontSize: '0.9rem',
            color: 'rgba(255, 255, 255, 0.6)',
            margin: 0
          }}>
            Secure applicant tracking for government contracting excellence
          </p>
        </div>
      </footer>

      {/* Enhanced Login Modal with Forgot Password */}
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
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.4)',
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
                background: 'linear-gradient(135deg, #0f766e, #134e4a)',
                borderRadius: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 2rem',
                boxShadow: '0 12px 35px rgba(15, 118, 110, 0.4)'
              }}>
                <span style={{ fontSize: '40px', color: 'white' }}>🔐</span>
              </div>
              <h2 style={{
                fontSize: '2.5rem',
                fontWeight: '800',
                color: '#1f2937',
                margin: '0 0 0.75rem 0'
              }}>
                {showForgotPassword ? 'Reset Password' : 'HR Portal Login'}
              </h2>
              <p style={{
                color: '#6b7280',
                margin: 0,
                fontSize: '1.1rem',
                fontWeight: '500'
              }}>
                {showForgotPassword ? 
                  'Enter your email to receive reset instructions' : 
                  'Welcome back! Please sign in to continue.'
                }
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
                  fontWeight: '600',
                  textAlign: 'center'
                }}>
                  {loginError}
                </div>
              )}

              {forgotPasswordStatus && (
                <div style={{
                  background: forgotPasswordStatus.includes('✅') ? 
                    'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                  border: `2px solid ${forgotPasswordStatus.includes('✅') ? 
                    'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                  color: forgotPasswordStatus.includes('✅') ? '#22c55e' : '#ef4444',
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
                      color: '#1f2937',
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
                        border: `2px solid rgba(15, 118, 110, 0.3)`,
                        borderRadius: '12px',
                        background: 'rgba(248, 250, 252, 0.9)',
                        color: '#1f2937',
                        transition: 'border-color 0.3s ease',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#0f766e'}
                      onBlur={(e) => e.target.style.borderColor = 'rgba(15, 118, 110, 0.3)'}
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
                      color: '#1f2937',
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
                        border: `2px solid rgba(15, 118, 110, 0.3)`,
                        borderRadius: '12px',
                        background: 'rgba(248, 250, 252, 0.9)',
                        color: '#1f2937',
                        transition: 'border-color 0.3s ease',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#0f766e'}
                      onBlur={(e) => e.target.style.borderColor = 'rgba(15, 118, 110, 0.3)'}
                    />
                  </div>

                  <button
                    onClick={handleLogin}
                    disabled={isLoading}
                    style={{
                      width: '100%',
                      background: 'linear-gradient(135deg, #0f766e, #134e4a)',
                      color: 'white',
                      border: 'none',
                      padding: '1.5rem',
                      borderRadius: '14px',
                      fontSize: '1.2rem',
                      fontWeight: '700',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 6px 20px rgba(15, 118, 110, 0.4)',
                      opacity: isLoading ? 0.7 : 1,
                      marginBottom: '1.5rem'
                    }}
                    onMouseOver={(e) => {
                      if (!isLoading) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 10px 30px rgba(15, 118, 110, 0.5)';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!isLoading) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(15, 118, 110, 0.4)';
                      }
                    }}
                  >
                    {isLoading ? 'Signing In...' : 'Sign In to Dashboard'}
                  </button>

                  <div style={{ 
                    textAlign: 'center',
                    borderTop: '2px solid rgba(15, 118, 110, 0.2)',
                    paddingTop: '1.5rem'
                  }}>
                    <button
                      onClick={() => setShowForgotPassword(true)}
                      style={{
                        background: 'rgba(249, 115, 22, 0.1)',
                        border: '2px solid rgba(249, 115, 22, 0.3)',
                        color: '#f97316',
                        fontSize: '1.1rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        padding: '1rem 2rem',
                        borderRadius: '12px',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = 'rgba(249, 115, 22, 0.15)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'rgba(249, 115, 22, 0.1)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      🔑 Forgot your password?
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    marginBottom: '2rem'
                  }}>
                    <label style={{
                      fontSize: '1.1rem',
                      fontWeight: '700',
                      color: '#1f2937',
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
                        border: `2px solid rgba(15, 118, 110, 0.3)`,
                        borderRadius: '12px',
                        background: 'rgba(248, 250, 252, 0.9)',
                        color: '#1f2937',
                        transition: 'border-color 0.3s ease',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#0f766e'}
                      onBlur={(e) => e.target.style.borderColor = 'rgba(15, 118, 110, 0.3)'}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                    <button
                      onClick={() => {
                        setShowForgotPassword(false);
                        setForgotPasswordEmail('');
                        setForgotPasswordStatus('');
                      }}
                      style={{
                        flex: 1,
                        background: 'rgba(156, 163, 175, 0.2)',
                        color: '#6b7280',
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
                        background: 'linear-gradient(135deg, #f97316, #ea580c)',
                        color: 'white',
                        border: 'none',
                        padding: '1.25rem',
                        borderRadius: '12px',
                        fontSize: '1.1rem',
                        fontWeight: '700',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 4px 15px rgba(249, 115, 22, 0.3)',
                        opacity: isLoading ? 0.7 : 1
                      }}
                      onMouseOver={(e) => {
                        if (!isLoading) {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 8px 25px rgba(249, 115, 22, 0.4)';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (!isLoading) {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 15px rgba(249, 115, 22, 0.3)';
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
              fontSize: '0.95rem',
              color: '#6b7280',
              fontWeight: '500'
            }}>
              Authorized HR personnel only
            </div>
          </div>
        </div>
      )}

      {/* Loading Spinner Keyframes */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
          header div[style*="display: flex"] {
            flex-direction: column !important;
            gap: 1rem !important;
          }
          
          main div[style*="padding: 4rem"] {
            padding: 2rem !important;
          }
        }
      `}</style>
    </div>
  );
}