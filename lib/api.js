const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://precise-analytics-ats.vercel.app/api';

class ATSApiService {
  async fetchJobs() {
    const response = await fetch(`${API_BASE}/jobs`);
    if (!response.ok) throw new Error('Failed to fetch jobs');
    return response.json();
  }

  async submitApplication(applicationData) {
    const response = await fetch(`${API_BASE}/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(applicationData),
    });
    
    if (!response.ok) throw new Error('Failed to submit application');
    return response.json();
  }

  async getApplications() {
    const response = await fetch(`${API_BASE}/applications`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('ats_token')}`,
      },
    });
    
    if (!response.ok) throw new Error('Failed to fetch applications');
    return response.json();
  }

  async updateApplicationStatus(id, status) {
    const response = await fetch(`${API_BASE}/applications/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('ats_token')}`,
      },
      body: JSON.stringify({ status }),
    });
    
    if (!response.ok) throw new Error('Failed to update application');
    return response.json();
  }
}

export default new ATSApiService();
