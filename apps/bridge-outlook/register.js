#!/usr/bin/env node
/**
 * Registration file generator for Outlook Bridge
 * Writes appservice registration to /data/appservices/outlook.yaml
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import yaml from 'yaml';
import crypto from 'crypto';

const generateToken = () => crypto.randomBytes(32).toString('hex');

const AS_TOKEN = process.env.AS_TOKEN_OUTLOOK || generateToken();
const HS_TOKEN = process.env.HS_TOKEN_OUTLOOK || generateToken();
const SERVER_NAME = process.env.MATRIX_SERVER_NAME || 'localhost';
const APP_URL = process.env.BRIDGE_OUTLOOK_URL || 'http://localhost:9000';

const registration = {
  id: 'outlook-bridge',
  url: APP_URL,
  as_token: AS_TOKEN,
  hs_token: HS_TOKEN,
  sender_localpart: 'outlook_bot',
  namespaces: {
    users: [
      {
        exclusive: true,
        regex: `@outlook_.*:${SERVER_NAME}`
      }
    ],
    aliases: [
      {
        exclusive: true,
        regex: `#outlook_.*:${SERVER_NAME}`
      }
    ]
  },
  rate_limited: false,
  protocols: ['outlook']
};

const outputDir = '/data/appservices';
const outputPath = join(outputDir, 'outlook.yaml');

// Ensure directory exists
try {
  mkdirSync(outputDir, { recursive: true });
} catch (err) {
  // Directory might already exist
}

// Write registration file
const yamlContent = yaml.stringify(registration);
writeFileSync(outputPath, yamlContent, 'utf8');

console.log('✅ Outlook bridge registration written to:', outputPath);
console.log('\nAdd these to your .env file:');
console.log(`AS_TOKEN_OUTLOOK=${AS_TOKEN}`);
console.log(`HS_TOKEN_OUTLOOK=${HS_TOKEN}`);
console.log('\nRegistration details:');
console.log(yamlContent);

