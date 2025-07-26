'use client';

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import Container from '../../components/Container';
import { EnvVars } from '../../lib/env';
import { mq } from '../../utils/media';

// In your component:
<header style={{ padding: '2rem', textAlign: 'center' }}>
  <h1>Precise Analytics ATS</h1>
</header>

// ===========================================
// UNIFIED HEADER COMPONENT
// ===========================================

interface HeaderProps {
  isATS?: boolean;
}

const UnifiedHeader: React.FC<HeaderProps> = ({ isATS = false }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const mainNavItems = [
    { label: 'Home', href: '/' },
    { label: 'Services', href: '/services' },
    { label: 'About', href: '/about-us' },
    { label: 'Careers', href: '/careers' },
    { label: 'Contact', href: '/contact' }
  ];

  const atsNavItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Careers', href: '/careers' },
  { label: 'Applications', href: '/applications' }
  // Removing external link for now to fix build
];

  const navItems = isATS ? atsNavItems : mainNavItems;
  const logoHref = isATS ? '/dashboard' : '/';

  const isActivePage = (href: string) => {
    if (typeof window === 'undefined') return false;
    const pathname = window.location.pathname;
    if (href === '/' && pathname === '/') return true;
    if (href !== '/' && pathname.startsWith(href)) return true;
    return false;
  };

  return (
    <HeaderWrapper isScrolled={isScrolled}>
      <HeaderContainer>
        <LogoSection>
          <Link href={logoHref} passHref>
            <LogoLink>
              <LogoText>
                Precise Analytics
                {isATS && <ATSBadge>ATS</ATSBadge>}
              </LogoText>
              <LogoSubtext>Your Data, Our Insights</LogoSubtext>
            </LogoLink>
          </Link>
        </LogoSection>

        <DesktopNav>
          {navItems.map((item) => (
            <NavItem key={item.href}>
              <Link href={item.href} passHref>
                <NavLink isActive={isActivePage(item.href)}>
                  {item.label}
                </NavLink>
              </Link>
            </NavItem>
          ))}
        </DesktopNav>

        <CTASection>
          {isATS ? (
            <CTAButton onClick={() => router.push('/careers')}>
              Post New Job
            </CTAButton>
          ) : (
            <CTAButton onClick={() => router.push('/contact')}>
              Get Started
            </CTAButton>
          )}
        </CTASection>

        <MobileMenuButton onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          <MenuIcon isOpen={isMobileMenuOpen}>
            <span></span>
            <span></span>
            <span></span>
          </MenuIcon>
        </MobileMenuButton>
      </HeaderContainer>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <MobileMenu
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <MobileNavList>
              {navItems.map((item) => (
                <MobileNavItem key={item.href}>
                  <Link href={item.href} passHref>
                    <MobileNavLink 
                      isActive={isActivePage(item.href)}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.label}
                    </MobileNavLink>
                  </Link>
                </MobileNavItem>
              ))}
              <MobileNavItem>
                <MobileCTAButton onClick={() => {
                  setIsMobileMenuOpen(false);
                  router.push(isATS ? '/careers' : '/contact');
                }}>
                  {isATS ? 'Post New Job' : 'Get Started'}
                </MobileCTAButton>
              </MobileNavItem>
            </MobileNavList>
          </MobileMenu>
        )}
      </AnimatePresence>
    </HeaderWrapper>
  );
};

// ===========================================
// MAIN CAREERS PAGE COMPONENT
// ===========================================

interface Position {
  id: number;
  title: string;
  department: string;
  location: string;
  employment_type: string;
  experience_level?: string;
  salary_range?: string;
  security_clearance?: string;
  description: string;
  requirements: string[];
  salary_min?: number;
  salary_max?: number;
  benefits?: string;
  applications_count?: number;
  posted_date?: string;
  status?: string;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  positionId: string;
  position: string;
  coverLetter: string;
  resume: File | null;
  coverLetterFile: File | null;
  linkedinUrl: string;
  portfolioUrl: string;
  securityClearance?: string;
  veteranStatus?: boolean;
}

interface FormErrors {
  [key: string]: string;
}

const ATS_API_BASE = 'https://precise-analytics-ats.vercel.app/api';

