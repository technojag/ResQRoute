/**
 * PASTE THIS INTO YOUR TERMINAL:
 *   node test-server.js
 *
 * This is a standalone test server with NO imports from src/
 * If this works = the problem is in your src/ files
 * If this fails = npm packages are missing
 */

require('dotenv').config();

console.log('\n[1] dotenv loaded');

const express = require('express');
console.log('[2] express loaded');

const app = express();
app.get('/health', (_, res) => res.json({ status: 'OK' }));

app.listen(5000, () => {
  console.log('\n✅ TEST SERVER RUNNING at http://localhost:5000/health\n');
  console.log('If you see this = npm packages are fine');
  console.log('The crash is coming from a file in src/\n');
});