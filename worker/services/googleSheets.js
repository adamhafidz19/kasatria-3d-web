import { SignJWT, importPKCS8 } from 'jose';
import { parseSheetCsv } from '../../src/lib/sheet.js';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

const GOOGLE_SHEETS_SCOPE =
    'https://www.googleapis.com/auth/spreadsheets.readonly';

function getServiceAccount(env) {
    if (!env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64) {
        throw new Error('Google service account credentials are not configured.');
    }

    const decoded = atob(env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64);
    const credentials = JSON.parse(decoded);

    if (!credentials.client_email || !credentials.private_key) {
        throw new Error('Invalid Google service account credentials.');
    }

    return credentials;
}

async function getGoogleAccessToken(env) {
    const credentials = getServiceAccount(env);

    const privateKey = await importPKCS8(
        credentials.private_key,
        'RS256'
    );

    const assertion = await new SignJWT({
        scope: GOOGLE_SHEETS_SCOPE,
    })
        .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
        .setIssuer(credentials.client_email)
        .setAudience(GOOGLE_TOKEN_URL)
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(privateKey);

    const response = await fetch(GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion,
        }),
    });

    const data = await response.json();

    if (!response.ok) {
        console.error('Google token request failed:', data);
        throw new Error('Unable to authenticate with Google.');
    }

    return data.access_token;
}

function escapeCsvField(value) {
    const text = String(value ?? '');

    if (/[",\r\n]/.test(text)) {
        return `"${text.replace(/"/g, '""')}"`;
    }

    return text;
}

export async function getPeopleFromSheet(env) {
    if (!env.GOOGLE_SHEET_ID || !env.GOOGLE_SHEET_NAME) {
        throw new Error('Google Sheet configuration is missing.');
    }

    const accessToken = await getGoogleAccessToken(env);

    const sheetName = env.GOOGLE_SHEET_NAME.replace(/'/g, "''");
    const range = `'${sheetName}'!A:F`;

    const url = new URL(
        `https://sheets.googleapis.com/v4/spreadsheets/${env.GOOGLE_SHEET_ID}/values/${encodeURIComponent(range)}`
    );

    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    const data = await response.json();

    if (!response.ok) {
        console.error('Google Sheets API request failed:', data);
        throw new Error('Unable to retrieve Google Sheets data.');
    }

    const rows = data.values ?? [];

    if (rows.length < 2) {
        return [];
    }

    const csvText = rows
        .map((row) => row.map(escapeCsvField).join(','))
        .join('\n');

    return parseSheetCsv(csvText);
}