export default function CareersPage() {
  const [isClient, setIsClient] = useState(false);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    positionId: '',
    position: '',
    coverLetter: '',
    resume: null,
    coverLetterFile: null,
    linkedinUrl: '',
    portfolioUrl: '',
    securityClearance: 'None',
    veteranStatus: false
  });

  useEffect(() => {
    setIsClient(true);
    fetchPositions();
  }, []);

  const debugAPICalls = async () => {
    console.log('🔍 DEBUGGING API SYNCHRONIZATION');
    
    try {
      console.log('Testing ATS API...');
      const atsResponse = await fetch(`${ATS_API_BASE}/jobs?status=active`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('ATS API Status:', atsResponse.status);
      
      if (atsResponse.ok) {
        const atsData = await atsResponse.json();
        console.log('✅ ATS API Response:', atsData);
        console.log('📊 ATS Job Count:', Array.isArray(atsData) ? atsData.length : atsData.jobs?.length);
      } else {
        console.error('❌ ATS API Failed:', atsResponse.statusText);
      }
    } catch (atsError) {
      console.error('❌ ATS API Error:', atsError);
    }
    
    try {
      console.log('Testing Local API...');
      const localResponse = await fetch('/api/positions?status=active');
      console.log('Local API Status:', localResponse.status);
      
      if (localResponse.ok) {
        const localData = await localResponse.json();
        console.log('✅ Local API Response:', localData);
        console.log('📊 Local Job Count:', localData.positions?.length);
      } else {
        console.error('❌ Local API Failed:', localResponse.statusText);
      }
    } catch (localError) {
      console.error('❌ Local API Error:', localError);
    }
  };

  const fetchPositions = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching positions from ATS API...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`${ATS_API_BASE}/jobs?status=active`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`ATS API HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📋 ATS API Success - Raw Response:', data);
      
      let jobsArray: any[] = [];
      if (Array.isArray(data)) {
        jobsArray = data;
      } else if (data.jobs && Array.isArray(data.jobs)) {
        jobsArray = data.jobs;
      } else if (data.positions && Array.isArray(data.positions)) {
        jobsArray = data.positions;
      } else {
        console.warn('⚠️ Unexpected ATS API response format:', data);
        throw new Error('Invalid API response format');
      }
      
      console.log(`✅ Found ${jobsArray.length} jobs in ATS`);
      
      const processedPositions = jobsArray
        .filter(job => job.status === 'active')
        .map((pos: any) => ({
          id: pos.id,
          title: pos.title || 'Untitled Position',
          department: pos.department || 'General',
          location: pos.location || 'Richmond, VA',
          employment_type: pos.employment_type || 'Full-time',
          experience_level: pos.experience_level,
          salary_range: pos.salary_range,
          security_clearance: pos.security_clearance || 'None',
          description: pos.description || 'No description available',
          requirements: typeof pos.requirements === 'string' 
            ? pos.requirements.split('\n').filter((req: string) => req.trim().length > 0)
            : pos.requirements || [],
          applications_count: pos.applications_count || 0,
          posted_date: pos.posted_date,
          status: pos.status || 'active',
          salary_min: pos.salary_min,
          salary_max: pos.salary_max,
          benefits: pos.benefits
        }));
      
      console.log(`✅ Processed ${processedPositions.length} active positions from ATS`);
      setPositions(processedPositions);
      
    } catch (error) {
      console.error('❌ ATS API failed, trying fallback:', error);
      
      try {
        console.log('🔄 Using fallback local API...');
        const fallbackResponse = await fetch('/api/positions?status=active&include_count=true');
        
        if (!fallbackResponse.ok) {
          throw new Error(`Local API HTTP ${fallbackResponse.status}`);
        }
        
        const fallbackData = await fallbackResponse.json();
        console.log('📋 Fallback API Response:', fallbackData);
        
        if (fallbackData.success && fallbackData.positions) {
          const processedFallback = fallbackData.positions.map((pos: any) => ({
            ...pos,
            requirements: typeof pos.requirements === 'string' 
              ? pos.requirements.split('\n').filter((req: string) => req.trim()) 
              : pos.requirements || []
          }));
          
          console.log(`⚠️ Using fallback: ${processedFallback.length} jobs from local API`);
          setPositions(processedFallback);
        } else {
          console.error('❌ Fallback API returned invalid data');
          setPositions([]);
        }
      } catch (fallbackError) {
        console.error('❌ Both ATS and fallback APIs failed:', fallbackError);
        setPositions([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneNumber = (value: string): string => {
    const phoneNumber = value.replace(/[^\d]/g, '');
    if (phoneNumber.length < 4) return phoneNumber;
    if (phoneNumber.length < 7) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    }
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else {
      const phoneDigits = formData.phone.replace(/[^\d]/g, '');
      if (phoneDigits.length !== 10) {
        errors.phone = 'Please enter a valid 10-digit phone number';
      }
    }

    if (!formData.positionId) {
      errors.positionId = 'Please select a position';
    }

    if (!formData.coverLetter.trim()) {
      errors.coverLetter = 'Please tell us why you are interested in this role';
    }

    if (!formData.resume) {
      errors.resume = 'Resume is required';
    } else if (formData.resume.size > 5 * 1024 * 1024) {
      errors.resume = 'Resume file must be under 5MB';
    }

    if (formData.coverLetterFile && formData.coverLetterFile.size > 5 * 1024 * 1024) {
      errors.coverLetterFile = 'Cover letter file must be under 5MB';
    }

    if (formData.linkedinUrl && !isValidUrl(formData.linkedinUrl)) {
      errors.linkedinUrl = 'Please enter a valid LinkedIn URL';
    }

    if (formData.portfolioUrl && !isValidUrl(formData.portfolioUrl)) {
      errors.portfolioUrl = 'Please enter a valid portfolio/website URL';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isValidUrl = (string: string): boolean => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const uploadFile = async (file: File, type: 'resume' | 'cover_letter'): Promise<string> => {
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    uploadFormData.append('type', type);

    let response = await fetch('/api/upload', {
      method: 'POST',
      body: uploadFormData,
    });

    if (!response.ok) {
      console.log('Local upload failed, trying ATS upload...');
      response = await fetch(`${ATS_API_BASE}/upload`, {
        method: 'POST',
        body: uploadFormData,
      });
    }

    if (!response.ok) {
      throw new Error(`File upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.success && !result.url) {
      throw new Error(result.error || 'File upload failed');
    }
    
    return result.url || result.fileUrl;
  };

  const handleChange = (e: any) => {
    const { name, value, files, type, checked } = e.target;
    
    if (files) {
      setFormData({ ...formData, [name]: files[0] });
    } else if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked });
    } else {
      let processedValue = value;
      
      if (name === 'phone') {
        processedValue = formatPhoneNumber(value);
      }
      
      if (name === 'positionId') {
        const selectedPos = positions.find(p => p.id.toString() === value);
        setFormData({ 
          ...formData, 
          [name]: processedValue,
          position: selectedPos?.title || ''
        });
      } else {
        setFormData({ ...formData, [name]: processedValue });
      }
    }

    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: '' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitSuccess(false);
    setSubmitError(null);

    try {
      console.log('🚀 Starting application submission to ATS...');
      
      let resumeUrl = '';
      let coverLetterFileUrl = '';

      if (formData.resume) {
        console.log('📎 Uploading resume...');
        resumeUrl = await uploadFile(formData.resume, 'resume');
        console.log('✅ Resume uploaded:', resumeUrl);
      }

      if (formData.coverLetterFile) {
        console.log('📎 Uploading cover letter...');
        coverLetterFileUrl = await uploadFile(formData.coverLetterFile, 'cover_letter');
        console.log('✅ Cover letter uploaded:', coverLetterFileUrl);
      }

      const applicationData = {
        job_position_id: parseInt(formData.positionId),
        applicant_name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        resume_url: resumeUrl,
        cover_letter_url: coverLetterFileUrl || null,
        security_clearance: formData.securityClearance || 'None',
        veteran_status: formData.veteranStatus || false,
        source: 'careers_website',
        notes: formData.coverLetter.trim(),
        linkedin_url: formData.linkedinUrl.trim() || null,
        portfolio_url: formData.portfolioUrl.trim() || null
      };

      console.log('📝 Submitting application to ATS:', {
        name: applicationData.applicant_name,
        email: applicationData.email,
        position_id: applicationData.job_position_id,
        hasResume: !!resumeUrl
      });

      const response = await fetch(`${ATS_API_BASE}/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(applicationData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `ATS API error: ${response.status}`);
      }

      console.log('✅ Application submitted successfully to ATS:', {
        applicationId: result.applicationId,
        message: result.message
      });

      setSubmitSuccess(true);
      setShowApplicationForm(false);
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        positionId: '',
        position: '',
        coverLetter: '',
        resume: null,
        coverLetterFile: null,
        linkedinUrl: '',
        portfolioUrl: '',
        securityClearance: 'None',
        veteranStatus: false
      });

      // Clear file inputs
      const resumeInput = document.getElementById('resume') as HTMLInputElement;
      const coverLetterInput = document.getElementById('coverLetterFile') as HTMLInputElement;
      if (resumeInput) resumeInput.value = '';
      if (coverLetterInput) coverLetterInput.value = '';

      // Analytics tracking
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'application_submitted', {
          'job_position': formData.position,
          'application_source': 'careers_page',
          'application_id': result.applicationId
        });
      }

    } catch (error) {
      console.error('❌ Application submission error:', error);
      
      let errorMessage = 'An unexpected error occurred. Please try again or contact us directly at careers@preciseanalytics.io';
      
      if (error instanceof Error) {
        if (error.message.includes('404') || error.message.includes('Position not found')) {
          errorMessage = 'The selected position is no longer available. Please refresh the page and try again.';
        } else if (error.message.includes('500')) {
          errorMessage = 'Server error occurred. Our team has been notified. Please try again or email careers@preciseanalytics.io';
        } else if (error.message.includes('upload')) {
          errorMessage = 'File upload failed. Please check your files and try again.';
        } else if (error.message.includes('Network')) {
          errorMessage = 'Network connection issue. Please check your internet connection and try again.';
        } else {
          errorMessage = `Submission failed: ${error.message}`;
        }
      }
      
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplyClick = (position: Position) => {
    console.log('Apply button clicked for position:', position.title);
    setSelectedPosition(position);
    setFormData({ 
      ...formData, 
      positionId: position.id.toString(), 
      position: position.title 
    });
    setShowApplicationForm(true);
    setSubmitSuccess(false);
    setSubmitError(null);
    setFormErrors({});
  };

  const formatSalary = (min?: number, max?: number, range?: string) => {
    if (range) return range;
    
    if (!min && !max) return null;
    if (min && max) return `$${(min/1000).toFixed(0)}K - $${(max/1000).toFixed(0)}K`;
    if (min) return `$${(min/1000).toFixed(0)}K+`;
    if (max) return `Up to $${(max/1000).toFixed(0)}K`;
  };

  if (!isClient) {
    return null;
  }

  return (
    <>
      <Head>
        <title>{`${EnvVars.SITE_NAME} - Careers`}</title>
        <meta name="description" content="Join the Precise Analytics team and help drive data transformation in mission-driven sectors." />
      </Head>

      {/* Unified Header */}
      <UnifiedHeader isATS={false} />

      <PageWrapper>
        <Container>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <PageTitle>Join Our Team</PageTitle>
            <PageSubtitle>Empowering missions through data—together.</PageSubtitle>
          </motion.div>

          {/* Success Message */}
          {submitSuccess && (
            <SuccessMessage>
              <SuccessHeader>
                <SuccessIcon>✅</SuccessIcon>
                <SuccessTitle>Application Successfully Submitted!</SuccessTitle>
              </SuccessHeader>
              <SuccessContent>
                <WelcomeMessage>
                  Thank you for your interest in joining the Precise Analytics team! We'll review your application and get back to you within 5 business days.
                </WelcomeMessage>
                <SubmitAnotherBtn onClick={() => setSubmitSuccess(false)}>
                  Submit Another Application
                </SubmitAnotherBtn>
              </SuccessContent>
            </SuccessMessage>
          )}

          <PositionsSection>
            <SectionTitle>Open Positions</SectionTitle>
            <SectionSubtitle>
              Explore opportunities to grow your career with us
              {positions.length > 0 && (
                <PositionCount>
                  {positions.length} open position{positions.length !== 1 ? 's' : ''}
                </PositionCount>
              )}
            </SectionSubtitle>
            
            {loading ? (
              <LoadingContainer>
                <LoadingSpinner />
                <LoadingText>Loading career opportunities...</LoadingText>
              </LoadingContainer>
            ) : positions.length === 0 ? (
              <NoPositionsMessage>
                <NoPositionsIcon>📋</NoPositionsIcon>
                <NoPositionsTitle>No Open Positions</NoPositionsTitle>
                <NoPositionsText>
                  We don't have any open positions at the moment, but we're always looking for talented individuals to join our team.
                  Feel free to send your resume to <a href="mailto:careers@preciseanalytics.io">careers@preciseanalytics.io</a> and we'll keep you in mind for future opportunities.
                </NoPositionsText>
              </NoPositionsMessage>
            ) : (
              <JobCardsGrid>
                {positions.map((position) => (
                  <JobCard key={position.id}>
                    <JobCardHeader>
                      <JobTitle>{position.title}</JobTitle>
                      <JobMeta>
                        <JobLocation>{position.location}</JobLocation>
                        <JobDepartment>{position.department}</JobDepartment>
                        {position.experience_level && (
                          <JobLevel>{position.experience_level}</JobLevel>
                        )}
                      </JobMeta>
                      {formatSalary(position.salary_min, position.salary_max, position.salary_range) && (
                        <SalaryRange>{formatSalary(position.salary_min, position.salary_max, position.salary_range)}</SalaryRange>
                      )}
                      {position.security_clearance && position.security_clearance !== 'None' && (
                        <SecurityClearance>🔒 {position.security_clearance} Clearance</SecurityClearance>
                      )}
                      {position.applications_count !== undefined && (
                        <ApplicationCount>{position.applications_count} applications</ApplicationCount>
                      )}
                    </JobCardHeader>
                    
                    <JobDescription>{position.description}</JobDescription>
                    
                    <RequirementsSection>
                      <RequirementsTitle>Key Requirements:</RequirementsTitle>
                      <RequirementsList>
                        {position.requirements.map((req, i) => (
                          <RequirementItem key={i}>{req.replace(/^[•\-\*]\s*/, '')}</RequirementItem>
                        ))}
                      </RequirementsList>
                    </RequirementsSection>

                    {position.benefits && (
                      <BenefitsSection>
                        <BenefitsTitle>Benefits:</BenefitsTitle>
                        <BenefitsText>{position.benefits}</BenefitsText>
                      </BenefitsSection>
                    )}

                    <ApplyButton onClick={() => handleApplyClick(position)}>
                      Apply Now
                    </ApplyButton>
                  </JobCard>
                ))}
              </JobCardsGrid>
            )}
          </PositionsSection>

          {/* Application Form Modal */}
          {showApplicationForm && selectedPosition && (
            <ApplicationModal onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowApplicationForm(false);
              }
            }}>
              <ModalContent onClick={(e) => e.stopPropagation()}>
                <ModalHeader>
                  <div>
                    <ModalTitle>Apply for {selectedPosition.title}</ModalTitle>
                    <ModalSubtitle>{selectedPosition.department} • {selectedPosition.location}</ModalSubtitle>
                  </div>
                  <CloseButton onClick={() => setShowApplicationForm(false)}>×</CloseButton>
                </ModalHeader>

                {submitError && (
                  <ErrorMessage>
                    <ErrorHeader>
                      <ErrorIcon>⚠️</ErrorIcon>
                      <ErrorTitle>Application Submission Issue</ErrorTitle>
                    </ErrorHeader>
                    <ErrorContent>
                      <ErrorText>{submitError}</ErrorText>
                      <RetryButton onClick={() => setSubmitError(null)}>
                        Try Again
                      </RetryButton>
                    </ErrorContent>
                  </ErrorMessage>
                )}

                <Form onSubmit={handleSubmit}>
                  <FormGrid>
                    <FormField>
                      <label htmlFor="firstName">First Name *</label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        autoComplete="given-name"
                        placeholder="Enter your first name"
                        required
                      />
                      {formErrors.firstName && <FieldError>{formErrors.firstName}</FieldError>}
                    </FormField>
                    
                    <FormField>
                      <label htmlFor="lastName">Last Name *</label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        autoComplete="family-name"
                        placeholder="Enter your last name"
                        required
                      />
                      {formErrors.lastName && <FieldError>{formErrors.lastName}</FieldError>}
                    </FormField>
                  </FormGrid>

                  <FormField>
                    <label htmlFor="email">Email Address *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      autoComplete="email"
                      placeholder="your.email@example.com"
                      required
                    />
                    {formErrors.email && <FieldError>{formErrors.email}</FieldError>}
                  </FormField>

                  <FormField>
                    <label htmlFor="phone">Phone Number *</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      autoComplete="tel"
                      placeholder="(555) 123-4567"
                      maxLength={14}
                      required
                    />
                    <PhoneNote>US phone number required for contact purposes</PhoneNote>
                    {formErrors.phone && <FieldError>{formErrors.phone}</FieldError>}
                  </FormField>

                  <FormGrid>
                    <FormField>
                      <label htmlFor="linkedinUrl">LinkedIn Profile (Optional)</label>
                      <input
                        type="url"
                        id="linkedinUrl"
                        name="linkedinUrl"
                        value={formData.linkedinUrl}
                        onChange={handleChange}
                        placeholder="https://linkedin.com/in/yourprofile"
                      />
                      {formErrors.linkedinUrl && <FieldError>{formErrors.linkedinUrl}</FieldError>}
                    </FormField>

                    <FormField>
                      <label htmlFor="portfolioUrl">Portfolio/Website (Optional)</label>
                      <input
                        type="url"
                        id="portfolioUrl"
                        name="portfolioUrl"
                        value={formData.portfolioUrl}
                        onChange={handleChange}
                        placeholder="https://yourportfolio.com"
                      />
                      {formErrors.portfolioUrl && <FieldError>{formErrors.portfolioUrl}</FieldError>}
                    </FormField>
                  </FormGrid>

                  {/* Federal Contracting Fields */}
                  <FormGrid>
                    <FormField>
                      <label htmlFor="securityClearance">Security Clearance</label>
                      <select
                        id="securityClearance"
                        name="securityClearance"
                        value={formData.securityClearance}
                        onChange={handleChange}
                      >
                        <option value="None">None</option>
                        <option value="Public Trust">Public Trust</option>
                        <option value="Secret">Secret</option>
                        <option value="Top Secret">Top Secret</option>
                        <option value="TS/SCI">TS/SCI</option>
                      </select>
                    </FormField>

                    <FormField>
                      <VeteranCheckbox>
                        <input
                          type="checkbox"
                          id="veteranStatus"
                          name="veteranStatus"
                          checked={formData.veteranStatus}
                          onChange={handleChange}
                        />
                        <label htmlFor="veteranStatus">I am a U.S. Military Veteran</label>
                      </VeteranCheckbox>
                      <VeteranNote>For SDVOSB compliance and preference consideration</VeteranNote>
                    </FormField>
                  </FormGrid>

                  <FileUploadGrid>
                    <FileUploadWrapper>
                      <label htmlFor="resume">Resume/CV *</label>
                      <FileInput
                        type="file"
                        id="resume"
                        name="resume"
                        accept=".pdf,.doc,.docx"
                        onChange={handleChange}
                        required
                      />
                      <FileNote>PDF, DOC, or DOCX (max 5MB)</FileNote>
                      {formErrors.resume && <FieldError>{formErrors.resume}</FieldError>}
                    </FileUploadWrapper>
                    
                    <FileUploadWrapper>
                      <label htmlFor="coverLetterFile">Cover Letter File (Optional)</label>
                      <FileInput
                        type="file"
                        id="coverLetterFile"
                        name="coverLetterFile"
                        accept=".pdf,.doc,.docx"
                        onChange={handleChange}
                      />
                      <FileNote>PDF, DOC, or DOCX (max 5MB)</FileNote>
                      {formErrors.coverLetterFile && <FieldError>{formErrors.coverLetterFile}</FieldError>}
                    </FileUploadWrapper>
                  </FileUploadGrid>

                  <FormField>
                    <label htmlFor="coverLetter">Why are you interested in this role? *</label>
                    <textarea
                      id="coverLetter"
                      name="coverLetter"
                      rows={6}
                      value={formData.coverLetter}
                      onChange={handleChange}
                      placeholder="Tell us about your interest in this position and what you'd bring to our team..."
                      minLength={50}
                      required
                    />
                    <MessageNote>Please provide at least 50 characters describing your interest</MessageNote>
                    {formErrors.coverLetter && <FieldError>{formErrors.coverLetter}</FieldError>}
                  </FormField>

                  <SubmitButtonGroup>
                    <CancelButton type="button" onClick={() => setShowApplicationForm(false)}>
                      Cancel
                    </CancelButton>
                    <SubmitBtn type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <span style={{ marginRight: '0.5rem' }}>📤</span>
                          Submitting Application...
                        </>
                      ) : (
                        'Submit Application'
                      )}
                    </SubmitBtn>
                  </SubmitButtonGroup>

                  <ContactInfo>
                    <p>Questions about the position? Contact us at <a href="mailto:careers@preciseanalytics.io">careers@preciseanalytics.io</a></p>
                  </ContactInfo>
                </Form>
              </ModalContent>
            </ApplicationModal>
          )}

          {/* Footer */}
          <CompanyCommitment>
            <CommitmentTitle>Don't see the right fit?</CommitmentTitle>
            <CommitmentText>
              We're always looking for talented individuals who share our passion for data analytics and federal contracting excellence.
              Feel free to send your resume to <a href="mailto:careers@preciseanalytics.io">careers@preciseanalytics.io</a> and we'll keep you in mind for future opportunities.
            </CommitmentText>
          </CompanyCommitment>
        </Container>
      </PageWrapper>
    </>
  );
}

/* ===========================================
   STYLED COMPONENTS - HEADER
   =========================================== */

const HeaderWrapper = styled.header<{ isScrolled: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  transition: all 0.3s ease;
  background: ${props => props.isScrolled 
    ? 'rgba(var(--background), 0.95)' 
    : 'rgba(var(--background), 0.9)'};
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(var(--text), 0.1);
  box-shadow: ${props => props.isScrolled 
    ? '0 4px 20px rgba(0, 0, 0, 0.1)' 
    : 'none'};
`;

const HeaderContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 80px;

  @media (max-width: 768px) {
    padding: 1rem;
    height: 70px;
  }
`;

const LogoSection = styled.div`
  flex-shrink: 0;
`;

const LogoLink = styled.a`
  text-decoration: none;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

const LogoText = styled.h1`
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(135deg, rgb(255, 125, 0), rgb(255, 165, 0));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  display: flex;
  align-items: center;
  gap: 0.8rem;

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const ATSBadge = styled.span`
  background: linear-gradient(135deg, rgb(255, 125, 0), rgb(255, 165, 0));
  color: white;
  padding: 0.2rem 0.6rem;
  border-radius: 0.4rem;
  font-size: 0.8rem;
  font-weight: 600;
  -webkit-background-clip: initial;
  -webkit-text-fill-color: initial;
`;

const LogoSubtext = styled.p`
  font-size: 0.9rem;
  color: rgb(var(--text), 0.7);
  margin: 0;
  font-weight: 500;

  @media (max-width: 768px) {
    font-size: 0.8rem;
  }
`;

const DesktopNav = styled.nav`
  display: flex;
  align-items: center;
  gap: 2rem;

  @media (max-width: 768px) {
    display: none;
  }
`;

const NavItem = styled.div`
  position: relative;
`;

const NavLink = styled.a<{ isActive: boolean }>`
  text-decoration: none;
  color: ${props => props.isActive 
    ? 'rgb(255, 125, 0)' 
    : 'rgb(var(--text), 0.8)'};
  font-weight: ${props => props.isActive ? '600' : '500'};
  font-size: 1rem;
  padding: 0.8rem 1rem;
  border-radius: 0.5rem;
  transition: all 0.3s ease;
  position: relative;

  &:hover {
    color: rgb(255, 125, 0);
    background: rgba(255, 125, 0, 0.1);
  }

  ${props => props.isActive && `
    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 20px;
      height: 2px;
      background: rgb(255, 125, 0);
      border-radius: 1px;
    }
  `}
`;

const ExternalNavLink = styled.a`
  text-decoration: none;
  color: rgb(var(--text), 0.8);
  font-weight: 500;
  font-size: 1rem;
  padding: 0.8rem 1rem;
  border-radius: 0.5rem;
  transition: all 0.3s ease;

  &:hover {
    color: rgb(255, 125, 0);
    background: rgba(255, 125, 0, 0.1);
  }
`;

const CTASection = styled.div`
  @media (max-width: 768px) {
    display: none;
  }
`;

const CTAButton = styled.button`
  background: linear-gradient(135deg, rgb(255, 125, 0), rgb(255, 165, 0));
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 0.8rem;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(255, 125, 0, 0.3);
  }
`;

const MobileMenuButton = styled.button`
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;

  @media (max-width: 768px) {
    display: block;
  }
`;

const MenuIcon = styled.div<{ isOpen: boolean }>`
  width: 24px;
  height: 18px;
  position: relative;
  
  span {
    display: block;
    position: absolute;
    height: 2px;
    width: 100%;
    background: rgb(var(--text));
    border-radius: 1px;
    opacity: 1;
    left: 0;
    transform: rotate(0deg);
    transition: 0.25s ease-in-out;

    &:nth-child(1) {
      top: ${props => props.isOpen ? '8px' : '0px'};
      transform: ${props => props.isOpen ? 'rotate(135deg)' : 'rotate(0deg)'};
    }

    &:nth-child(2) {
      top: 8px;
      opacity: ${props => props.isOpen ? '0' : '1'};
      left: ${props => props.isOpen ? '-30px' : '0px'};
    }

    &:nth-child(3) {
      top: ${props => props.isOpen ? '8px' : '16px'};
      transform: ${props => props.isOpen ? 'rotate(-135deg)' : 'rotate(0deg)'};
    }
  }
`;

const MobileMenu = styled(motion.div)`
  background: rgba(var(--cardBackground), 0.98);
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(var(--text), 0.1);
  overflow: hidden;

  @media (min-width: 769px) {
    display: none;
  }
`;

const MobileNavList = styled.ul`
  list-style: none;
  padding: 2rem;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const MobileNavItem = styled.li`
  margin: 0;
`;

const MobileNavLink = styled.a<{ isActive: boolean }>`
  display: block;
  text-decoration: none;
  color: ${props => props.isActive 
    ? 'rgb(255, 125, 0)' 
    : 'rgb(var(--text), 0.8)'};
  font-weight: ${props => props.isActive ? '600' : '500'};
  font-size: 1.1rem;
  padding: 1rem;
  border-radius: 0.8rem;
  transition: all 0.3s ease;
  background: ${props => props.isActive 
    ? 'rgba(255, 125, 0, 0.1)' 
    : 'transparent'};

  &:hover {
    color: rgb(255, 125, 0);
    background: rgba(255, 125, 0, 0.1);
  }
`;

const MobileExternalLink = styled.a`
  display: block;
  text-decoration: none;
  color: rgb(var(--text), 0.8);
  font-weight: 500;
  font-size: 1.1rem;
  padding: 1rem;
  border-radius: 0.8rem;
  transition: all 0.3s ease;

  &:hover {
    color: rgb(255, 125, 0);
    background: rgba(255, 125, 0, 0.1);
  }
`;

const MobileCTAButton = styled.button`
  width: 100%;
  background: linear-gradient(135deg, rgb(255, 125, 0), rgb(255, 165, 0));
  color: white;
  border: none;
  padding: 1rem 1.5rem;
  border-radius: 0.8rem;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 1rem;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(255, 125, 0, 0.3);
  }
`;

/* ===========================================
   STYLED COMPONENTS - MAIN PAGE
   =========================================== */

const PageWrapper = styled.div`
  padding: 8rem 0 4rem 0;
  min-height: 100vh;
  background: rgb(var(--background));
`;

const PageTitle = styled.h1`
  font-size: 4.8rem;
  font-weight: 700;
  background: linear-gradient(135deg, rgb(255, 125, 0), rgb(255, 165, 0));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-align: center;
  margin-bottom: 1rem;
  ${mq('<=tablet', 'font-size: 3.6rem;')}
`;

const PageSubtitle = styled.p`
  font-size: 2rem;
  text-align: center;
  margin-bottom: 6rem;
  color: rgb(var(--text), 0.8);
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 30vh;
  gap: 2rem;
`;

const LoadingSpinner = styled.div`
  width: 4rem;
  height: 4rem;
  border: 3px solid rgba(255, 125, 0, 0.1);
  border-top: 3px solid rgb(255, 125, 0);
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.p`
  font-size: 1.8rem;
  color: rgb(var(--text), 0.7);
  font-weight: 500;
`;

const PositionsSection = styled.section`
  margin-top: 2rem;
`;

const SectionTitle = styled.h2`
  font-size: 3.6rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 1rem;
  color: rgb(var(--text));
`;

const SectionSubtitle = styled.div`
  font-size: 1.8rem;
  text-align: center;
  margin-bottom: 4rem;
  color: rgb(var(--text), 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
`;

const PositionCount = styled.span`
  background: rgba(255, 125, 0, 0.1);
  color: rgb(255, 125, 0);
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  font-size: 1.4rem;
  font-weight: 600;
`;

const NoPositionsMessage = styled.div`
  text-align: center;
  padding: 6rem 2rem;
  background: rgba(var(--cardBackground), 0.5);
  border-radius: 2rem;
  border: 2px dashed rgba(var(--text), 0.2);
`;

const NoPositionsIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 2rem;
`;

const NoPositionsTitle = styled.h3`
  font-size: 2.4rem;
  font-weight: 600;
  color: rgb(var(--text));
  margin-bottom: 1.5rem;
`;

const NoPositionsText = styled.p`
  font-size: 1.6rem;
  color: rgb(var(--text), 0.7);
  line-height: 1.6;
  max-width: 50rem;
  margin: 0 auto;
  
  a {
    color: rgb(255, 125, 0);
    text-decoration: none;
    font-weight: 600;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

const JobCardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(35rem, 1fr));
  gap: 3rem;
  ${mq('<=tablet', 'grid-template-columns: 1fr;')}
`;

const JobCard = styled.div`
  background: rgba(var(--cardBackground), 0.9);
  border-radius: 1.6rem;
  padding: 3rem;
  box-shadow: var(--shadow-md);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border: 1px solid rgba(var(--text), 0.1);

  &:hover {
    transform: translateY(-5px);
    box-shadow: var(--shadow-lg);
  }
`;

const JobCardHeader = styled.div`
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid rgba(var(--text), 0.1);
`;

const JobTitle = styled.h3`
  font-size: 2.4rem;
  font-weight: 700;
  margin-bottom: 0.8rem;
  color: rgb(255, 125, 0);
`;

const JobMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 0.8rem;
`;

const JobLocation = styled.span`
  font-size: 1.4rem;
  font-weight: 500;
  padding: 0.5rem 1rem;
  background: rgba(255, 125, 0, 0.1);
  border-radius: 2rem;
  color: rgb(255, 125, 0);
`;

const JobDepartment = styled.span`
  font-size: 1.4rem;
  font-weight: 500;
  padding: 0.5rem 1rem;
  background: rgba(34, 197, 94, 0.1);
  border-radius: 2rem;
  color: rgb(34, 197, 94);
`;

const JobLevel = styled.span`
  font-size: 1.4rem;
  font-weight: 500;
  padding: 0.5rem 1rem;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 2rem;
  color: rgb(59, 130, 246);
`;

const SalaryRange = styled.div`
  font-size: 1.6rem;
  color: rgb(34, 197, 94);
  font-weight: 600;
  margin-top: 0.5rem;
`;

const SecurityClearance = styled.div`
  font-size: 1.4rem;
  color: rgb(220, 38, 38);
  font-weight: 600;
  background: rgba(220, 38, 38, 0.1);
  padding: 0.5rem 1rem;
  border-radius: 0.8rem;
  margin-top: 0.5rem;
  display: inline-block;
`;

const ApplicationCount = styled.span`
  font-size: 1.2rem;
  color: rgb(var(--text), 0.6);
  font-style: italic;
  display: block;
  margin-top: 0.5rem;
`;

const JobDescription = styled.p`
  font-size: 1.6rem;
  line-height: 1.6;
  margin-bottom: 2rem;
  color: rgb(var(--text), 0.8);
`;

const RequirementsSection = styled.div`
  margin-bottom: 2rem;
`;

const RequirementsTitle = styled.h4`
  font-size: 1.8rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: rgb(var(--text));
`;

const RequirementsList = styled.ul`
  list-style: none;
  padding: 0;
`;

const RequirementItem = styled.li`
  font-size: 1.5rem;
  margin-bottom: 0.8rem;
  padding-left: 2rem;
  position: relative;
  color: rgb(var(--text), 0.8);

  &:before {
    content: '•';
    color: rgb(255, 125, 0);
    font-weight: bold;
    position: absolute;
    left: 0;
  }
`;

const BenefitsSection = styled.div`
  margin-bottom: 2rem;
  background: rgba(34, 197, 94, 0.05);
  padding: 1.5rem;
  border-radius: 1rem;
  border: 1px solid rgba(34, 197, 94, 0.2);
`;

const BenefitsTitle = styled.h4`
  font-size: 1.6rem;
  font-weight: 600;
  margin-bottom: 0.8rem;
  color: rgb(34, 197, 94);
`;

const BenefitsText = styled.p`
  font-size: 1.4rem;
  color: rgb(var(--text), 0.8);
  line-height: 1.5;
  margin: 0;
`;

const ApplyButton = styled.button`
  margin-top: 2rem;
  padding: 1.2rem 2rem;
  font-size: 1.6rem;
  font-weight: 600;
  border: 2px solid rgb(255, 125, 0);
  background: transparent;
  color: rgb(255, 125, 0);
  border-radius: 0.8rem;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;

  &:hover {
    background: rgb(255, 125, 0);
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(255, 125, 0, 0.3);
  }
`;

const SuccessMessage = styled.div`
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(16, 185, 129, 0.05));
  border: 2px solid rgba(34, 197, 94, 0.3);
  border-radius: 1.5rem;
  padding: 3rem;
  margin-bottom: 3rem;
  box-shadow: 0 8px 25px rgba(34, 197, 94, 0.15);
  ${mq('<=tablet', 'padding: 2rem; margin: 1rem 0 3rem 0;')}
`;

const SuccessHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2.5rem;
  padding-bottom: 2rem;
  border-bottom: 2px solid rgba(34, 197, 94, 0.2);
  ${mq('<=tablet', 'flex-direction: column; text-align: center; gap: 1rem;')}
`;

const SuccessIcon = styled.div`
  font-size: 3rem;
  background: rgba(34, 197, 94, 0.1);
  padding: 1.5rem;
  border-radius: 50%;
  border: 2px solid rgba(34, 197, 94, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 6rem;
  min-height: 6rem;
`;

const SuccessTitle = styled.h3`
  font-size: 2.8rem;
  font-weight: 700;
  color: rgb(34, 197, 94);
  margin: 0;
  ${mq('<=tablet', 'font-size: 2.4rem;')}
`;

const SuccessContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
`;

const WelcomeMessage = styled.p`
  font-size: 1.8rem;
  line-height: 1.6;
  color: rgb(var(--text));
  margin: 0;
  font-weight: 500;
  text-align: center;
  
  ${mq('<=tablet', 'font-size: 1.6rem;')}
`;

const SubmitAnotherBtn = styled.button`
  background: linear-gradient(135deg, rgb(255, 125, 0), rgb(255, 165, 0));
  color: white;
  border: none;
  padding: 1.4rem 2.8rem;
  border-radius: 1rem;
  font-size: 1.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  align-self: center;
  margin-top: 1rem;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(255, 125, 0, 0.3);
  }
  
  ${mq('<=tablet', 'width: 100%;')}
