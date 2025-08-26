// utils/jobCategorization.ts
export interface JobStatus {
  value: string;
  label: string;
  color: string;
  description: string;
}

// Standardized job statuses
export const JOB_STATUSES: { [key: string]: JobStatus } = {
  // Active statuses
  'active': {
    value: 'active',
    label: 'Live on Site',
    color: 'green',
    description: 'Job is live and accepting applications'
  },
  'live': {
    value: 'active',
    label: 'Live on Site', 
    color: 'green',
    description: 'Job is live and accepting applications'
  },
  
  // Draft statuses
  'draft': {
    value: 'draft',
    label: 'Draft',
    color: 'gray',
    description: 'Job is being prepared but not published'
  },
  'unpublished': {
    value: 'draft',
    label: 'Draft',
    color: 'gray', 
    description: 'Job is being prepared but not published'
  },
  
  // Inactive statuses
  'inactive': {
    value: 'inactive',
    label: 'Deactivated',
    color: 'yellow',
    description: 'Job temporarily removed from site but can be reactivated'
  },
  'deactivated': {
    value: 'inactive',
    label: 'Deactivated',
    color: 'yellow',
    description: 'Job temporarily removed from site but can be reactivated'
  },
  'paused': {
    value: 'inactive',
    label: 'Deactivated',
    color: 'yellow',
    description: 'Job temporarily removed from site but can be reactivated'
  },
  
  // Expired statuses
  'expired': {
    value: 'expired',
    label: 'Expired',
    color: 'orange',
    description: 'Job posting period has ended'
  },
  'closed': {
    value: 'expired',
    label: 'Expired',
    color: 'orange',
    description: 'Job posting period has ended'
  },
  
  // Archived statuses
  'archived': {
    value: 'archived',
    label: 'Archived',
    color: 'red',
    description: 'Job is archived and no longer visible'
  },
  'deleted': {
    value: 'archived',
    label: 'Archived',
    color: 'red',
    description: 'Job is archived and no longer visible'
  }
};

// Function to normalize job status
export function normalizeJobStatus(status: string, posted: boolean = true): string {
  if (!status) {
    return posted ? 'active' : 'draft';
  }
  
  const normalizedStatus = status.toLowerCase().trim();
  const statusMapping = JOB_STATUSES[normalizedStatus];
  
  if (statusMapping) {
    return statusMapping.value;
  }
  
  // Fallback logic
  if (!posted) return 'draft';
  return 'active';
}

// Function to get job status display info
export function getJobStatusInfo(status: string, posted: boolean = true): JobStatus {
  const normalizedStatus = normalizeJobStatus(status, posted);
  return JOB_STATUSES[normalizedStatus] || JOB_STATUSES['active'];
}

// Function to categorize jobs for ATS dashboard
export function categorizeJobsForATS(jobs: any[]) {
  const categories = {
    all: jobs.length,
    active: 0,
    inactive: 0,
    expired: 0,
    draft: 0,
    archived: 0,
    deactivated: 0
  };

  jobs.forEach(job => {
    const normalizedStatus = normalizeJobStatus(job.status, job.posted);
    
    switch (normalizedStatus) {
      case 'active':
        categories.active++;
        break;
      case 'inactive':
        categories.inactive++;
        categories.deactivated++; // For backward compatibility
        break;
      case 'expired':
        categories.expired++;
        break;
      case 'draft':
        categories.draft++;
        break;
      case 'archived':
        categories.archived++;
        break;
    }
  });

  return categories;
}

// Function to check if job should be auto-expired (90 days old and still active)
export function shouldAutoExpire(job: any): boolean {
  if (normalizeJobStatus(job.status, job.posted) !== 'active') {
    return false;
  }
  
  const createdDate = new Date(job.created_at);
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  
  return createdDate < ninetyDaysAgo;
}

// Function to identify trial/test jobs for deletion
export function isTrialJob(job: any): boolean {
  const title = (job.title || '').toLowerCase();
  const description = (job.description || '').toLowerCase();
  
  const trialKeywords = ['trial', 'test', 'demo', 'sample', 'example', 'temp'];
  
  return trialKeywords.some(keyword => 
    title.includes(keyword) || description.includes(keyword)
  );
}

// SQL query to update job statuses in bulk
export const updateJobStatusesQuery = `
  -- Update jobs that should be expired (90+ days old and still active)
  UPDATE jobs 
  SET status = 'expired', updated_at = CURRENT_TIMESTAMP
  WHERE status = 'active' 
    AND created_at < NOW() - INTERVAL '90 days';

  -- Normalize inconsistent statuses
  UPDATE jobs 
  SET status = 'active', updated_at = CURRENT_TIMESTAMP
  WHERE status IN ('live', 'published') AND posted = true;

  UPDATE jobs 
  SET status = 'draft', updated_at = CURRENT_TIMESTAMP  
  WHERE (status IS NULL OR status = 'unpublished') AND posted = false;

  UPDATE jobs 
  SET status = 'inactive', updated_at = CURRENT_TIMESTAMP
  WHERE status IN ('deactivated', 'paused') AND posted = false;

  UPDATE jobs 
  SET status = 'expired', updated_at = CURRENT_TIMESTAMP
  WHERE status IN ('closed', 'ended');

  UPDATE jobs 
  SET status = 'archived', updated_at = CURRENT_TIMESTAMP
  WHERE status = 'deleted';
`;

// API endpoint helper for job categorization
export function filterJobsByCategory(jobs: any[], category: string) {
  return jobs.filter(job => {
    const normalizedStatus = normalizeJobStatus(job.status, job.posted);
    
    switch (category.toLowerCase()) {
      case 'all':
        return true;
      case 'active':
        return normalizedStatus === 'active';
      case 'inactive':
      case 'deactivated':
        return normalizedStatus === 'inactive';
      case 'expired':
        return normalizedStatus === 'expired';
      case 'draft':
        return normalizedStatus === 'draft';
      case 'archived':
        return normalizedStatus === 'archived';
      case 'trial':
        return isTrialJob(job);
      default:
        return false;
    }
  });
}