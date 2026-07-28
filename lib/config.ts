// lib/config.ts
// InvenStock - Simple Configuration

const isDev = process.env.NODE_ENV === 'development';

export const config = {
  isDev,
  
  // Auth settings
  auth: {
    secure: !isDev,
    maxAge: isDev ? 86400 : 3600, // 24h in dev, 1h in prod
  },
  
  // Logging
  showDebug: isDev,
  
  // Database
  logQueries: isDev,
};