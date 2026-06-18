/* snake.js — 贪吃蛇 */

document.addEventListener('selectstart', function(e) {
  if (e.target.closest('canvas')) e.preventDefault();
});

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('highScore');
const overlay = document.getElementById('overlay');
const finalScoreEl = document.getElementById('finalScore');

const GRID_SIZE = 20;
const TILE_COUNT = canvas.width / GRID_SIZE;
const SCORE_PER_FOOD = 10;
const DEFAULT_SPEED = 150;
const SPEED_SLOW = 220;
const SPEED_MEDIUM = 150;
const SPEED_FAST = 80;
const SWIPE_THRESHOLD = 20;

let snake = [{x: 10, y: 10}];
let food = {x: 15, y: 15};
let dx = 0, dy = 0;
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let gameRunning = false;
let gameLoop = null;
let gameSpeed = DEFAULT_SPEED;

highScoreEl.textContent = highScore;

function draw() {
  ctx.fillStyle = '#16213e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < TILE_COUNT; i++) {
    for (let j = 0; j < TILE_COUNT; j++) {
      ctx.fillStyle = (i + j) % 2 === 0 ? '#1a2744' : '#16213e';
      ctx.fillRect(i * GRID_SIZE, j * GRID_SIZE, GRID_SIZE - 1, GRID_SIZE - 1);
    }
  }

  ctx.fillStyle = '#ff6b6b';
  ctx.fillRect(food.x * GRID_SIZE + 2, food.y * GRID_SIZE + 2, GRID_SIZE - 4, GRID_SIZE - 4);

  snake.forEach(function(seg, idx) {
    var gradient = ctx.createLinearGradient(
      seg.x * GRID_SIZE, seg.y * GRID_SIZE,
      seg.x * GRID_SIZE + GRID_SIZE, seg.y * GRID_SIZE + GRID_SIZE
    );
    if (idx === 0) {
      gradient.addColorStop(0, '#4caf50');
      gradient.addColorStop(1, '#81c784');
    } else {
      gradient.addColorStop(0, '#388e3c');
      gradient.addColorStop(1, '#4caf50');
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(seg.x * GRID_SIZE + 1, seg.y * GRID_SIZE + 1, GRID_SIZE - 2, GRID_SIZE - 2);
    if (idx === 0) {
      ctx.fillStyle = '#fff';
      ctx.fillRect(seg.x * GRID_SIZE + 6, seg.y * GRID_SIZE + 6, 3, 3);
      ctx.fillRect(seg.x * GRID_SIZE + 12, seg.y * GRID_SIZE + 6, 3, 3);
    }
  });
}

function placeFood() {
  do {
    food.x = Math.floor(Math.random() * TILE_COUNT);
    food.y = Math.floor(Math.random() * TILE_COUNT);
  } while (snake.some(function(seg) { return seg.x === food.x && seg.y === food.y; }));
}

function endGame() {
  gameRunning = false;
  clearInterval(gameLoop);
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('snakeHighScore', highScore);
    highScoreEl.textContent = highScore;
  }
  finalScoreEl.textContent = score;
  overlay.classList.remove('hidden');
}

function update() {
  var head = {x: snake[0].x + dx, y: snake[0].y + dy};

  if (head.x < 0 || head.x >= TILE_COUNT || head.y < 0 || head.y >= TILE_COUNT) {
    endGame();
    return;
  }

  for (var i = 0; i < snake.length; i++) {
    if (head.x === snake[i].x && head.y === snake[i].y) {
      endGame();
      return;
    }
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score += SCORE_PER_FOOD;
    scoreEl.textContent = score;
    placeFood();
  } else {
    snake.pop();
  }

  draw();
}

function gameStep() {
  if (dx === 0 && dy === 0) return;
  update();
}

function setDirection(dir) {
  if (dir === 'up' && dy !== 1) { dx = 0; dy = -1; }
  else if (dir === 'down' && dy !== -1) { dx = 0; dy = 1; }
  else if (dir === 'left' && dx !== 1) { dx = -1; dy = 0; }
  else if (dir === 'right' && dx !== -1) { dx = 1; dy = 0; }
}

function onKeyDown(e) {
  var key = e.key.toLowerCase();
  e.preventDefault();
  if (key === 'arrowup' || key === 'w') { setDirection('up'); }
  else if (key === 'arrowdown' || key === 's') { setDirection('down'); }
  else if (key === 'arrowleft' || key === 'a') { setDirection('left'); }
  else if (key === 'arrowright' || key === 'd') { setDirection('right'); }
}

function startGame() {
  snake = [{x: 10, y: 10}];
  dx = 0; dy = 0;
  score = 0;
  scoreEl.textContent = '0';
  overlay.classList.add('hidden');
  placeFood();
  draw();
  gameRunning = true;
  if (gameLoop) clearInterval(gameLoop);
  gameLoop = setInterval(gameStep, gameSpeed);
}

// Keyboard
document.addEventListener('keydown', onKeyDown);

// Buttons
document.getElementById('btnStart').addEventListener('click', startGame);
document.getElementById('btnRestart').addEventListener('click', startGame);
document.getElementById('btnDismiss').addEventListener('click', function() { overlay.classList.add('hidden'); });

// D-pad
document.querySelectorAll('.dpad-btn').forEach(function(btn) {
  btn.addEventListener('click', function(e) {
    e.preventDefault();
    setDirection(btn.dataset.dir);
  });
  btn.addEventListener('touchstart', function(e) {
    e.preventDefault();
    setDirection(btn.dataset.dir);
  });
});

// Speed selector
document.querySelectorAll('.speed-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.speed-btn').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
    gameSpeed = parseInt(btn.dataset.speed);
    if (gameRunning) {
      clearInterval(gameLoop);
      gameLoop = setInterval(gameStep, gameSpeed);
    }
  });
});

// Swipe on canvas
var touchStartX = 0, touchStartY = 0;
canvas.addEventListener('touchstart', function(e) {
  e.preventDefault();
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
});
canvas.addEventListener('touchend', function(e) {
  var dx2 = e.changedTouches[0].clientX - touchStartX;
  var dy2 = e.changedTouches[0].clientY - touchStartY;
  if (Math.abs(dx2) < SWIPE_THRESHOLD && Math.abs(dy2) < SWIPE_THRESHOLD) return;
  if (Math.abs(dx2) > Math.abs(dy2)) {
    setDirection(dx2 > 0 ? 'right' : 'left');
  } else {
    setDirection(dy2 > 0 ? 'down' : 'up');
  }
});

draw();
