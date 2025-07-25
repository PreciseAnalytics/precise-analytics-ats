'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // NEW: Forgot password functionality
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordStatus, setForgotPasswordStatus] = useState('');

  useEffect(() => {
    setMounted(true);
    
    const token = localStorage.getItem('ats-token');
    const user = localStorage.getItem('ats-user');
    
    if (token && user) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  const handleSubmit = async () => {
    if (!mounted) return;
    
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('ats-token', data.token);
        localStorage.setItem('ats-user', JSON.stringify(data.user));
        router.push('/dashboard');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
      console.error('Login error:', error);
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

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      if (showForgotPassword) {
        handleForgotPassword();
      } else {
        handleSubmit();
      }
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

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      background: 'linear-gradient(135deg, #0f766e 0%, #134e4a 25%, #1e3a3a 50%, #0f766e 75%, #134e4a 100%)'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '500px',
        padding: '4rem',
        borderRadius: '2rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        background: 'rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '3rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #0f766e, #134e4a)',
            borderRadius: '1rem',
            marginBottom: '2rem',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3)'
          }}>
            <span style={{
              fontSize: '2rem',
              fontWeight: '800',
              color: 'white',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
            }}>
              PA
            </span>
          </div>

          <h1 style={{
            fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
            fontWeight: '700',
            marginBottom: '1rem',
            color: 'white',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
            margin: '0 0 1rem 0'
          }}>
            Precise Analytics ATS
          </h1>
          
          <p style={{
            fontSize: 'clamp(1.1rem, 3vw, 1.3rem)',
            color: 'rgba(255, 255, 255, 0.9)',
            margin: '0 0 1rem 0'
          }}>
            {showForgotPassword ? 'Password Reset' : 'Applicant Tracking System'}
          </p>
          
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '0.75rem 1.5rem',
            background: 'rgba(34, 197, 94, 0.1)',
            borderRadius: '1rem',
            border: '1px solid rgba(34, 197, 94, 0.3)'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#22c55e',
              boxShadow: '0 0 10px rgba(34, 197, 94, 0.5)'
            }}></div>
            <span style={{
              fontSize: '0.9rem',
              color: '#22c55e',
              fontWeight: '500'
            }}>
              {showForgotPassword ? 'Account Recovery' : 'Secure Access Portal'}
            </span>
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <div style={{
            padding: '1rem',
            borderRadius: '0.75rem',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '2px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
            marginBottom: '2rem',
            textAlign: 'center',
            fontSize: '0.95rem',
            fontWeight: '500'
          }}>
            <span style={{ fontSize: '1.2rem', marginRight: '0.5rem' }}>⚠️</span>
            {error}
          </div>
        )}

        {forgotPasswordStatus && (
          <div style={{
            padding: '1rem',
            borderRadius: '0.75rem',
            background: forgotPasswordStatus.includes('✅') ? 
              'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `2px solid ${forgotPasswordStatus.includes('✅') ? 
              'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            color: forgotPasswordStatus.includes('✅') ? '#86efac' : '#fca5a5',
            marginBottom: '2rem',
            textAlign: 'center',
            fontSize: '0.95rem',
            fontWeight: '500'
          }}>
            {forgotPasswordStatus}
          </div>
        )}

        {/* Main Form */}
        <div style={{ textAlign: 'left' }}>
          {!showForgotPassword ? (
            <>
              {/* Email Field */}
              <div style={{ marginBottom: '2rem' }}>
                <label htmlFor="email" style={{
                  display: 'block',
                  marginBottom: '0.75rem',
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '1rem'
                }}>
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={credentials.email}
                  onChange={handleChange}
                  onKeyPress={handleKeyPress}
                  required
                  placeholder="careers@preciseanalytics.io"
                  style={{
                    width: '100%',
                    padding: '1.2rem',
                    borderRadius: '1rem',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    background: 'rgba(255, 255, 255, 0.9)',
                    color: '#1f2937',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease',
                    fontWeight: '500'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#f97316';
                    e.target.style.boxShadow = '0 0 0 3px rgba(249, 115, 22, 0.1)';
                    e.target.style.background = 'rgba(255, 255, 255, 1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                    e.target.style.boxShadow = 'none';
                    e.target.style.background = 'rgba(255, 255, 255, 0.9)';
                  }}
                />
              </div>

              {/* Password Field */}
              <div style={{ marginBottom: '2rem' }}>
                <label htmlFor="password" style={{
                  display: 'block',
                  marginBottom: '0.75rem',
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '1rem'
                }}>
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={credentials.password}
                  onChange={handleChange}
                  onKeyPress={handleKeyPress}
                  required
                  placeholder="Enter your password"
                  style={{
                    width: '100%',
                    padding: '1.2rem',
                    borderRadius: '1rem',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    background: 'rgba(255, 255, 255, 0.9)',
                    color: '#1f2937',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease',
                    fontWeight: '500'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#f97316';
                    e.target.style.boxShadow = '0 0 0 3px rgba(249, 115, 22, 0.1)';
                    e.target.style.background = 'rgba(255, 255, 255, 1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                    e.target.style.boxShadow = 'none';
                    e.target.style.background = 'rgba(255, 255, 255, 0.9)';
                  }}
                />
              </div>

              {/* Login Button */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '1.3rem',
                  borderRadius: '1rem',
                  border: 'none',
                  background: isLoading 
                    ? 'rgba(249, 115, 22, 0.6)' 
                    : 'linear-gradient(135deg, #f97316, #ea580c)',
                  color: 'white',
                  fontSize: '1.1rem',
                  fontWeight: '700',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
                  boxShadow: isLoading ? 'none' : '0 4px 12px rgba(249, 115, 22, 0.3)',
                  marginBottom: '1.5rem'
                }}
                onMouseOver={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(249, 115, 22, 0.4)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(249, 115, 22, 0.3)';
                  }
                }}
              >
                {isLoading ? (
                  <>
                    <div style={{
                      width: '18px',
                      height: '18px',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    Signing In...
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: '1.2rem' }}>🔐</span>
                    Access ATS Dashboard
                  </>
                )}
              </button>

              {/* Forgot Password Link */}
              <div style={{ 
                textAlign: 'center',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                paddingTop: '1.5rem'
              }}>
                <button
                  onClick={() => setShowForgotPassword(true)}
                  style={{
                    background: 'rgba(249, 115, 22, 0.1)',
                    border: '2px solid rgba(249, 115, 22, 0.3)',
                    color: '#fb923c',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.75rem',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'rgba(249, 115, 22, 0.15)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
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
              {/* Forgot Password Form */}
              <div style={{ marginBottom: '2rem' }}>
                <label htmlFor="reset-email" style={{
                  display: 'block',
                  marginBottom: '0.75rem',
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '1rem'
                }}>
                  Email Address
                </label>
                <input
                  type="email"
                  id="reset-email"
                  name="reset-email"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  required
                  placeholder="careers@preciseanalytics.io"
                  style={{
                    width: '100%',
                    padding: '1.2rem',
                    borderRadius: '1rem',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    background: 'rgba(255, 255, 255, 0.9)',
                    color: '#1f2937',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease',
                    fontWeight: '500'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#f97316';
                    e.target.style.boxShadow = '0 0 0 3px rgba(249, 115, 22, 0.1)';
                    e.target.style.background = 'rgba(255, 255, 255, 1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                    e.target.style.boxShadow = 'none';
                    e.target.style.background = 'rgba(255, 255, 255, 0.9)';
                  }}
                />
              </div>

              {/* Reset Button */}
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '1.3rem',
                  borderRadius: '1rem',
                  border: 'none',
                  background: isLoading 
                    ? 'rgba(249, 115, 22, 0.6)' 
                    : 'linear-gradient(135deg, #f97316, #ea580c)',
                  color: 'white',
                  fontSize: '1.1rem',
                  fontWeight: '700',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
                  boxShadow: isLoading ? 'none' : '0 4px 12px rgba(249, 115, 22, 0.3)',
                  marginBottom: '1.5rem'
                }}
                onMouseOver={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(249, 115, 22, 0.4)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(249, 115, 22, 0.3)';
                  }
                }}
              >
                {isLoading ? (
                  <>
                    <div style={{
                      width: '18px',
                      height: '18px',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: '1.2rem' }}>📧</span>
                    Send Reset Instructions
                  </>
                )}
              </button>

              {/* Back to Login Button */}
              <div style={{ textAlign: 'center' }}>
                <button
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotPasswordEmail('');
                    setForgotPasswordStatus('');
                    setError('');
                  }}
                  style={{
                    background: 'rgba(156, 163, 175, 0.1)',
                    border: '2px solid rgba(156, 163, 175, 0.3)',
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.75rem',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'rgba(156, 163, 175, 0.15)';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(156, 163, 175, 0.1)';
                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
                  }}
                >
                  ← Back to Login
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer - Keep SDVOSB and SWaM certifications */}
        <div style={{
          marginTop: '3rem',
          padding: '2rem 0 0 0',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          textAlign: 'center'
        }}>
          <p style={{
            fontSize: '0.9rem',
            color: 'rgba(255, 255, 255, 0.7)',
            margin: '0 0 1.5rem 0',
            fontWeight: '500'
          }}>
            🔒 Authorized Personnel Only
          </p>
          
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '1.5rem',
            flexWrap: 'wrap'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.85rem',
              color: 'rgba(255, 255, 255, 0.6)',
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <span>🏛️</span>
              SDVOSB Certified
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.85rem',
              color: 'rgba(255, 255, 255, 0.6)',
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <span>⭐</span>
              SWaM Certified
            </div>
          </div>
        </div>

        {/* Link to Main Website */}
        <div style={{
          position: 'absolute',
          top: '1.5rem',
          right: '1.5rem'
        }}>
          <a 
            href="https://preciseanalytics.io"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.25rem',
              borderRadius: '0.75rem',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: 'white',
              textDecoration: 'none',
              fontSize: '0.9rem',
              fontWeight: '500',
              transition: 'all 0.3s ease',
              backdropFilter: 'blur(10px)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <span>🌐</span>
            Main Website
          </a>
        </div>

        {/* Default credentials info */}
        <div style={{
          position: 'absolute',
          bottom: '1rem',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '0.8rem',
          color: 'rgba(255, 255, 255, 0.5)',
          background: 'rgba(0, 0, 0, 0.3)',
          padding: '0.5rem 1rem',
          borderRadius: '0.5rem',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          textAlign: 'center'
        }}>
          Demo: admin@preciseanalytics.io / admin123
        </div>
      </div>

      {/* Loading Spinner Keyframes */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
          div[style*="position: absolute"][style*="top: 1.5rem"] {
            position: static !important;
            margin-bottom: 1rem;
          }
        }
      `}</style>
    </div>
  );
}