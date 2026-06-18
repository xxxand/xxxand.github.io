/* 2048.js */

document.addEventListener('selectstart', function(e) {
  if (e.target.closest('.board')) e.preventDefault();
});

var boardEl = document.getElementById('board');
var scoreEl = document.getElementById('score');
var bestScoreEl = document.getElementById('bestScore');
var overlay = document.getElementById('overlay');
var overlayTitle = document.getElementById('overlayTitle');
var finalScoreEl = document.getElementById('finalScore');

var GRID_SIZE = 4;
var TILE_4_CHANCE = 0.9;

var grid = Array(GRID_SIZE).fill(null).map(function() { return Array(GRID_SIZE).fill(0); });
var score = 0;
var bestScore = parseInt(localStorage.getItem('best2048') || '0');
var gameOver = false;
var won = false;
var history = [];

bestScoreEl.textContent = bestScore;

function addRandomTile() {
  var empty = [];
  for (var r = 0; r < GRID_SIZE; r++)
    for (var c = 0; c < GRID_SIZE; c++)
      if (grid[r][c] === 0) empty.push({r: r, c: c});
  if (empty.length === 0) return;
  var pos = empty[Math.floor(Math.random() * empty.length)];
  grid[pos.r][pos.c] = Math.random() < TILE_4_CHANCE ? 2 : 4;
}

function renderBoard() {
  boardEl.innerHTML = '';
  for (var r = 0; r < GRID_SIZE; r++) {
    for (var c = 0; c < GRID_SIZE; c++) {
      var tile = document.createElement('div');
      tile.className = 'tile';
      var val = grid[r][c];
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
  var arr = row.filter(function(v) { return v !== 0; });
  for (var i = 0; i < arr.length - 1; i++) {
    if (arr[i] === arr[i + 1]) {
      arr[i] *= 2;
      score += arr[i];
      arr[i + 1] = 0;
    }
  }
  arr = arr.filter(function(v) { return v !== 0; });
  while (arr.length < GRID_SIZE) arr.push(0);
  return arr;
}

function move(direction) {
  var oldGrid = grid.map(function(r) { return r.slice(); });
  var oldScore = score;

  if (direction === 'left') {
    for (var r = 0; r < GRID_SIZE; r++) grid[r] = slide(grid[r]);
  } else if (direction === 'right') {
    for (var r = 0; r < GRID_SIZE; r++) grid[r] = slide(grid[r].slice().reverse()).reverse();
  } else if (direction === 'up') {
    for (var c = 0; c < GRID_SIZE; c++) {
      var col = [grid[0][c], grid[1][c], grid[2][c], grid[3][c]];
      col = slide(col);
      for (var r = 0; r < GRID_SIZE; r++) grid[r][c] = col[r];
    }
  } else if (direction === 'down') {
    for (var c = 0; c < GRID_SIZE; c++) {
      var col = [grid[3][c], grid[2][c], grid[1][c], grid[0][c]];
      col = slide(col).reverse();
      for (var r = 0; r < GRID_SIZE; r++) grid[r][c] = col[r];
    }
  }

  var moved = false;
  for (var r = 0; r < GRID_SIZE; r++) {
    for (var c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] !== oldGrid[r][c]) { moved = true; break; }
    }
    if (moved) break;
  }

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
  for (var r = 0; r < GRID_SIZE; r++)
    for (var c = 0; c < GRID_SIZE; c++)
      if (grid[r][c] === 2048 && !won) { won = true; break; }

  var movesLeft = false;
  for (var r = 0; r < GRID_SIZE; r++) {
    for (var c = 0; c < GRID_SIZE; c++) {
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
  grid = Array(GRID_SIZE).fill(null).map(function() { return Array(GRID_SIZE).fill(0); });
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

function handleDirection(dir) {
  if (gameOver) return;
  move(dir);
}

// Keyboard
document.addEventListener('keydown', function(e) {
  if (gameOver) return;
  var key = e.key.toLowerCase();
  e.preventDefault();
  if (key === 'arrowup' || key === 'w') handleDirection('up');
  else if (key === 'arrowdown' || key === 's') handleDirection('down');
  else if (key === 'arrowleft' || key === 'a') handleDirection('left');
  else if (key === 'arrowright' || key === 'd') handleDirection('right');
});

// Touch swipe
var touchStartX, touchStartY;
var SWIPE_MIN = 30;
boardEl.addEventListener('touchstart', function(e) {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
});
boardEl.addEventListener('touchend', function(e) {
  if (gameOver || !touchStartX) return;
  var dx = e.changedTouches[0].clientX - touchStartX;
  var dy = e.changedTouches[0].clientY - touchStartY;
  if (Math.abs(dx) < SWIPE_MIN && Math.abs(dy) < SWIPE_MIN) return;
  if (Math.abs(dx) > Math.abs(dy)) {
    handleDirection(dx > 0 ? 'right' : 'left');
  } else {
    handleDirection(dy > 0 ? 'down' : 'up');
  }
});

// Buttons
document.getElementById('btnNewGame').addEventListener('click', newGame);
document.getElementById('btnRestart').addEventListener('click', newGame);
document.getElementById('btnDismiss').addEventListener('click', function() { overlay.classList.add('hidden'); });
document.getElementById('btnUndo').addEventListener('click', function() {
  if (gameOver || history.length === 0) return;
  var prev = history.pop();
  grid = prev.grid;
  score = prev.score;
  renderBoard();
});

newGame();
