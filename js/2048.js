document.addEventListener('selectstart', e => { if (e.target.closest('.board')) e.preventDefault(); });
const boardEl = document.getElementById('board');
const scoreEl = document.getElementById('score');
const bestScoreEl = document.getElementById('bestScore');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const finalScoreEl = document.getElementById('finalScore');

let grid = Array(4).fill(null).map(() => Array(4).fill(0));
let score = 0;
let bestScore = parseInt(localStorage.getItem('best2048') || '0');
let gameOver = false;
let won = false;
let history = [];

bestScoreEl.textContent = bestScore;

function addRandomTile() {
  const empty = [];
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++)
      if (grid[r][c] === 0) empty.push({r, c});
  if (empty.length === 0) return;
  const {r, c} = empty[Math.floor(Math.random() * empty.length)];
  grid[r][c] = Math.random() < 0.9 ? 2 : 4;
}

function renderBoard() {
  boardEl.innerHTML = '';
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const tile = document.createElement('div');
      tile.className = 'tile';
      const val = grid[r][c];
      if (val > 0) {
        tile.textContent = val;
        tile.setAttribute('data-value', val);
      }
      boardEl.appendChild(tile);
    }
  }
  scoreEl.textContent = score;
}

function slide(row) {
  let arr = row.filter(v => v !== 0);
  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] === arr[i + 1]) {
      arr[i] *= 2;
      score += arr[i];
      arr[i + 1] = 0;
    }
  }
  arr = arr.filter(v => v !== 0);
  while (arr.length < 4) arr.push(0);
  return arr;
}

function move(direction) {
  const oldGrid = grid.map(r => [...r]);
  const oldScore = score;
  if (direction === 'left') {
    for (let r = 0; r < 4; r++) grid[r] = slide(grid[r]);
  } else if (direction === 'right') {
    for (let r = 0; r < 4; r++) grid[r] = slide(grid[r].reverse()).reverse();
  } else if (direction === 'up') {
    for (let c = 0; c < 4; c++) {
      let col = [grid[0][c], grid[1][c], grid[2][c], grid[3][c]];
      col = slide(col);
      for (let r = 0; r < 4; r++) grid[r][c] = col[r];
    }
  } else if (direction === 'down') {
    for (let c = 0; c < 4; c++) {
      let col = [grid[3][c], grid[2][c], grid[1][c], grid[0][c]];
      col = slide(col).reverse();
      for (let r = 0; r < 4; r++) grid[r][c] = col[r];
    }
  }

  const moved = !grid.every((r, ri) => r.every((v, ci) => v === oldGrid[ri][ci]));
  if (moved) {
    history.push({grid: oldGrid, score: oldScore});
    addRandomTile();
    renderBoard();
    if (score > bestScore) {
      bestScore = score;
      localStorage.setItem('best2048', bestScore);
      bestScoreEl.textContent = bestScore;
    }
    checkGameState();
  }
}

function checkGameState() {
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++)
      if (grid[r][c] === 2048 && !won) { won = true; break; }

  let movesLeft = false;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (grid[r][c] === 0) { movesLeft = true; break; }
      if (r < 3 && grid[r][c] === grid[r + 1][c]) { movesLeft = true; break; }
      if (c < 3 && grid[r][c] === grid[r][c + 1]) { movesLeft = true; break; }
    }
    if (movesLeft) break;
  }

  if (!movesLeft || won) {
    gameOver = true;
    finalScoreEl.textContent = score;
    overlayTitle.textContent = won ? '你赢了!' : '游戏结束';
    overlay.classList.remove('hidden');
  }
}

function newGame() {
  grid = Array(4).fill(null).map(() => Array(4).fill(0));
  score = 0;
  gameOver = false;
  won = false;
  history = [];
  overlay.classList.add('hidden');
  addRandomTile();
  addRandomTile();
  renderBoard();
  scoreEl.textContent = '0';
}

document.addEventListener('keydown', (e) => {
  if (gameOver) return;
  const key = e.key.toLowerCase();
  e.preventDefault();
  if (key === 'arrowup' || key === 'w') move('up');
  else if (key === 'arrowdown' || key === 's') move('down');
  else if (key === 'arrowleft' || key === 'a') move('left');
  else if (key === 'arrowright' || key === 'd') move('right');
});

let touchStartX, touchStartY;
boardEl.addEventListener('touchstart', (e) => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
});
boardEl.addEventListener('touchend', (e) => {
  if (gameOver || !touchStartX) return;
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;
  if (Math.abs(dx) < 30 && Math.abs(dy) < 30) return;
  if (Math.abs(dx) > Math.abs(dy)) {
    move(dx > 0 ? 'right' : 'left');
  } else {
    move(dy > 0 ? 'down' : 'up');
  }
});

document.getElementById('btnNewGame').addEventListener('click', newGame);
document.getElementById('btnRestart').addEventListener('click', newGame);
document.getElementById('btnDismiss').addEventListener('click', () => overlay.classList.add('hidden'));
document.getElementById('btnUndo').addEventListener('click', () => {
  if (gameOver || history.length === 0) return;
  const prev = history.pop();
  grid = prev.grid;
  score = prev.score;
  renderBoard();
});

newGame();