`;

const ApplicationModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
  overflow: auto;
`;

const ModalContent = styled.div`
  background: rgba(var(--cardBackground), 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(var(--text), 0.1);
  border-radius: 2rem;
  padding: 4rem;
  max-width: 80rem;
  width: 100%;
  max-height: 90vh;
  overflow: auto;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
  ${mq('<=tablet', 'padding: 3rem 2rem;')}
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 3rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid rgba(var(--text), 0.1);
`;

const ModalTitle = styled.h2`
  font-size: 2.8rem;
  font-weight: 700;
  color: rgb(var(--text));
  margin: 0 0 0.5rem 0;
`;

const ModalSubtitle = styled.p`
  font-size: 1.6rem;
  color: rgb(var(--text), 0.7);
  margin: 0;
`;

const CloseButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: rgb(var(--text));
  font-size: 2rem;
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const ErrorMessage = styled.div`
  background: linear-gradient(135deg, rgba(220, 38, 38, 0.1), rgba(239, 68, 68, 0.05));
  border: 2px solid rgba(220, 38, 38, 0.3);
  border-radius: 1.5rem;
  padding: 2rem;
  margin-bottom: 2rem;
  text-align: center;
`;

const ErrorHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const ErrorIcon = styled.div`
  font-size: 2rem;
`;

