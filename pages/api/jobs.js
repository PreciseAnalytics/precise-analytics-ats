import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  // Enable CORS for your main website
  // Allow both production and development origins
  const allowedOrigins = [
    'https://preciseanalytics.io',
    'https://www.preciseanalytics.io', 
    'http://localhost:3000',
    'http://localhost:3001'
  ];

  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    switch (req.method) {
      case 'GET':
        // Fetch all active jobs for careers page
        const jobs = await sql`
          SELECT id, title, department, location, type, description, requirements, salary_range, created_at
          FROM jobs 
          WHERE status = 'active' 
          ORDER BY created_at DESC
        `;
        res.status(200).json(jobs);
        break;

      case 'POST':
        // Create new job (ATS only)
        const { title, department, location, type, description, requirements, salary_range } = req.body;
        
        const newJob = await sql`
          INSERT INTO jobs (title, department, location, type, description, requirements, salary_range)
          VALUES (${title}, ${department}, ${location}, ${type}, ${description}, ${requirements}, ${salary_range})
          RETURNING *
        `;
        
        res.status(201).json(newJob[0]);
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Jobs API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}