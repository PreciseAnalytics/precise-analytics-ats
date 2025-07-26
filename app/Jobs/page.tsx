'use client';

import { useState, useEffect } from 'react';
import styled from 'styled-components';

interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  description: string;
  requirements: string;
  salary_range: string;
  status: 'active' | 'inactive' | 'expired';
  created_at: string;
  applications_count?: number;
}

export default function JobManagementPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    department: '',
    location: '',
    type: 'Full-time',
    description: '',
    requirements: '',
    salary_range: '',
    status: 'active' as 'active' | 'inactive' | 'expired'
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/jobs');
      const jobsData = await response.json();
      
      if (Array.isArray(jobsData)) {
        setJobs(jobsData);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingJob ? `/api/jobs/${editingJob.id}` : '/api/jobs';
      const method = editingJob ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchJobs();
        resetForm();
        alert(editingJob ? 'Job updated successfully!' : 'Job created successfully!');
      } else {
        alert('Error saving job');
      }
    } catch (error) {
      console.error('Error saving job:', error);
      alert('Error saving job');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '', department: '', location: '', type: 'Full-time',
      description: '', requirements: '', salary_range: '', status: 'active'
    });
    setShowAddForm(false);
    setEditingJob(null);
  };

  const handleEdit = (job: Job) => {
    setFormData({
      title: job.title,
      department: job.department,
      location: job.location,
      type: job.type,
      description: job.description,
      requirements: job.requirements,
      salary_range: job.salary_range,
      status: job.status
    });
    setEditingJob(job);
    setShowAddForm(true);
  };

  const toggleJobStatus = async (job: Job) => {
    const newStatus = job.status === 'active' ? 'inactive' : 'active';
    
    try {
      const response = await fetch(`/api/jobs/${job.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...job, status: newStatus }),
      });

      if (response.ok) {
        await fetchJobs();
      }
    } catch (error) {
      console.error('Error updating job status:', error);
    }
  };

  if (loading) {
    return <LoadingContainer>Loading jobs...</LoadingContainer>;
  }

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>Job Management</PageTitle>
        <AddJobButton onClick={() => setShowAddForm(true)}>
          + Add New Job
        </AddJobButton>
      </PageHeader>

      {showAddForm && (
        <FormModal>
          <FormContainer>
            <FormHeader>
              <FormTitle>{editingJob ? 'Edit Job' : 'Add New Job'}</FormTitle>
              <CloseButton onClick={resetForm}>×</CloseButton>
            </FormHeader>
            
            <JobForm onSubmit={handleSubmit}>
              <FormRow>
                <FormField>
                  <label>Job Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                  />
                </FormField>
                
                <FormField>
                  <label>Department *</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    required
                  />
                </FormField>
              </FormRow>

              <FormRow>
                <FormField>
                  <label>Location *</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    required
                  />
                </FormField>
                
                <FormField>
                  <label>Employment Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                  </select>
                </FormField>
              </FormRow>

              <FormField>
                <label>Salary Range</label>
                <input
                  type="text"
                  value={formData.salary_range}
                  onChange={(e) => setFormData({...formData, salary_range: e.target.value})}
                  placeholder="e.g., $60,000 - $80,000"
                />
              </FormField>

              <FormField>
                <label>Job Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={4}
                  required
                />
              </FormField>

              <FormField>
                <label>Requirements *</label>
                <textarea
                  value={formData.requirements}
                  onChange={(e) => setFormData({...formData, requirements: e.target.value})}
                  rows={4}
                  placeholder="Enter each requirement on a new line"
                  required
                />
              </FormField>

              <FormField>
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="expired">Expired</option>
                </select>
              </FormField>

              <FormActions>
                <CancelButton type="button" onClick={resetForm}>
                  Cancel
                </CancelButton>
                <SubmitButton type="submit">
                  {editingJob ? 'Update Job' : 'Create Job'}
                </SubmitButton>
              </FormActions>
            </JobForm>
          </FormContainer>
        </FormModal>
      )}

      <JobsList>
        <JobsTable>
          <thead>
            <tr>
              <th>Job Title</th>
              <th>Department</th>
              <th>Location</th>
              <th>Type</th>
              <th>Applications</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id}>
                <td>{job.title}</td>
                <td>{job.department}</td>
                <td>{job.location}</td>
                <td>{job.type}</td>
                <td>{job.applications_count || 0}</td>
                <td>
                  <StatusBadge status={job.status}>
                    {job.status}
                  </StatusBadge>
                </td>
                <td>{new Date(job.created_at).toLocaleDateString()}</td>
                <td>
                  <ActionButtons>
                    <EditButton onClick={() => handleEdit(job)}>
                      Edit
                    </EditButton>
                    <StatusButton onClick={() => toggleJobStatus(job)}>
                      {job.status === 'active' ? 'Deactivate' : 'Activate'}
                    </StatusButton>
                  </ActionButtons>
                </td>
              </tr>
            ))}
          </tbody>
        </JobsTable>
      </JobsList>
    </PageContainer>
  );
}

// Styled Components
const PageContainer = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const PageTitle = styled.h1`
  font-size: 2.5rem;
  color: #333;
`;

const AddJobButton = styled.button`
  background: linear-gradient(135deg, #ff7d00, #ffa500);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-2px);
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 50vh;
  font-size: 1.5rem;
`;

const FormModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const FormContainer = styled.div`
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow: auto;
`;

const FormHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const FormTitle = styled.h2`
  margin: 0;
  color: #333;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: #666;
`;

const JobForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
`;

const FormField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  label {
    font-weight: 600;
    color: #333;
  }

  input, select, textarea {
    padding: 0.8rem;
    border: 2px solid #ddd;
    border-radius: 0.5rem;
    font-size: 1rem;

    &:focus {
      outline: none;
      border-color: #ff7d00;
    }
  }
`;

const FormActions = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
`;

const CancelButton = styled.button`
  padding: 1rem 2rem;
  border: 2px solid #ddd;
  background: white;
  border-radius: 0.5rem;
  cursor: pointer;
`;

const SubmitButton = styled.button`
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #ff7d00, #ffa500);
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
`;

const JobsList = styled.div`
  margin-top: 2rem;
`;

const JobsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

  th {
    background: #f8f9fa;
    padding: 1rem;
    text-align: left;
    font-weight: 600;
    color: #333;
  }

  td {
    padding: 1rem;
    border-bottom: 1px solid #eee;
  }
`;

const StatusBadge = styled.span<{ status: string }>`
  padding: 0.4rem 0.8rem;
  border-radius: 2rem;
  font-size: 0.8rem;
  font-weight: 600;
  
  ${({ status }) => {
    switch (status) {
      case 'active':
        return 'background: #d4edda; color: #155724;';
      case 'inactive':
        return 'background: #f8d7da; color: #721c24;';
      case 'expired':
        return 'background: #fff3cd; color: #856404;';
      default:
        return 'background: #e2e3e5; color: #383d41;';
    }
  }}
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const EditButton = styled.button`
  padding: 0.4rem 0.8rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 0.3rem;
  cursor: pointer;
  font-size: 0.8rem;
`;

const StatusButton = styled.button`
  padding: 0.4rem 0.8rem;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 0.3rem;
  cursor: pointer;
  font-size: 0.8rem;
`;