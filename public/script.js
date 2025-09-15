let currentPuzzle = null;
let wordHintsUsed = 0;
let score = 0;
let maxHints = 3;
let revealedWords = [];
let answerRevealed = false;
let gameComplete = false;
let puzzleHistory = [];
let currentPuzzleIndex = -1;

const langSelect = document.getElementById("langSelect");
const baseLangSelect = document.getElementById("baseLangSelect");
const emojiDisplay = document.getElementById("emojiDisplay");
const dashDisplay = document.getElementById("dashDisplay");
const hintBox = document.getElementById("hintBox");
const wordHintBtn = document.getElementById("wordHintBtn");
const meaningBtn = document.getElementById("meaningBtn");
const showAnswerBtn = document.getElementById("showAnswerBtn");
const nextBtn = document.getElementById("nextBtn");
const guessInput = document.getElementById("guessInput");
const submitBtn = document.getElementById("submitBtn");
const prevBtn = document.getElementById("prevBtn");
const result = document.getElementById("result");
const scoreDisplay = document.getElementById("scoreDisplay");

async function fetchPuzzle(lang) {
  try {
    console.log(`[INFO] Fetching puzzle for language: ${lang}`);
    const response = await fetch(`/api/puzzle?lang=${lang}`);
    if (!response.ok) {
      throw new Error("Failed to fetch puzzle.");
    }

    const data = await response.json();
    console.log(`[DEBUG] Puzzle data:`, data);
    
    // Check if game is complete
    if (data.gameComplete) {
      gameComplete = true;
      showGameComplete(data);
      return;
    }
    
    currentPuzzle = data;
    wordHintsUsed = 0;
    revealedWords = [];
    answerRevealed = false;
    gameComplete = false;
    
    // Add to puzzle history
    puzzleHistory.push({
      puzzle: data,
      wordHintsUsed: 0,
      revealedWords: [],
      answerRevealed: false
    });
    currentPuzzleIndex = puzzleHistory.length - 1;
    
    updateUI();
    console.log(`[INFO] Loaded puzzle: ${data.emojis}`);
  } catch (err) {
    console.error("[ERROR] Puzzle fetch failed:", err.message);
    emojiDisplay.textContent = "⚠️ Failed to load puzzle.";
  }
}

function generateDashes(answer) {
  return answer
    .split(" ")
    .map((word, index) => {
      if (revealedWords.includes(index)) {
        return `<span class="word-reveal">${word}</span>`;
      }
      return "_".repeat(word.length);
    })
    .join(" ");
}

function updateUI() {
  if (!currentPuzzle) return;

  // Add loading animation
  emojiDisplay.innerHTML = '<div class="loading"></div>';
  
  setTimeout(() => {
    emojiDisplay.textContent = currentPuzzle.emojis || "❓";
    dashDisplay.innerHTML = generateDashes(currentPuzzle.answer);
    hintBox.textContent = "";
    guessInput.value = "";
    result.textContent = "";
    result.className = "result";
    scoreDisplay.textContent = score;
    
    updateHintButtons();
  }, 500);
}

function updateHintButtons() {
  const remainingWordHints = maxHints - wordHintsUsed;
  
  const wordHintCount = wordHintBtn.querySelector('.hint-count');
  const meaningHintCount = meaningBtn.querySelector('.hint-count');
  
  wordHintCount.textContent = `(${remainingWordHints} left)`;
  meaningHintCount.textContent = `(Free)`;
  
  // Disable all buttons if game is complete
  if (gameComplete) {
    wordHintBtn.disabled = true;
    wordHintBtn.style.opacity = '0.5';
    wordHintBtn.style.cursor = 'not-allowed';
    meaningBtn.disabled = true;
    meaningBtn.style.opacity = '0.5';
    meaningBtn.style.cursor = 'not-allowed';
    showAnswerBtn.disabled = true;
    showAnswerBtn.style.opacity = '0.5';
    showAnswerBtn.style.cursor = 'not-allowed';
    nextBtn.disabled = true;
    nextBtn.style.opacity = '0.5';
    nextBtn.style.cursor = 'not-allowed';
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.5';
    submitBtn.style.cursor = 'not-allowed';
    guessInput.disabled = true;
    return;
  }
  
  // Update word hint button
  if (remainingWordHints <= 0 || answerRevealed) {
    wordHintBtn.disabled = true;
    wordHintBtn.style.opacity = '0.5';
    wordHintBtn.style.cursor = 'not-allowed';
  } else {
    wordHintBtn.disabled = false;
    wordHintBtn.style.opacity = '1';
    wordHintBtn.style.cursor = 'pointer';
  }
  
  // Update meaning button (always available, even after answer is shown)
  if (gameComplete) {
    meaningBtn.disabled = true;
    meaningBtn.style.opacity = '0.5';
    meaningBtn.style.cursor = 'not-allowed';
  } else {
    meaningBtn.disabled = false;
    meaningBtn.style.opacity = '1';
    meaningBtn.style.cursor = 'pointer';
  }
  
  // Update show answer button
  if (answerRevealed) {
    showAnswerBtn.disabled = true;
    showAnswerBtn.style.opacity = '0.5';
    showAnswerBtn.style.cursor = 'not-allowed';
    showAnswerBtn.innerHTML = '<span>✅ Answer Shown</span>';
  } else {
    showAnswerBtn.disabled = false;
    showAnswerBtn.style.opacity = '1';
    showAnswerBtn.style.cursor = 'pointer';
    showAnswerBtn.innerHTML = '<span>👁️ Show Answer</span>';
  }
  
  // Update next button - always available (can skip puzzles)
  if (gameComplete) {
    nextBtn.disabled = true;
    nextBtn.style.opacity = '0.5';
    nextBtn.style.cursor = 'not-allowed';
  } else {
    nextBtn.disabled = false;
    nextBtn.style.opacity = '1';
    nextBtn.style.cursor = 'pointer';
  }
  
  // Update previous button
  if (currentPuzzleIndex > 0) {
    prevBtn.disabled = false;
    prevBtn.style.opacity = '1';
    prevBtn.style.cursor = 'pointer';
  } else {
    prevBtn.disabled = true;
    prevBtn.style.opacity = '0.5';
    prevBtn.style.cursor = 'not-allowed';
  }
}

