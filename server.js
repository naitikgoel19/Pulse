const express = require('express');
const path = require('path');
const fs = require('fs/promises');

const app = express();
const PORT = process.env.PORT || 3000;

const PUBLIC_DIR = path.join(__dirname, 'public');
const PALETTES_FILE = path.join(__dirname, 'data', 'palettes.json');

// Serve static frontend files
app.use(express.static(PUBLIC_DIR));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'PalettePop' });
});

// GET /api/palettes
app.get('/api/palettes', async (req, res) => {
  try {
    const rawData = await fs.readFile(PALETTES_FILE, 'utf-8');
    const palettes = JSON.parse(rawData);

    const { category } = req.query;

    if (category && category.toLowerCase() !== 'all') {
      const filtered = palettes.filter(
        (palette) =>
          palette.category.toLowerCase() === category.toLowerCase()
      );

      return res.json({ palettes: filtered });
    }

    return res.json({ palettes });
  } catch (error) {
    console.error('Error reading palettes.json:', error.message);

    return res.status(500).json({
      error: 'Unable to load predefined palettes.'
    });
  }
});

// Handle unknown API routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found.' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`PalettePop server running on port ${PORT}`);
});