document.addEventListener('selectstart', e => { if (e.target.closest('canvas')) e.preventDefault(); });
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const btnForbidden = document.getElementById('btnForbidden');
const btnAI = document.getElementById('btnAI');
const btnColor = document.getElementById('btnColor');
const displaySize = 630;
const boardSize = 15;

const dpr = window.devicePixelRatio || 1;
canvas.width = displaySize * dpr;
canvas.height = displaySize * dpr;
ctx.scale(dpr, dpr);

const cellSize = displaySize / (boardSize + 1);
const margin = cellSize;
const directions = [[0,1],[1,0],[1,1],[1,-1]];

let board = Array(boardSize).fill(null).map(() => Array(boardSize).fill(0));
let currentPlayer = 1;
let gameOver = false;
let winLine = null;
let lastMoveR = -1, lastMoveC = -1;
let forbiddenEnabled = false;
let aiEnabled = false;
let humanPlayer = 1, aiPlayer = 2;
let aiThinking = false;
let moveHistory = [];

function drawBoard() {
  ctx.fillStyle = '#deb887';
  ctx.fillRect(0, 0, displaySize, displaySize);

  const bgGradient = ctx.createLinearGradient(0, 0, displaySize, displaySize);
  bgGradient.addColorStop(0, '#deb887');
  bgGradient.addColorStop(0.5, '#d2a679');
  bgGradient.addColorStop(1, '#c8956c');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, displaySize, displaySize);

  ctx.strokeStyle = '#5a3e2b';
  ctx.lineWidth = 0.8;
  for (let i = 0; i < boardSize; i++) {
    const pos = margin + i * cellSize;
    ctx.beginPath();
    ctx.moveTo(margin, pos);
    ctx.lineTo(margin + (boardSize - 1) * cellSize, pos);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pos, margin);
    ctx.lineTo(pos, margin + (boardSize - 1) * cellSize);
    ctx.stroke();
  }

  const starPoints = [[3,3],[3,11],[7,7],[11,3],[11,11]];
  starPoints.forEach(([r, c]) => {
    const x = margin + c * cellSize;
    const y = margin + r * cellSize;
    ctx.fillStyle = '#5a3e2b';
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  for (let r = 0; r < boardSize; r++) {
    for (let c = 0; c < boardSize; c++) {
      if (board[r][c] === 0) continue;
      const x = margin + c * cellSize;
      const y = margin + r * cellSize;
      const radius = cellSize * 0.42;

      if (board[r][c] === 1) {
        const grad = ctx.createRadialGradient(x - radius*0.3, y - radius*0.3, radius*0.1, x, y, radius);
        grad.addColorStop(0, '#555');
        grad.addColorStop(0.6, '#111');
        grad.addColorStop(1, '#000');
        ctx.fillStyle = grad;
      } else {
        const grad = ctx.createRadialGradient(x - radius*0.3, y - radius*0.3, radius*0.1, x, y, radius);
        grad.addColorStop(0, '#fff');
        grad.addColorStop(0.6, '#ddd');
        grad.addColorStop(1, '#bbb');
        ctx.fillStyle = grad;
      }

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      if (r === lastMoveR && c === lastMoveC) {
        ctx.strokeStyle = '#ff4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, radius * 0.35, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  if (winLine) {
    const [r1, c1] = winLine[0];
    const [r2, c2] = winLine[1];
    const x1 = margin + c1 * cellSize;
    const y1 = margin + r1 * cellSize;
    const x2 = margin + c2 * cellSize;
    const y2 = margin + r2 * cellSize;

    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 4]);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function getIntersection(px, py) {
  const c = Math.round((px - margin) / cellSize);
  const r = Math.round((py - margin) / cellSize);
  const cx = margin + c * cellSize;
  const cy = margin + r * cellSize;
  const dist = Math.hypot(px - cx, py - cy);
  if (r < 0 || r >= boardSize || c < 0 || c >= boardSize) return null;
  if (dist > cellSize * 0.45) return null;
  return {r, c};
}

function analyzeLine(r, c, dr, dc, player) {
  let countPos = 0;
  for (let i = 1; i <= 5; i++) {
    const nr = r + dr * i, nc = c + dc * i;
    if (nr < 0 || nr >= boardSize || nc < 0 || nc >= boardSize) break;
    if (board[nr][nc] !== player) break;
    countPos++;
  }
  let posSpace = 0;
  for (let i = countPos + 1; i <= 5; i++) {
    const nr = r + dr * i, nc = c + dc * i;
    if (nr < 0 || nr >= boardSize || nc < 0 || nc >= boardSize) break;
    if (board[nr][nc] !== 0) break;
    posSpace++;
  }
  let countNeg = 0;
  for (let i = 1; i <= 5; i++) {
    const nr = r - dr * i, nc = c - dc * i;
    if (nr < 0 || nr >= boardSize || nc < 0 || nc >= boardSize) break;
    if (board[nr][nc] !== player) break;
    countNeg++;
  }
  let negSpace = 0;
  for (let i = countNeg + 1; i <= 5; i++) {
    const nr = r - dr * i, nc = c - dc * i;
    if (nr < 0 || nr >= boardSize || nc < 0 || nc >= boardSize) break;
    if (board[nr][nc] !== 0) break;
    negSpace++;
  }
  const total = 1 + countPos + countNeg;
  return { total, posSpace, negSpace };
}

function isForbidden(r, c) {
  if (!forbiddenEnabled) return false;
  let threeCount = 0, fourCount = 0;
  for (const [dr, dc] of directions) {
    const { total, posSpace, negSpace } = analyzeLine(r, c, dr, dc, 1);
    if (total >= 6) return true;
    if (total === 5) return false;
    if (total === 4 && (posSpace >= 1 || negSpace >= 1)) fourCount++;
    if (total === 3 && posSpace >= 1 && negSpace >= 1) threeCount++;
  }
  return threeCount >= 2 || fourCount >= 2;
}

function checkWin(r, c, player) {
  for (const [dr, dc] of directions) {
    let count = 1, i = 1;
    let startR = r, startC = c, endR = r, endC = c;
    while (true) {
      const nr = r + dr * i, nc = c + dc * i;
      if (nr < 0 || nr >= boardSize || nc < 0 || nc >= boardSize || board[nr][nc] !== player) break;
      count++; endR = nr; endC = nc; i++;
    }
    i = 1;
    while (true) {
      const nr = r - dr * i, nc = c - dc * i;
      if (nr < 0 || nr >= boardSize || nc < 0 || nc >= boardSize || board[nr][nc] !== player) break;
      count++; startR = nr; startC = nc; i++;
    }
    if (count >= 5) {
      winLine = [[startR, startC], [endR, endC]];
      return true;
    }
  }
  return false;
}

function evaluateBoard(aiPlayer) {
  let score = 0;
  for (let r = 0; r < boardSize; r++) {
    for (let c = 0; c < boardSize; c++) {
      if (board[r][c] === 0) continue;
      const player = board[r][c];
      for (const [dr, dc] of directions) {
        const pr = r - dr, pc = c - dc;
        if (pr >= 0 && pr < boardSize && pc >= 0 && pc < boardSize && board[pr][pc] === player) continue;
        let count = 0;
        for (let i = 0; i < 5; i++) {
          const nr = r + dr * i, nc = c + dc * i;
          if (nr >= 0 && nr < boardSize && nc >= 0 && nc < boardSize && board[nr][nc] === player) count++;
          else break;
        }
        let openEnds = 0;
        const epr = r - dr, epc = c - dc;
        if (epr >= 0 && epr < boardSize && epc >= 0 && epc < boardSize && board[epr][epc] === 0) {
          let room = 0;
          for (let j = 0; j < 5 - count; j++) {
            const rr = epr - dr * j, cc = epc - dc * j;
            if (rr >= 0 && rr < boardSize && cc >= 0 && cc < boardSize && board[rr][cc] === 0) room++;
            else break;
          }
          if (room >= 5 - count) openEnds++;
        }
        const er = r + dr * count, ec = c + dc * count;
        if (er >= 0 && er < boardSize && ec >= 0 && ec < boardSize && board[er][ec] === 0) {
          let room = 0;
          for (let j = 0; j < 5 - count; j++) {
            const rr = er + dr * j, cc = ec + dc * j;
            if (rr >= 0 && rr < boardSize && cc >= 0 && cc < boardSize && board[rr][cc] === 0) room++;
            else break;
          }
          if (room >= 5 - count) openEnds++;
        }
        let s = 0;
        if (count >= 5) s = 1000000;
        else if (count === 4) s = openEnds === 2 ? 100000 : (openEnds === 1 ? 10000 : 0);
        else if (count === 3) s = openEnds === 2 ? 8000 : (openEnds === 1 ? 500 : 0);
        else if (count === 2) s = openEnds === 2 ? 500 : (openEnds === 1 ? 50 : 0);
        else if (count === 1) s = openEnds === 2 ? 10 : (openEnds === 1 ? 3 : 0);
        if (player === aiPlayer) score += s; else score -= s;
      }
    }
  }
  return score;
}

function getCandidates() {
  const candidates = [];
  const visited = new Set();
  for (let r = 0; r < boardSize; r++) {
    for (let c = 0; c < boardSize; c++) {
      if (board[r][c] !== 0) {
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < boardSize && nc >= 0 && nc < boardSize && board[nr][nc] === 0) {
              const key = nr * boardSize + nc;
              if (!visited.has(key)) {
                visited.add(key);
                candidates.push({r: nr, c: nc});
              }
            }
          }
        }
      }
    }
  }
  if (candidates.length === 0) candidates.push({r: 7, c: 7});
  return candidates;
}

