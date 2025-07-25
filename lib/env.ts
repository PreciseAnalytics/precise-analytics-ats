export const EnvVars = {
  SITE_NAME: process.env.NEXT_PUBLIC_SITE_NAME || 'Precise Analytics',
  DATABASE_URL: process.env.DATABASE_URL || '',
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || '',
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || '',
};

export default EnvVars;
