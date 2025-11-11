// utils/googleSheetsHelpers.js
import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

export class HttpError extends Error {
  constructor(status, message, meta = {}) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.meta = meta;
  }
}

export const initializeGoogleAuth = () => {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let rawKey = process.env.GOOGLE_PRIVATE_KEY || '';

  if (!email || !rawKey) {
    throw new HttpError(500, 'Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_PRIVATE_KEY');
  }

  rawKey = rawKey.trim();
  if (
    (rawKey.startsWith('"') && rawKey.endsWith('"')) ||
    (rawKey.startsWith("'") && rawKey.endsWith("'")) ||
    (rawKey.startsWith('`') && rawKey.endsWith('`'))
  ) {
    rawKey = rawKey.slice(1, -1);
  }
  const privateKey = rawKey.replace(/\\n/g, '\n');

  // Optional: impersonate a user if domain-wide delegation is set up for the service account.
  // Set GOOGLE_SERVICE_ACCOUNT_SUBJECT (or GOOGLE_IMPERSONATE_USER_EMAIL) in env to the user email to impersonate.
  const subject = process.env.GOOGLE_SERVICE_ACCOUNT_SUBJECT || process.env.GOOGLE_IMPERSONATE_USER_EMAIL || null;

  const jwtOptions = {
    email,
    key: privateKey,
    scopes: [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/spreadsheets',
    ],
  };
  if (subject) jwtOptions.subject = subject;

  return new google.auth.JWT(jwtOptions);
};

export const initializeOAuthClient = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_CLIENT_REDIRECT_URI;
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) return null;

  const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  oAuth2Client.setCredentials({ refresh_token: refreshToken });
  return oAuth2Client;
};

export const getGoogleClients = async (forceServiceAccount = false) => {
  // Prefer OAuth2 user credential (refresh token) if available and not forced to service account — this will create files as that user
  if (!forceServiceAccount) {
    const oauthClient = initializeOAuthClient();
    if (oauthClient) {
      try {
        // Ensure the access token is current (this will refresh using the refresh token)
        const token = await oauthClient.getAccessToken();
        console.log('[googleSheetsHelpers] Using OAuth2 client for Google APIs (refresh token present).');
        try {
          // Try to fetch userinfo for debugging (may require openid/email scopes)
          const oauth2 = google.oauth2({ auth: oauthClient, version: 'v2' });
          const me = await oauth2.userinfo.get().catch(() => null);
          if (me?.data?.email) console.log('[googleSheetsHelpers] OAuth2 acting as user:', me.data.email);
        } catch (e) {
          // ignore userinfo errors
        }
        const sheets = google.sheets({ version: 'v4', auth: oauthClient });
        const drive = google.drive({ version: 'v3', auth: oauthClient });
        return { sheets, drive };
      } catch (err) {
        console.warn('[googleSheetsHelpers] OAuth2 client failed to obtain access token, falling back to service account:', err?.message);
        // fallthrough to service account
      }
    }
  }

  const auth = initializeGoogleAuth();
  try {
    await auth.authorize();
    console.log('[googleSheetsHelpers] Using service account:', process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
  } catch (err) {
    console.error('[googleSheetsHelpers] Google auth failed (service account):', {
      message: err?.message,
      code: err?.code,
      stack: err?.stack,
    });
    throw new HttpError(500, 'Google auth failed', { cause: err?.message });
  }
  const sheets = google.sheets({ version: 'v4', auth });
  const drive = google.drive({ version: 'v3', auth });
  return { sheets, drive };
};

export const createHeaderStyle = () => ({
  backgroundColor: { red: 1, green: 0.95, blue: 0.8 },
  horizontalAlignment: 'CENTER',
  verticalAlignment: 'MIDDLE',
  textFormat: { bold: true, fontSize: 10, fontFamily: 'Arial' },
  borders: {
    top: { style: 'SOLID' },
    bottom: { style: 'SOLID' },
    left: { style: 'SOLID' },
    right: { style: 'SOLID' },
  },
});

export const invalidSheetChars = /[\\/?*[\]:'"]/g;

export const sanitizeSheetTitle = (rawTitle) => {
  const fallback = 'Export';
  if (!rawTitle) return fallback;
  const cleaned = rawTitle.replace(invalidSheetChars, '-').trim();
  return cleaned.length ? cleaned : fallback;
};

export const toA1Notation = (sheetTitle, targetRange = 'A1') => {
  const escaped = sheetTitle.replace(/'/g, "''");
  if (!targetRange) return `'${escaped}'`;
  return `'${escaped}'!${targetRange}`;
};

export const normalizeSheetTitleLength = (title) => {
  const normalized = sanitizeSheetTitle(title);
  return normalized.length > 99 ? normalized.slice(0, 99) : normalized;
};

export const buildTitleCandidates = (baseTitle) => {
  const normalized = normalizeSheetTitleLength(baseTitle);
  const suffix = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 8);
  const truncatedBase = normalized.length > 90 ? normalized.slice(0, 90) : normalized;
  const secondCandidate = `${truncatedBase}_${suffix}`.slice(0, 99);
  return [normalized, secondCandidate];
};

export const isDuplicateSheetError = (err) => {
  const message = err?.response?.data?.error?.message || err?.message || '';
  const lower = message.toLowerCase();
  return lower.includes('already exist') || lower.includes('duplicate sheet name');
};
