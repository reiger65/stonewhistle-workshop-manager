const express = require('express');
const app = express();

// Basic middleware
app.use(express.json());

// Simple health check
app.get('/health', (req, res) => {
  console.log('🏥 Health check requested');
  res.status(200).json({ 
    status: 'ok',
    message: 'Minimal server is running',
    timestamp: new Date().toISOString()
  });
});

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Minimal server is working!' });
});

// Start server
const port = process.env.PORT || 5000;
app.listen(port, '0.0.0.0', () => {
  console.log(`✅ Minimal server running on port ${port}`);
});
