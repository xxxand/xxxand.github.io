document.addEventListener('selectstart', e => { if (e.target.closest('canvas')) e.preventDefault(); });
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('highScore');
const overlay = document.getElementById('overlay');
const finalScoreEl = document.getElementById('finalScore');

const gridSize = 20;
const tileCount = canvas.width / gridSize;

let snake = [{x:10,y:10}];
let food = {x:15,y:15};
let dx = 0, dy = 0;
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let gameRunning = false;
let gameLoop;
let gameSpeed = 150;

highScoreEl.textContent = highScore;

function draw() {
  ctx.fillStyle = '#16213e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < tileCount; i++) {
    for (let j = 0; j < tileCount; j++) {
      ctx.fillStyle = (i + j) % 2 === 0 ? '#1a2744' : '#16213e';
      ctx.fillRect(i * gridSize, j * gridSize, gridSize - 1, gridSize - 1);
    }
  }

  ctx.fillStyle = '#ff6b6b';
  ctx.fillRect(food.x * gridSize + 2, food.y * gridSize + 2, gridSize - 4, gridSize - 4);

  snake.forEach((seg, idx) => {
    const gradient = ctx.createLinearGradient(
      seg.x * gridSize, seg.y * gridSize,
      seg.x * gridSize + gridSize, seg.y * gridSize + gridSize
    );
    if (idx === 0) {
      gradient.addColorStop(0, '#4caf50');
      gradient.addColorStop(1, '#81c784');
    } else {
      gradient.addColorStop(0, '#388e3c');
      gradient.addColorStop(1, '#4caf50');
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(seg.x * gridSize + 1, seg.y * gridSize + 1, gridSize - 2, gridSize - 2);
    if (idx === 0) {
      ctx.fillStyle = '#fff';
      ctx.fillRect(seg.x * gridSize + 6, seg.y * gridSize + 6, 3, 3);
      ctx.fillRect(seg.x * gridSize + 12, seg.y * gridSize + 6, 3, 3);
    }
  });
}

function update() {
  const head = {x: snake[0].x + dx, y: snake[0].y + dy};

  if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
    gameOver();
    return;
  }

  for (let seg of snake) {
    if (head.x === seg.x && head.y === seg.y) {
      gameOver();
      return;
    }
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score += 10;
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

function placeFood() {
  do {
    food.x = Math.floor(Math.random() * tileCount);
    food.y = Math.floor(Math.random() * tileCount);
  } while (snake.some(seg => seg.x === food.x && seg.y === food.y));
}

function gameOver() {
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

function startGame() {
  snake = [{x:10,y:10}];
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

function changeDirection(e) {
  const key = e.key.toLowerCase();
  e.preventDefault();

  if (key === 'arrowup' || key === 'w') {
    if (dy !== 1) { dx = 0; dy = -1; }
  } else if (key === 'arrowdown' || key === 's') {
    if (dy !== -1) { dx = 0; dy = 1; }
  } else if (key === 'arrowleft' || key === 'a') {
    if (dx !== 1) { dx = -1; dy = 0; }
  } else if (key === 'arrowright' || key === 'd') {
    if (dx !== -1) { dx = 1; dy = 0; }
  }
}

document.addEventListener('keydown', changeDirection);
document.getElementById('btnStart').addEventListener('click', startGame);
document.getElementById('btnRestart').addEventListener('click', startGame);
document.getElementById('btnDismiss').addEventListener('click', () => overlay.classList.add('hidden'));

function setDirection(dir) {
  if (dir === 'up' && dy !== 1) { dx = 0; dy = -1; }
  else if (dir === 'down' && dy !== -1) { dx = 0; dy = 1; }
  else if (dir === 'left' && dx !== 1) { dx = -1; dy = 0; }
  else if (dir === 'right' && dx !== -1) { dx = 1; dy = 0; }
}

document.querySelectorAll('.dpad-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    setDirection(btn.dataset.dir);
  });
  btn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    setDirection(btn.dataset.dir);
  });
});

let touchStartX = 0, touchStartY = 0;
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
});
canvas.addEventListener('touchend', (e) => {
  const dx2 = e.changedTouches[0].clientX - touchStartX;
  const dy2 = e.changedTouches[0].clientY - touchStartY;
  if (Math.abs(dx2) < 20 && Math.abs(dy2) < 20) return;
  if (Math.abs(dx2) > Math.abs(dy2)) setDirection(dx2 > 0 ? 'right' : 'left');
  else setDirection(dy2 > 0 ? 'down' : 'up');
});

document.querySelectorAll('.speed-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    gameSpeed = parseInt(btn.dataset.speed);
    if (gameRunning) {
      clearInterval(gameLoop);
      gameLoop = setInterval(gameStep, gameSpeed);
    }
  });
});

draw();