const ErrorTitle = styled.h3`
  font-size: 1.8rem;
  font-weight: 700;
  color: rgb(220, 38, 38);
  margin: 0;
`;

const ErrorContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ErrorText = styled.p`
  font-size: 1.4rem;
  color: rgb(220, 38, 38);
  margin: 0;
`;

const RetryButton = styled.button`
  background: linear-gradient(135deg, rgb(255, 125, 0), rgb(255, 165, 0));
  color: white;
  border: none;
  padding: 0.8rem 1.6rem;
  border-radius: 0.8rem;
  font-size: 1.4rem;
  cursor: pointer;
  align-self: center;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 2rem;

  input[type='text'],
  input[type='email'],
  input[type='tel'],
  input[type='url'],
  select,
  textarea {
    padding: 1.5rem;
    font-size: 1.6rem;
    border: 2px solid rgba(var(--text), 0.2);
    border-radius: 1rem;
    background: rgba(var(--background), 0.9);
    color: rgb(var(--text));
    transition: border-color 0.3s ease;

    &::placeholder {
      color: rgb(var(--text), 0.5);
    }

    &:focus {
      outline: none;
      border-color: rgb(255, 125, 0);
    }

    &:invalid {
      border-color: #ff6b6b;
    }
  }

  label {
    font-size: 1.4rem;
    font-weight: 600;
    color: rgb(var(--text), 0.8);
    margin-bottom: 0.5rem;
    display: block;
  }
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  ${mq('<=tablet', 'grid-template-columns: 1fr;')}
`;

