// pages/api/jobs/[id].js
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  const { method } = req;
  const { id } = req.query;

  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!id) {
    return res.status(400).json({ 
      success: false,
      error: 'Job ID is required' 
    });
  }

  try {
    if (method === 'GET') {
      // Get job details
      const job = await sql`SELECT * FROM jobs WHERE id = ${id}`;
      
      if (job.length === 0) {
        return res.status(404).json({ 
          success: false,
          error: 'Job not found' 
        });
      }

      return res.status(200).json({
        success: true,
        job: job[0]
      });
    }
    
    return res.status(405).json({ 
      success: false,
      error: `Method ${method} not allowed` 
    });
  } catch (error) {
    console.error('Job API Error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Internal Server Error',
      message: error.message 
    });
  }
}