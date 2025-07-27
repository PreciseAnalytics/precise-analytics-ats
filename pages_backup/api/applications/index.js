import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  // Simplified CORS - allow all for debugging
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      console.log('🔍 Fetching applications from database...');
      
      const applications = await sql`
        SELECT 
          id,
          full_name,
          email,
          position,
          status,
          created_at,
          phone,
          resume_url,
          cover_letter_url
        FROM applications 
        ORDER BY created_at DESC
      `;

      console.log(`✅ Found ${applications.length} applications`);

      return res.status(200).json({
        success: true,
        applications: applications
      });
    } catch (error) {
      console.error('❌ Database error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch applications'
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}