import helmet from 'helmet';

/**
 * Helmet Security Configuration
 * Configures various HTTP headers for security
 */
export const helmetConfig = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Required for some inline scripts
        "https://accounts.google.com",
        "https://www.google.com",
        "https://www.gstatic.com",
      ],
      imgSrc: [
        "'self'",
        "data:",
        "https:",
        "https://lh3.googleusercontent.com", // Google profile images
      ],
      connectSrc: [
        "'self'",
        "https://accounts.google.com",
        "https://www.googleapis.com",
        "https://oauth2.googleapis.com",
        process.env.FRONTEND_URL || "http://localhost:5173",
      ],
      frameSrc: [
        "'self'",
        "https://accounts.google.com",
        "https://www.google.com",
      ],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },

  // HTTP Strict Transport Security (HSTS)
  // Only enable in production with HTTPS
  hsts: process.env.NODE_ENV === 'production' ? {
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true,
    preload: true,
  } : false,

  // X-Frame-Options: Prevent clickjacking
  frameguard: {
    action: 'deny',
  },

  // X-Content-Type-Options: Prevent MIME type sniffing
  noSniff: true,

  // X-XSS-Protection: Enable XSS filter (legacy but still useful)
  xssFilter: true,

  // Referrer-Policy: Control referrer information
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },

  // X-Permitted-Cross-Domain-Policies: Restrict Adobe Flash/PDF cross-domain policies
  permittedCrossDomainPolicies: {
    permittedPolicies: 'none',
  },

  // X-Download-Options: Prevent IE from executing downloads in site's context
  ieNoOpen: true,

  // X-DNS-Prefetch-Control: Control DNS prefetching
  dnsPrefetchControl: {
    allow: false,
  },

  // Hide X-Powered-By header
  hidePoweredBy: true,
});

export default helmetConfig;
