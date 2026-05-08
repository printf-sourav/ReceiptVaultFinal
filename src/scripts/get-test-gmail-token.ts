/**
 * Script to get a valid Google refresh token for testing Gmail scanning.
 * This creates a local file oauth-test-token.json with the token after OAuth flow.
 * 
 * Usage: npx ts-node --transpile-only src/scripts/get-test-gmail-token.ts
 */

import 'dotenv/config';
import { google } from 'googleapis';
import * as fs from 'fs';
import * as readline from 'readline';

// Use credentials from GOOGLE_OAUTH_CLIENT_SECRET env var (from credentials.json)
// For this script to work, you need a Desktop app OAuth credential from Google Cloud Console

async function getGoogleAuthToken() {
  const credentials = JSON.parse(process.env.GOOGLE_OAUTH_CLIENT_SECRET || '{}');
  
  if (!credentials.installed) {
    console.error('❌ GOOGLE_OAUTH_CLIENT_SECRET not properly configured');
    console.error('   Expected: Desktop OAuth credentials in credentials.json format');
    console.error('   Current env var: not found or invalid JSON');
    process.exit(1);
  }

  const { client_id, client_secret, redirect_uris } = credentials.installed;
  const redirectUrl = redirect_uris?.[0] || 'http://localhost:3000/auth/google/callback';

  const oauth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirectUrl
  );

  // Generate auth URL
  const scopes = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.modify',
    'openid',
    'profile',
    'email',
  ];

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
  });

  console.log('\n📍 Step 1: Open this URL in your browser and authorize the app:');
  console.log(`\n${authUrl}\n`);

  // Prompt user for the authorization code
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve, reject) => {
    rl.question('📋 Paste the authorization code here: ', async (code) => {
      rl.close();

      if (!code) {
        console.error('❌ No code provided');
        process.exit(1);
      }

      try {
        console.log('\n⏳ Exchanging code for tokens...');
        const { tokens } = await oauth2Client.getToken(code);

        console.log('\n✅ Tokens obtained successfully!');
        console.log('\n🔑 Your refresh token:');
        console.log(`\n${tokens.refresh_token}\n`);

        // Save to file for reference
        const tokenFile = 'oauth-test-token.json';
        fs.writeFileSync(tokenFile, JSON.stringify(tokens, null, 2));
        console.log(`💾 Saved to ${tokenFile}`);

        console.log('\n📌 Next steps:');
        console.log('1. Use this refresh token in the /api/test-link-gmail endpoint:');
        console.log(`\n   curl -X POST http://localhost:3000/api/test-link-gmail \\`);
        console.log(`     -H "Content-Type: application/json" \\`);
        console.log(`     -d '{'phone':'+917254856546','email':'lcs.souravkrsahu@gmail.com','refreshToken':'${tokens.refresh_token}'}'`);
        console.log('\n2. Then trigger the Gmail scan:');
        console.log(`\n   curl -X POST http://localhost:3000/api/trigger-gmail-scan \\`);
        console.log(`     -H "X-User-Phone: +917254856546"\n`);

        resolve(tokens.refresh_token);
      } catch (err: any) {
        console.error('❌ Error exchanging token:', err.message);
        reject(err);
      }
    });
  });
}

// Run the flow
getGoogleAuthToken().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
