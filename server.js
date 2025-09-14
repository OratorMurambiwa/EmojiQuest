const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());

// ✅ Serve static frontend files from 'public'
app.use(express.static(path.join(__dirname, 'public')));

const allowedLangs = ['en', 'sn', 'haw']; // Supported languages

// 🎯 API: Get a random puzzle
app.get('/api/puzzle', (req, res) => {
  const lang = req.query.lang || 'en';

  if (!allowedLangs.includes(lang)) {
    return res.status(400).json({ error: 'Unsupported language' });
  }

  const filePath = path.join(__dirname, 'data', `${lang}.json`);

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error(`[ERROR] Could not read file: ${filePath}`);
      return res.status(404).json({ error: 'Language not found' });
    }

    let puzzles;
    try {
      puzzles = JSON.parse(data);
    } catch (parseError) {
      console.error(`[ERROR] Failed to parse ${lang}.json`);
      return res.status(500).json({ error: 'Corrupted puzzle data' });
    }

    if (!Array.isArray(puzzles) || puzzles.length === 0) {
      return res.status(404).json({ error: 'No puzzles found for this language.' });
    }

    const randomIndex = Math.floor(Math.random() * puzzles.length);
    const puzzle = puzzles[randomIndex];

    console.log(`[INFO] Served a puzzle from '${lang}'`);

    res.json(puzzle);
  });
});

// 🏠 Homepage (optional override)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 🚀 Start the server
app.listen(PORT, () => {
  console.log(`✅ EmojiQuest server running on http://localhost:${PORT}`);
});