function getWordHint() {
  if (!currentPuzzle || wordHintsUsed >= maxHints || answerRevealed) return;

  const words = currentPuzzle.answer.split(" ");
  const availableWords = words.map((_, index) => index).filter(index => !revealedWords.includes(index));
  
  if (availableWords.length === 0) return;

  const randomIndex = availableWords[Math.floor(Math.random() * availableWords.length)];
  revealedWords.push(randomIndex);
  wordHintsUsed++;
  
  // Deduct points for using word hint
  score = Math.max(0, score - 1);
  scoreDisplay.textContent = score;
  
  // Update the display
  dashDisplay.innerHTML = generateDashes(currentPuzzle.answer);
  updateHintButtons();
  
  // Add visual feedback
  dashDisplay.style.animation = 'successPulse 0.6s ease-out';
  setTimeout(() => {
    dashDisplay.style.animation = '';
  }, 600);
}

function getMeaningHint() {
  if (!currentPuzzle) return; // Meaning is free, no hint limit, can be used after scoring

  const baseLang = baseLangSelect.value;
  const hint = currentPuzzle.hints[baseLang];

  if (hint) {
    const hintLine = `💡 ${hint}`;
    hintBox.textContent = hintLine;
    
    // Only deduct points if answer is not already revealed (meaning is free after show answer)
    if (!answerRevealed) {
      score = Math.max(0, score - 1);
      scoreDisplay.textContent = score;
    }
    
    // Add visual feedback
    hintBox.style.animation = 'none';
    setTimeout(() => {
      hintBox.style.animation = 'fadeIn 0.3s ease-out';
    }, 10);
  }
}

function showAnswer() {
  if (!currentPuzzle || answerRevealed) return;
  
  answerRevealed = true;
  
  // Reveal all words with bouncing animation
  const words = currentPuzzle.answer.split(" ");
  words.forEach((word, index) => {
    if (!revealedWords.includes(index)) {
      revealedWords.push(index);
    }
  });
  
  dashDisplay.innerHTML = generateDashes(currentPuzzle.answer);
  hintBox.textContent = `🎯 Answer: ${currentPuzzle.answer}`;
  updateHintButtons();
  
  // Add visual feedback
  dashDisplay.style.animation = 'successPulse 0.6s ease-out';
  hintBox.style.animation = 'fadeIn 0.3s ease-out';
}

function nextPuzzle() {
  if (!currentPuzzle || gameComplete) return;
  
  // Save current state to history (mark as skipped if not solved)
  if (currentPuzzleIndex >= 0) {
    puzzleHistory[currentPuzzleIndex] = {
      puzzle: currentPuzzle,
      wordHintsUsed: wordHintsUsed,
      revealedWords: [...revealedWords],
      answerRevealed: answerRevealed,
      skipped: !answerRevealed // Mark as skipped if not solved
    };
  }
  
  // Reset for new puzzle
  wordHintsUsed = 0;
  revealedWords = [];
  answerRevealed = false;
  
  // Fetch new puzzle
  fetchPuzzle(langSelect.value);
}

