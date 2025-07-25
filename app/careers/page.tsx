'use client';

import { useState, useEffect } from 'react';
import Head from 'next/head';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import AnimatedHeader from '../../components/AnimatedHeader';
import Container from '../../components/Container';
import { EnvVars } from '../../lib/env';
import { mq } from '../../utils/media';

interface Position {
  id: number;
  title: string;
  department: string;
  location: string;
  employment_type: string;
  description: string;
  requirements: string[];
  salary_min?: number;
  salary_max?: number;
  benefits?: string;
  application_count?: number;
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
}

interface FormErrors {
  [key: string]: string;
}

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
    portfolioUrl: ''
  });

  useEffect(() => {
    setIsClient(true);
    fetchPositions();
  }, []);

  // Fetch positions from API
  const fetchPositions = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching positions from API...');
      
      const response = await fetch('/api/positions?status=active&include_count=true');
      const data = await response.json();
      
      console.log('📋 API Response:', data);
      
      if (data.success) {
        // Transform requirements from text to array if needed
        const processedPositions = data.positions.map((pos: any) => ({
          ...pos,
          requirements: typeof pos.requirements === 'string' 
            ? pos.requirements.split('\n').filter((req: string) => req.trim()) 
            : pos.requirements || []
        }));
        
        console.log('✅ Processed positions:', processedPositions.length);
        setPositions(processedPositions);
      } else {
        console.error('❌ Failed to fetch positions:', data.error);
        setPositions([]);
      }
    } catch (error) {
      console.error('❌ Error fetching positions:', error);
      setPositions([]);
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

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: uploadFormData,
    });

    if (!response.ok) {
      throw new Error(`File upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'File upload failed');
    }
    
    return result.url;
  };

  const handleChange = (e: any) => {
    const { name, value, files } = e.target;
    
    if (files) {
      setFormData({ ...formData, [name]: files[0] });
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
      console.log('🚀 Starting application submission...');
      
      // Upload files first
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
        position_id: parseInt(formData.positionId),
        position_applied: formData.position,
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        cover_letter: formData.coverLetter.trim(),
        resume_url: resumeUrl,
        linkedin_url: formData.linkedinUrl.trim() || null,
        portfolio_url: formData.portfolioUrl.trim() || null,
        source: 'careers_website'
      };

      console.log('📝 Submitting application data:', {
        name: `${applicationData.first_name} ${applicationData.last_name}`,
        email: applicationData.email,
        position: applicationData.position_applied,
        hasResume: !!resumeUrl
      });

      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(applicationData),
      });

      const result = await response.json();

      if (!response.ok || !result.application) {
        throw new Error(result.error || `Server error: ${response.status}`);
      }

      console.log('✅ Application submitted successfully:', {
        applicationId: result.application.id,
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
        portfolioUrl: ''
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
          'application_id': result.application.id
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
    setSelectedPosition(position);
    setFormData({ 
      ...formData, 
      positionId: position.id.toString(), 
      position: position.title 
    });
    setShowApplicationForm(true);
    setSubmitSuccess(false);
    setSubmitError(null);
  };

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return null;
    if (min && max) return `$${(min/1000).toFixed(0)}K - $${(max/1000).toFixed(0)}K`;
    if (min) return `$${(min/1000).toFixed(0)}K+`;
    if (max) return `Up to $${(max/1000).toFixed(0)}K`;
  };

  return (
    <>
      <Head>
        <title>{`${EnvVars.SITE_NAME} - Careers`}</title>
        <meta name="description" content="Join the Precise Analytics team and help drive data transformation in mission-driven sectors." />
      </Head>

      <AnimatedHeader />

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
                <PositionCount>{positions.length} open position{positions.length !== 1 ? 's' : ''}</PositionCount>
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
                      </JobMeta>
                      {formatSalary(position.salary_min, position.salary_max) && (
                        <SalaryRange>{formatSalary(position.salary_min, position.salary_max)}</SalaryRange>
                      )}
                      {position.application_count !== undefined && (
                        <ApplicationCount>{position.application_count} applications</ApplicationCount>
                      )}
                    </JobCardHeader>
                    
                    <JobDescription>{position.description}</JobDescription>
                    
                    <RequirementsSection>
                      <RequirementsTitle>Key Requirements:</RequirementsTitle>
                      <RequirementsList>
                        {position.requirements.map((req, i) => (
                          <RequirementItem key={i}>{req}</RequirementItem>
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
            <ApplicationModal>
              <ModalContent>
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

// Styled Components (keeping all your existing styles and adding new ones)
const PageWrapper = styled.div`
  padding: 4rem 0;
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
  margin-top: 8rem;
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

const SalaryRange = styled.div`
  font-size: 1.6rem;
  color: rgb(34, 197, 94);
  font-weight: 600;
  margin-top: 0.5rem;
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
  }
`;

// Success message styles
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

// Modal styles
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

// Error message styles
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

// Form styles
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