const AI_SEARCH_DEPTH = 5;
const AI_TOP_CANDIDATES = 8;
const AI_BRANCH_LIMIT = 8;

function alphaBeta(depth, alpha, beta, player, aiPlayer) {
  if (depth === 0) return evaluateBoard(aiPlayer);
  let candidates = getCandidates();
  if (candidates.length > AI_BRANCH_LIMIT) {
    candidates = candidates.map(m => {
      board[m.r][m.c] = player;
      const s = evaluateBoard(aiPlayer);
      board[m.r][m.c] = 0;
      return {r: m.r, c: m.c, score: s};
    });
    candidates.sort((a,b) => player === aiPlayer ? b.score - a.score : a.score - b.score);
    candidates = candidates.slice(0, AI_BRANCH_LIMIT).map(m => ({r: m.r, c: m.c}));
  }
  if (player === aiPlayer) {
    let maxEval = -Infinity;
    for (const {r, c} of candidates) {
      board[r][c] = player;
      if (player === 1 && forbiddenEnabled && isForbidden(r, c)) { board[r][c] = 0; continue; }
      if (checkWin(r, c, player)) { board[r][c] = 0; winLine = null; return 1000000 + depth; }
      const eval = alphaBeta(depth - 1, alpha, beta, player === 1 ? 2 : 1, aiPlayer);
      board[r][c] = 0;
      maxEval = Math.max(maxEval, eval);
      alpha = Math.max(alpha, eval);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const {r, c} of candidates) {
      board[r][c] = player;
      if (player === 1 && forbiddenEnabled && isForbidden(r, c)) { board[r][c] = 0; continue; }
      if (checkWin(r, c, player)) { board[r][c] = 0; winLine = null; return -1000000 - depth; }
      const eval = alphaBeta(depth - 1, alpha, beta, player === 1 ? 2 : 1, aiPlayer);
      board[r][c] = 0;
      minEval = Math.min(minEval, eval);
      beta = Math.min(beta, eval);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

function aiMove() {
  aiThinking = true;
  const colorName = aiPlayer === 1 ? '黑棋' : '白棋';
  const colorClass = aiPlayer === 1 ? 'black' : 'white';
  statusEl.innerHTML = `${colorName} <span class="player ${colorClass}"></span> AI思考中...`;
  drawBoard();
  setTimeout(() => {
    const opp = aiPlayer === 1 ? 2 : 1;
    const candidates = getCandidates();
    for (const {r, c} of candidates) {
      board[r][c] = aiPlayer;
      if (checkWin(r, c, aiPlayer)) { board[r][c] = 0; applyAIMove(r, c); return; }
      board[r][c] = 0;
    }
    winLine = null;
    for (const {r, c} of candidates) {
      board[r][c] = opp;
      if (checkWin(r, c, opp)) { board[r][c] = 0; applyAIMove(r, c); return; }
      board[r][c] = 0;
    }
    winLine = null;
    let scored = candidates.map(m => {
      board[m.r][m.c] = aiPlayer;
      const s = evaluateBoard(aiPlayer);
      board[m.r][m.c] = 0;
      return {r: m.r, c: m.c, score: s};
    });
    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, AI_TOP_CANDIDATES);
    let bestScore = -Infinity, bestMoves = [];
    for (const {r, c} of top) {
      board[r][c] = aiPlayer;
      if (aiPlayer === 1 && forbiddenEnabled && isForbidden(r, c)) { board[r][c] = 0; continue; }
      const score = alphaBeta(AI_SEARCH_DEPTH, -Infinity, Infinity, opp, aiPlayer) + (Math.random() - 0.5) * 2;
      board[r][c] = 0;
      if (score > bestScore) { bestScore = score; bestMoves = [{r, c}]; }
      else if (Math.abs(score - bestScore) < 0.01) { bestMoves.push({r, c}); }
    }
    winLine = null;
    if (bestMoves.length === 0) bestMoves = [top[0] || candidates[0] || {r: 7, c: 7}];
    let bestMove = bestMoves[Math.floor(Math.random() * bestMoves.length)];
    applyAIMove(bestMove.r, bestMove.c);
  }, 50);
}

function applyAIMove(r, c) {
  aiThinking = false;
  winLine = null;
  board[r][c] = aiPlayer;
  moveHistory.push({r, c, player: aiPlayer});
  lastMoveR = r; lastMoveC = c;
  const aiName = aiPlayer === 1 ? '黑棋' : '白棋';
  const oppName = aiPlayer === 1 ? '白棋' : '黑棋';
  if (checkWin(r, c, aiPlayer)) {
    gameOver = true;
    drawBoard();
    showOverlay(`${aiName} 获胜!`, 'AI 取得胜利');
    return;
  }
  let draw = true;
  for (let rr = 0; rr < boardSize; rr++)
    for (let cc = 0; cc < boardSize; cc++)
      if (board[rr][cc] === 0) { draw = false; break; }
  if (draw) { gameOver = true; drawBoard(); showOverlay('平局', '棋盘已满'); return; }
  currentPlayer = humanPlayer;
  const oppClass = humanPlayer === 1 ? 'black' : 'white';
  statusEl.innerHTML = `${oppName} <span class="player ${oppClass}"></span> 落子`;
  drawBoard();
}

function handleClick(e) {
  if (gameOver || aiThinking) return;
  if (aiEnabled && currentPlayer !== humanPlayer) return;
  const rect = canvas.getBoundingClientRect();
  const scaleX = displaySize / rect.width;
  const scaleY = displaySize / rect.height;
  const px = (e.clientX - rect.left) * scaleX;
  const py = (e.clientY - rect.top) * scaleY;
  const intersection = getIntersection(px, py);
  if (!intersection) return;
  const {r, c} = intersection;
  if (board[r][c] !== 0) return;
  board[r][c] = currentPlayer;
  if (currentPlayer === 1 && isForbidden(r, c)) {
    board[r][c] = 0;
    statusEl.innerHTML = '⚫ <span style="color:#ff6666">禁手！黑棋不可落此位置</span>';
    return;
  }
  moveHistory.push({r, c, player: currentPlayer});
  lastMoveR = r; lastMoveC = c;
  if (checkWin(r, c, currentPlayer)) {
    gameOver = true;
    drawBoard();
    showOverlay(`${currentPlayer === 1 ? '黑棋' : '白棋'} 获胜!`, '');
    return;
  }
  let draw = true;
  for (let rr = 0; rr < boardSize; rr++)
    for (let cc = 0; cc < boardSize; cc++)
      if (board[rr][cc] === 0) { draw = false; break; }
  if (draw) { gameOver = true; drawBoard(); showOverlay('平局', '棋盘已满'); return; }
  if (aiEnabled) {
    currentPlayer = aiPlayer;
    drawBoard();
    aiMove();
  } else {
    currentPlayer = currentPlayer === 1 ? 2 : 1;
    statusEl.innerHTML = `${currentPlayer === 1 ? '黑棋' : '白棋'} <span class="player ${currentPlayer === 1 ? 'black' : 'white'}"></span> 落子`;
    drawBoard();
  }
}

function undoMove() {
  if (gameOver || aiThinking || moveHistory.length === 0) return;
  const lastMove = moveHistory[moveHistory.length - 1];
  const steps = aiEnabled ? (lastMove.player === humanPlayer ? 1 : 2) : 1;
  for (let i = 0; i < steps && moveHistory.length > 0; i++) {
    const m = moveHistory.pop();
    board[m.r][m.c] = 0;
  }
  winLine = null;
  if (moveHistory.length > 0) {
    const prev = moveHistory[moveHistory.length - 1];
    lastMoveR = prev.r; lastMoveC = prev.c;
  } else {
    lastMoveR = -1; lastMoveC = -1;
  }
  currentPlayer = aiEnabled ? humanPlayer : (moveHistory.length > 0 ? (moveHistory[moveHistory.length - 1].player === 1 ? 2 : 1) : 1);
  const aiText = aiEnabled ? ' (人机对战)' : '';
  const fbText = forbiddenEnabled ? ' (禁手开启)' : '';
  statusEl.innerHTML = `${currentPlayer === 1 ? '黑棋' : '白棋'} <span class="player ${currentPlayer === 1 ? 'black' : 'white'}"></span> ${currentPlayer === 1 ? '先行' : '落子'}` + fbText + aiText;
  drawBoard();
}

function newGame() {
  board = Array(boardSize).fill(null).map(() => Array(boardSize).fill(0));
  currentPlayer = 1;
  gameOver = false;
  winLine = null;
  lastMoveR = -1; lastMoveC = -1;
  moveHistory = [];
  aiThinking = false;
  document.getElementById('overlay').classList.add('hidden');
  forbiddenEnabled = btnForbidden.classList.contains('on');
  aiEnabled = btnAI.classList.contains('on');
  humanPlayer = btnColor.textContent === '执黑' ? 1 : 2;
  aiPlayer = humanPlayer === 1 ? 2 : 1;
  btnColor.textContent = humanPlayer === 1 ? '执黑' : '执白';
  const aiText = aiEnabled ? ' (人机对战)' : '';
  const fbText = forbiddenEnabled ? ' (禁手开启)' : '';
  statusEl.innerHTML = '黑棋 <span class="player black"></span> 先行' + fbText + aiText;
  drawBoard();
  if (aiEnabled && aiPlayer === 1) aiMove();
}

function showOverlay(title, msg) {
  document.getElementById('overlayTitle').textContent = title;
  document.getElementById('overlayMsg').textContent = msg;
  document.getElementById('overlay').classList.remove('hidden');
}

canvas.addEventListener('click', handleClick);
document.getElementById('btnRestart').addEventListener('click', newGame);
document.getElementById('btnUndo').addEventListener('click', undoMove);
document.getElementById('btnReplay').addEventListener('click', newGame);
document.getElementById('btnDismiss').addEventListener('click', () => {
  document.getElementById('overlay').classList.add('hidden');
});

btnForbidden.addEventListener('click', () => {
  btnForbidden.classList.toggle('on');
  forbiddenEnabled = btnForbidden.classList.contains('on');
  btnForbidden.textContent = forbiddenEnabled ? '禁手：开' : '禁手：关';
  if (!gameOver) {
    const aiText = aiEnabled ? ' (人机对战)' : '';
    const fbText = forbiddenEnabled ? ' (禁手开启)' : '';
    statusEl.innerHTML = `${currentPlayer === 1 ? '黑棋' : '白棋'} <span class="player ${currentPlayer === 1 ? 'black' : 'white'}"></span> ${currentPlayer === 1 ? '先行' : '落子'}` + fbText + aiText;
  }
});

btnAI.addEventListener('click', () => {
  btnAI.classList.toggle('on');
  aiEnabled = btnAI.classList.contains('on');
  btnAI.textContent = aiEnabled ? '人机对战' : '双人对战';
  newGame();
});

btnColor.addEventListener('click', () => {
  humanPlayer = humanPlayer === 1 ? 2 : 1;
  aiPlayer = humanPlayer === 1 ? 2 : 1;
  btnColor.textContent = humanPlayer === 1 ? '执黑' : '执白';
  newGame();
});

newGame();