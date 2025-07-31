/**
 * Express.js server for Car Customer Connect API endpoints
 * This server handles Facebook data deletion callbacks and other API endpoints
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const { expressHandler } = require('./facebook/data-deletion-callback');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Facebook data deletion callback endpoint
app.post('/api/facebook/data-deletion-callback', expressHandler);
app.options('/api/facebook/data-deletion-callback', expressHandler);

// Default route
app.get('/', (req, res) => {
  res.json({
    message: 'Car Customer Connect API Server',
    version: '1.0.0',
    endpoints: [
      'GET /health - Health check',
      'POST /api/facebook/data-deletion-callback - Facebook data deletion callback'
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Car Customer Connect API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Facebook callback: http://localhost:${PORT}/api/facebook/data-deletion-callback`);
});
