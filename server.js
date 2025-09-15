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

// Track used puzzles per language to prevent repetition
const usedPuzzles = {
  en: new Set(),
  sn: new Set(),
  haw: new Set()
};

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

    // Check if all puzzles have been used
    if (usedPuzzles[lang].size >= puzzles.length) {
      return res.json({ 
        gameComplete: true, 
        message: "🎉 Congratulations! You've completed all puzzles in this language!",
        totalPuzzles: puzzles.length,
        completedPuzzles: usedPuzzles[lang].size
      });
    }

    // Get available puzzles (not yet used)
    const availablePuzzles = puzzles.filter((_, index) => !usedPuzzles[lang].has(index));
    
    if (availablePuzzles.length === 0) {
      return res.json({ 
        gameComplete: true, 
        message: "🎉 Congratulations! You've completed all puzzles in this language!",
        totalPuzzles: puzzles.length,
        completedPuzzles: usedPuzzles[lang].size
      });
    }

    // Select a random puzzle from available ones
    const randomIndex = Math.floor(Math.random() * availablePuzzles.length);
    const puzzle = availablePuzzles[randomIndex];
    
    // Find the original index in the full array
    const originalIndex = puzzles.findIndex(p => p.emojis === puzzle.emojis && p.answer === puzzle.answer);
    
    // Mark this puzzle as used
    usedPuzzles[lang].add(originalIndex);

    console.log(`[INFO] Served puzzle ${originalIndex + 1}/${puzzles.length} from '${lang}'`);

    res.json({
      ...puzzle,
      puzzleNumber: originalIndex + 1,
      totalPuzzles: puzzles.length,
      remainingPuzzles: puzzles.length - usedPuzzles[lang].size
    });
  });
});

// 🔄 API: Reset game progress
app.post('/api/reset', (req, res) => {
  const lang = req.query.lang || 'en';
  
  if (!allowedLangs.includes(lang)) {
    return res.status(400).json({ error: 'Unsupported language' });
  }
  
  usedPuzzles[lang].clear();
  console.log(`[INFO] Reset game progress for '${lang}'`);
  
  res.json({ message: 'Game progress reset successfully' });
});

// 🏠 Homepage (optional override)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 🚀 Start the server
app.listen(PORT, () => {
  console.log(`✅ EmojiQuest server running on http://localhost:${PORT}`);
});