const FormField = styled.div`
  display: flex;
  flex-direction: column;
`;

const FileUploadGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  ${mq('<=tablet', 'grid-template-columns: 1fr;')}
`;

const FileUploadWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const FileInput = styled.input`
  padding: 1rem !important;
  border: 2px dashed rgba(var(--text), 0.3) !important;
  background: rgba(var(--background), 0.5) !important;

  &::-webkit-file-upload-button {
    background: rgb(255, 125, 0);
    color: white;
    border: none;
    padding: 0.8rem 1.5rem;
    border-radius: 0.5rem;
    cursor: pointer;
    margin-right: 1rem;
  }
`;

const FileNote = styled.small`
  font-size: 1.2rem;
  color: rgb(var(--text), 0.6);
  margin-top: 0.5rem;
`;

const FieldError = styled.span`
  font-size: 1.2rem;
  color: #ff6b6b;
  margin-top: 0.5rem;
`;

const PhoneNote = styled.small`
  font-size: 1.2rem;
  color: rgb(var(--text), 0.6);
  margin-top: 0.5rem;
  font-style: italic;
`;

const MessageNote = styled.small`
  font-size: 1.2rem;
  color: rgb(var(--text), 0.6);
  margin-top: 0.5rem;
  font-style: italic;
`;

const VeteranCheckbox = styled.div`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-top: 1rem;
  
  input[type="checkbox"] {
    width: 1.8rem;
    height: 1.8rem;
    accent-color: rgb(255, 125, 0);
  }
  
  label {
    font-size: 1.4rem;
    font-weight: 500;
    color: rgb(var(--text));
    cursor: pointer;
    margin: 0;
  }
