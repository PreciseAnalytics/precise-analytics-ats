"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';

interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  status: string;
  created_at: string;
  application_count: number;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/jobs?includeStats=true');
      
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }
      
      const data = await response.json();
      
      if (data.success && data.jobs) {
        setJobs(data.jobs);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PageWrapper>
        <Container>
          <LoadingSpinner />
          <p>Loading jobs...</p>
        </Container>
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper>
        <Container>
          <ErrorMessage>
            <h2>Failed to load jobs</h2>
            <p>{error}</p>
            <button onClick={fetchJobs}>Try Again</button>
          </ErrorMessage>
        </Container>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <Container>
        <Header>
          <Title>Job Management</Title>
          <CreateButton onClick={() => window.location.href = '/jobs/create'}>
            + Create New Job
          </CreateButton>
        </Header>

        {jobs.length === 0 ? (
          <EmptyState>
            <h3>No job postings found</h3>
            <p>Create your first job posting to get started.</p>
          </EmptyState>
        ) : (
          <JobsGrid>
            {jobs.map((job) => (
              <JobCard key={job.id}>
                <JobHeader>
                  <JobTitle>{job.title}</JobTitle>
                  <JobStatus status={job.status}>{job.status}</JobStatus>
                </JobHeader>
                
                <JobDetails>
                  <JobDetail>🏢 {job.department}</JobDetail>
                  <JobDetail>📍 {job.location}</JobDetail>
                  <JobDetail>📊 {job.application_count} applications</JobDetail>
                </JobDetails>
                
                <JobActions>
                  <ActionButton onClick={() => window.location.href = `/jobs/${job.id}`}>
                    View Details
                  </ActionButton>
                  <ActionButton onClick={() => window.location.href = `/jobs/${job.id}/edit`}>
                    Edit
                  </ActionButton>
                </JobActions>
              </JobCard>
            ))}
          </JobsGrid>
        )}
      </Container>
    </PageWrapper>
  );
}

// Styled Components
const PageWrapper = styled.div`
  min-height: 100vh;
  background: #f8f9fa;
  padding: 2rem 0;
`;

const Container = styled.div`
  max-width: 120rem;
  margin: 0 auto;
  padding: 0 2rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 3rem;
  padding-bottom: 2rem;
  border-bottom: 2px solid #e9ecef;
`;

const Title = styled.h1`
  font-size: 3.2rem;
  font-weight: 700;
  color: rgb(255, 125, 0);
  margin: 0;
`;

const CreateButton = styled.button`
  background: rgb(255, 125, 0);
  color: white;
  border: none;
  padding: 1.2rem 2.4rem;
  border-radius: 0.8rem;
  font-size: 1.6rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgb(230, 100, 0);
    transform: translateY(-2px);
  }
`;

const LoadingSpinner = styled.div`
  width: 4rem;
  height: 4rem;
  border: 3px solid rgba(255, 125, 0, 0.1);
  border-top: 3px solid rgb(255, 125, 0);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 2rem auto;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 4rem;
  background: #fff;
  border-radius: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);

  h2 {
    color: #dc3545;
    margin-bottom: 1rem;
  }

  button {
    background: rgb(255, 125, 0);
    color: white;
    border: none;
    padding: 1rem 2rem;
    border-radius: 0.5rem;
    cursor: pointer;
    margin-top: 1rem;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 6rem 2rem;
  background: #fff;
  border-radius: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);

  h3 {
    color: #6c757d;
    margin-bottom: 1rem;
  }
`;

const JobsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(35rem, 1fr));
  gap: 2rem;
`;

const JobCard = styled(motion.div).attrs({
  whileHover: { y: -4 },
  transition: { duration: 0.2 }
})`
  background: #fff;
  border-radius: 1rem;
  padding: 2.4rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border: 1px solid #e9ecef;
`;

const JobHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
`;

const JobTitle = styled.h3`
  font-size: 2rem;
  font-weight: 600;
  color: #212529;
  margin: 0;
  flex: 1;
`;

const JobStatus = styled.span<{ status: string }>`
  padding: 0.4rem 1rem;
  border-radius: 2rem;
  font-size: 1.2rem;
  font-weight: 600;
  text-transform: capitalize;
  background: ${props => props.status === 'published' ? '#d4edda' : '#f8d7da'};
  color: ${props => props.status === 'published' ? '#155724' : '#721c24'};
`;

const JobDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  margin-bottom: 2rem;
`;

const JobDetail = styled.span`
  font-size: 1.4rem;
  color: #6c757d;
`;

const JobActions = styled.div`
  display: flex;
  gap: 1rem;
`;

const ActionButton = styled.button`
  flex: 1;
  padding: 1rem 1.5rem;
  border: 2px solid rgb(255, 125, 0);
  background: transparent;
  color: rgb(255, 125, 0);
  border-radius: 0.6rem;
  font-size: 1.4rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 125, 0, 0.1);
  }

  &:first-child {
    background: rgb(255, 125, 0);
    color: white;

    &:hover {
      background: rgb(230, 100, 0);
    }
  }
`;
