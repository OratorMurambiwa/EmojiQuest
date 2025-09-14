let currentPuzzle = null;
let usedHints = 0;
let score = 0;
let level = 1;

const langSelect = document.getElementById("langSelect");
const emojiDisplay = document.getElementById("emojiDisplay");
const dashDisplay = document.getElementById("dashDisplay");
const hintBox = document.getElementById("hintBox");
const hintBtn = document.getElementById("hintBtn");
const guessInput = document.getElementById("guessInput");
const submitBtn = document.getElementById("submitBtn");
const result = document.getElementById("result");
const scoreDisplay = document.getElementById("scoreDisplay");
const levelDisplay = document.getElementById("levelDisplay");

async function fetchPuzzle(lang) {
  try {
    const response = await fetch(`/api/puzzle?lang=${lang}`);
    if (!response.ok) {
      throw new Error("Failed to fetch puzzle.");
    }

    const puzzle = await response.json();
    currentPuzzle = puzzle;
    usedHints = 0;
    updateUI();
    console.log(`[INFO] Loaded puzzle: ${puzzle.emoji}`);
  } catch (err) {
    console.error("[ERROR] Puzzle fetch failed:", err.message);
    emojiDisplay.textContent = "⚠️ Failed to load puzzle.";
  }
}

function generateDashes(answer) {
  return answer
    .split(" ")
    .map((word) => "_".repeat(word.length))
    .join(" ");
}

function updateUI() {
  if (!currentPuzzle) return;

  emojiDisplay.textContent = currentPuzzle.emoji || "❓";
  dashDisplay.textContent = generateDashes(currentPuzzle.answer);
  hintBox.textContent = "";
  guessInput.value = "";
  result.textContent = "";
  scoreDisplay.textContent = score;
  levelDisplay.textContent = level;
}

function getHint() {
  if (!currentPuzzle || usedHints >= 3) return;

  const hintTypes = ["meaning", "word"];
  const availableHints = hintTypes.filter((type) => currentPuzzle.hints[type]);

  if (availableHints.length === 0) return;

  const randomType = availableHints[Math.floor(Math.random() * availableHints.length)];
  const hint = currentPuzzle.hints[randomType];

  if (hint) {
    const hintLine = `• ${randomType.toUpperCase()}: ${hint}`;
    hintBox.textContent += hintLine + "\n";
    usedHints++;
  }
}

function checkAnswer() {
  if (!currentPuzzle) return;

  const guess = guessInput.value.trim().toLowerCase();
  const answer = currentPuzzle.answer.trim().toLowerCase();

  if (guess === answer) {
    result.textContent = "✅ Correct!";
    score += 10;
    level++;
    fetchPuzzle(langSelect.value);
  } else {
    result.textContent = "❌ Try again.";
  }

  scoreDisplay.textContent = score;
  levelDisplay.textContent = level;
}

langSelect.addEventListener("change", () => {
  fetchPuzzle(langSelect.value);
});

hintBtn.addEventListener("click", getHint);
submitBtn.addEventListener("click", checkAnswer);

// Initial load
fetchPuzzle(langSelect.value);