function previousPuzzle() {
  if (currentPuzzleIndex <= 0) return;
  
  // Save current state to history
  if (currentPuzzleIndex >= 0) {
    puzzleHistory[currentPuzzleIndex] = {
      puzzle: currentPuzzle,
      wordHintsUsed: wordHintsUsed,
      revealedWords: [...revealedWords],
      answerRevealed: answerRevealed,
      skipped: !answerRevealed
    };
  }
  
  // Go to previous puzzle
  currentPuzzleIndex--;
  const prevPuzzleData = puzzleHistory[currentPuzzleIndex];
  
  currentPuzzle = prevPuzzleData.puzzle;
  wordHintsUsed = prevPuzzleData.wordHintsUsed;
  revealedWords = [...prevPuzzleData.revealedWords];
  answerRevealed = prevPuzzleData.answerRevealed;
  gameComplete = false;
  
  updateUI();
}

function showGameComplete(data) {
  emojiDisplay.innerHTML = "🏆";
  dashDisplay.textContent = "GAME COMPLETE!";
  hintBox.innerHTML = `
    <div style="text-align: center; padding: 20px;">
      <h2 style="color: var(--accent-success); margin-bottom: 15px;">${data.message}</h2>
      <p style="color: var(--text-secondary); margin-bottom: 20px;">
        You completed ${data.completedPuzzles} out of ${data.totalPuzzles} puzzles!
      </p>
      <p style="color: var(--text-secondary); margin-bottom: 20px;">
        Final Score: <span style="color: var(--accent-primary); font-weight: bold;">${score}</span>
      </p>
      <button onclick="resetGame()" style="
        background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        margin: 10px;
      ">🔄 Play Again</button>
    </div>
  `;
  
  // Disable all buttons
  wordHintBtn.disabled = true;
  meaningBtn.disabled = true;
  showAnswerBtn.disabled = true;
  nextBtn.disabled = true;
  submitBtn.disabled = true;
  guessInput.disabled = true;
}

async function resetGame() {
  try {
    const response = await fetch(`/api/reset?lang=${langSelect.value}`, { method: 'POST' });
    if (response.ok) {
      gameComplete = false;
      score = 0;
      puzzleHistory = [];
      currentPuzzleIndex = -1;
      scoreDisplay.textContent = score;
      fetchPuzzle(langSelect.value);
    }
  } catch (err) {
    console.error("[ERROR] Failed to reset game:", err.message);
  }
}

function checkAnswer() {
  if (!currentPuzzle) return;

  const guess = guessInput.value.trim().toLowerCase();
  const answer = currentPuzzle.answer.trim().toLowerCase();

  if (guess === answer) {
    result.textContent = "🎉 Correct! Well done!";
    result.className = "result success";
    score += 10;
    answerRevealed = true;
    
    // Reveal all words with bouncing animation
    const words = currentPuzzle.answer.split(" ");
    words.forEach((word, index) => {
      if (!revealedWords.includes(index)) {
        revealedWords.push(index);
      }
    });
    
    // Update display with bouncing animation
    dashDisplay.innerHTML = generateDashes(currentPuzzle.answer);
    
    // Enable next and previous buttons
    updateHintButtons();
    
    // Add success animation to the entire dash display
    dashDisplay.style.animation = 'successPulse 0.6s ease-out';
    setTimeout(() => {
      dashDisplay.style.animation = '';
    }, 600);
  } else {
    result.textContent = "❌ Not quite right. Try again!";
    result.className = "result error";
    
    // Add shake effect
    guessInput.style.animation = 'errorShake 0.6s ease-out';
    setTimeout(() => {
      guessInput.style.animation = '';
    }, 600);
  }

  scoreDisplay.textContent = score;
}

// Event Listeners
langSelect.addEventListener("change", () => {
  wordHintsUsed = 0;
  revealedWords = [];
  answerRevealed = false;
  gameComplete = false;
  puzzleHistory = [];
  currentPuzzleIndex = -1;
  updateHintButtons();
  fetchPuzzle(langSelect.value);
});

baseLangSelect.addEventListener("change", () => {
  // Clear meaning hint when base language changes
  hintBox.textContent = "";
});

wordHintBtn.addEventListener("click", getWordHint);
meaningBtn.addEventListener("click", getMeaningHint);
showAnswerBtn.addEventListener("click", showAnswer);
nextBtn.addEventListener("click", nextPuzzle);
prevBtn.addEventListener("click", previousPuzzle);
submitBtn.addEventListener("click", checkAnswer);

// Add Enter key support for input
guessInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    checkAnswer();
  }
});

// Add focus effects
guessInput.addEventListener("focus", () => {
  guessInput.style.transform = "translateY(-2px)";
});

guessInput.addEventListener("blur", () => {
  guessInput.style.transform = "translateY(0)";
});

// Add click effects to buttons
submitBtn.addEventListener("mousedown", () => {
  submitBtn.style.transform = "translateY(0)";
});

submitBtn.addEventListener("mouseup", () => {
  submitBtn.style.transform = "translateY(-2px)";
});

// Initial load
fetchPuzzle(langSelect.value);
