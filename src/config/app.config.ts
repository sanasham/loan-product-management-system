export const appConfig = {
  port: Number.parseInt(process.env.PORT || '3000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiVersion: process.env.API_VERSION || 'v1',

  upload: {
    maxFileSize: Number.parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
    allowedTypes: (process.env.ALLOWED_FILE_TYPES || '.xlsx,.xls').split(','),
  },

  batch: {
    chunkSize: Number.parseInt(process.env.CHUNK_SIZE || '500'),
    pollingInterval: Number.parseInt(process.env.POLLING_INTERVAL || '2000'),
  },

  security: {
    jwtSecret: process.env.JWT_SECRET || 'change-this-secret',
    sessionSecret: process.env.SESSION_SECRET || 'change-this-session-secret',
  },

  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
  },
};
