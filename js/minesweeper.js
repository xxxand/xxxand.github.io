document.addEventListener('selectstart', e => { if (e.target.closest('.board')) e.preventDefault(); });

const ROWS = 9, COLS = 9, MINES = 10;
let board = [];
let revealed = [];
let flagged = [];
let gameOver = false;
let gameWon = false;
let firstClick = true;
let timeElapsed = 0;
let timerInterval = null;
let flagCount = 0;

const boardEl = document.getElementById('board');
const mineCountEl = document.getElementById('mineCount');
const timerEl = document.getElementById('timer');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const finalTimeEl = document.getElementById('finalTime');

function initBoard() {
  board = Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
  revealed = Array(ROWS).fill(null).map(() => Array(COLS).fill(false));
  flagged = Array(ROWS).fill(null).map(() => Array(COLS).fill(false));
  gameOver = false;
  gameWon = false;
  firstClick = true;
  flagCount = 0;
  timeElapsed = 0;
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = null;
  mineCountEl.textContent = MINES;
  timerEl.textContent = '0';
  overlay.classList.add('hidden');
  renderBoard();
}

function placeMines(excludeR, excludeC) {
  let placed = 0;
  while (placed < MINES) {
    const r = Math.floor(Math.random() * ROWS);
    const c = Math.floor(Math.random() * COLS);
    if (board[r][c] === -1) continue;
    if (Math.abs(r - excludeR) <= 1 && Math.abs(c - excludeC) <= 1) continue;
    board[r][c] = -1;
    placed++;
  }
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c] === -1) continue;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && board[nr][nc] === -1) count++;
        }
      board[r][c] = count;
    }
  }
}

function renderBoard() {
  boardEl.innerHTML = '';
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.r = r;
      cell.dataset.c = c;

      if (revealed[r][c]) {
        cell.classList.add('revealed');
        if (board[r][c] === -1) {
          cell.classList.add('mine');
          cell.textContent = '💣';
        } else if (board[r][c] > 0) {
          cell.textContent = board[r][c];
          cell.setAttribute('data-n', board[r][c]);
        }
      } else if (flagged[r][c]) {
        cell.classList.add('flagged');
        cell.textContent = '🚩';
      }

      cell.addEventListener('click', (e) => {
        e.preventDefault();
        handleClick(r, c);
      });

      cell.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        toggleFlag(r, c);
      });

      boardEl.appendChild(cell);
    }
  }
  mineCountEl.textContent = MINES - flagCount;
}

function handleClick(r, c) {
  if (gameOver || flagged[r][c] || revealed[r][c]) return;

  if (firstClick) {
    placeMines(r, c);
    firstClick = false;
    startTimer();
  }

  reveal(r, c);
  renderBoard();

  if (gameOver) {
    revealAll();
    renderBoard();
    stopTimer();
    overlayTitle.innerHTML = '<span class="lose">游戏结束</span>';
    finalTimeEl.textContent = timeElapsed;
    overlay.classList.remove('hidden');
  }
}

function reveal(r, c) {
  if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return;
  if (revealed[r][c] || flagged[r][c]) return;

  revealed[r][c] = true;

  if (board[r][c] === -1) {
    gameOver = true;
    return;
  }

  if (board[r][c] === 0) {
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++)
        if (dr !== 0 || dc !== 0) reveal(r + dr, c + dc);
  }

  checkWin();
}

function toggleFlag(r, c) {
  if (gameOver || revealed[r][c]) return;
  if (firstClick) return;

  flagged[r][c] = !flagged[r][c];
  flagCount += flagged[r][c] ? 1 : -1;
  renderBoard();
}

function checkWin() {
  let allRevealed = true;
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (board[r][c] !== -1 && !revealed[r][c]) { allRevealed = false; break; }
  if (!allRevealed) return;

  gameOver = true;
  gameWon = true;
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (board[r][c] === -1) flagged[r][c] = true;

  renderBoard();
  stopTimer();
  overlayTitle.innerHTML = '<span class="win">你赢�?</span>';
  finalTimeEl.textContent = timeElapsed;
  overlay.classList.remove('hidden');
}

function revealAll() {
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (board[r][c] === -1) revealed[r][c] = true;
}

function startTimer() {
  if (timerInterval) return;
  timerInterval = setInterval(() => {
    timeElapsed++;
    timerEl.textContent = timeElapsed;
  }, 1000);
}

function stopTimer() {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
}

let touchTarget = null;
let touchMoved = false;

boardEl.addEventListener('touchstart', (e) => {
  const cell = e.target.closest('.cell');
  if (!cell) return;
  touchTarget = cell;
  touchMoved = false;
  longPressTimer = setTimeout(() => {
    const r = parseInt(cell.dataset.r), c = parseInt(cell.dataset.c);
    toggleFlag(r, c);
    touchTarget = null;
  }, 400);
  e.preventDefault();
}, { passive: false });

boardEl.addEventListener('touchmove', () => {
  clearTimeout(longPressTimer);
  touchMoved = true;
});

boardEl.addEventListener('touchend', (e) => {
  clearTimeout(longPressTimer);
  if (touchTarget && !touchMoved) {
    const r = parseInt(touchTarget.dataset.r), c = parseInt(touchTarget.dataset.c);
    handleClick(r, c);
  }
  touchTarget = null;
});

document.getElementById('btnRestart').addEventListener('click', initBoard);
document.getElementById('btnReplay').addEventListener('click', initBoard);
document.getElementById('btnDismiss').addEventListener('click', () => overlay.classList.add('hidden'));

initBoard();