`;

const VeteranNote = styled.small`
  font-size: 1.2rem;
  color: rgb(var(--text), 0.6);
  margin-top: 0.5rem;
  font-style: italic;
`;

const SubmitButtonGroup = styled.div`
  display: flex;
  gap: 2rem;
  justify-content: flex-end;
  padding-top: 2rem;
  border-top: 1px solid rgba(var(--text), 0.1);
  ${mq('<=tablet', 'flex-direction: column;')}
`;

const CancelButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  color: rgb(var(--text));
  padding: 1.2rem 2.4rem;
  border: 1px solid rgba(var(--text), 0.2);
  border-radius: 0.8rem;
  font-size: 1.6rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const SubmitBtn = styled.button`
  padding: 1.2rem 2.4rem;
  font-size: 1.6rem;
  font-weight: 600;
  border: none;
  background: linear-gradient(135deg, rgb(255, 125, 0), rgb(255, 165, 0));
  color: white;
  border-radius: 0.8rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(255, 125, 0, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const ContactInfo = styled.div`
  text-align: center;
  padding-top: 2rem;
  border-top: 1px solid rgba(var(--text), 0.1);
  
  p {
    font-size: 1.4rem;
    color: rgb(var(--text), 0.7);
    margin: 0;
  }
  
  a {
    color: rgb(255, 125, 0);
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

const CompanyCommitment = styled.div`
  background: linear-gradient(135deg, rgba(255, 125, 0, 0.05), rgba(255, 165, 0, 0.02));
  border: 1px solid rgba(255, 125, 0, 0.2);
  border-radius: 1.2rem;
  padding: 4rem 2rem;
  margin-top: 8rem;
  text-align: center;
`;

const CommitmentTitle = styled.h4`
  font-size: 2.4rem;
  font-weight: 700;
  color: rgb(var(--text));
  margin-bottom: 1.5rem;
`;

const CommitmentText = styled.p`
  font-size: 1.6rem;
  line-height: 1.6;
  color: rgb(var(--text), 0.8);
  margin: 0;
  max-width: 80rem;
  margin: 0 auto;
  
  a {
    color: rgb(255, 125, 0);
    text-decoration: none;
    font-weight: 600;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;