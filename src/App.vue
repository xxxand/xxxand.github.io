<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  createInitialState,
  formatNumber,
  getDisplay,
  getExpression,
  getPendingOperator,
  isOperator,
  reduce,
} from './calculator.js'

const STORAGE_KEY = 'xxxand-calculator-history'
const HISTORY_LIMIT = 30

const calculator = ref(createInitialState())
const history = ref(readHistory())

const display = computed(() => getDisplay(calculator.value))
const expression = computed(() => getExpression(calculator.value))
const pendingOperator = computed(() => getPendingOperator(calculator.value))
const isError = computed(() => calculator.value.phase === 'error')

const displayClasses = computed(() => {
  const length = display.value.length
  return {
    'result--error': isError.value,
    'result--compact': !isError.value && length > 9 && length <= 13,
    'result--dense': !isError.value && length > 13 && length <= 17,
    'result--tiny': !isError.value && length > 17,
  }
})

const announcement = computed(() => {
  if (isError.value) {
    return `错误：${calculator.value.error ?? '无法计算'}`
  }
  if (calculator.value.phase === 'evaluated') {
    return `结果 ${display.value}`
  }
  return ''
})

const keys = [
  { label: 'AC', aria: '全部清除', action: { type: 'clear' }, variant: 'secondary' },
  { label: '±', aria: '切换正负号', action: { type: 'toggle-sign' }, variant: 'secondary' },
  { label: '%', aria: '百分比', action: { type: 'percent' }, variant: 'secondary' },
  { label: '÷', aria: '除', action: { type: 'operator', value: '/' }, variant: 'operator', operator: '/' },
  { label: '7', aria: '七', action: { type: 'digit', value: '7' } },
  { label: '8', aria: '八', action: { type: 'digit', value: '8' } },
  { label: '9', aria: '九', action: { type: 'digit', value: '9' } },
  { label: '×', aria: '乘', action: { type: 'operator', value: '*' }, variant: 'operator', operator: '*' },
  { label: '4', aria: '四', action: { type: 'digit', value: '4' } },
  { label: '5', aria: '五', action: { type: 'digit', value: '5' } },
  { label: '6', aria: '六', action: { type: 'digit', value: '6' } },
  { label: '−', aria: '减', action: { type: 'operator', value: '-' }, variant: 'operator', operator: '-' },
  { label: '1', aria: '一', action: { type: 'digit', value: '1' } },
  { label: '2', aria: '二', action: { type: 'digit', value: '2' } },
  { label: '3', aria: '三', action: { type: 'digit', value: '3' } },
  { label: '+', aria: '加', action: { type: 'operator', value: '+' }, variant: 'operator', operator: '+' },
  { label: '0', aria: '零', action: { type: 'digit', value: '0' }, wide: true },
  { label: '.', aria: '小数点', action: { type: 'dot' } },
  { label: '=', aria: '计算结果', variant: 'equals', equals: true },
]

function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function readHistory() {
  if (typeof localStorage === 'undefined') return []

  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    if (!Array.isArray(stored)) return []

    return stored
      .filter(
        (item) =>
          item &&
          typeof item.expression === 'string' &&
          Number.isFinite(item.value),
      )
      .slice(0, HISTORY_LIMIT)
      .map((item) => ({
        id: typeof item.id === 'string' ? item.id : createId(),
        expression: item.expression,
        value: item.value,
      }))
  } catch {
    return []
  }
}

function saveHistory() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history.value))
  } catch {
    // 无法写入本地存储时，历史记录仍保留在当前页面中。
  }
}

function releasePointerFocus(event) {
  if (event?.detail > 0) event.currentTarget.blur()
}

function pressKey(key, event) {
  if (key.equals) {
    calculate()
  } else {
    calculator.value = reduce(calculator.value, key.action)
  }
  releasePointerFocus(event)
}

function pressBackspace(event) {
  calculator.value = reduce(calculator.value, { type: 'backspace' })
  releasePointerFocus(event)
}

function calculate() {
  const before = calculator.value
  const next = reduce(before, { type: 'equals' })
  calculator.value = next

  const hasOperator = before.tokens.some((token) => isOperator(token))
  if (
    before.phase === 'input' &&
    hasOperator &&
    next.phase === 'evaluated' &&
    next.expression
  ) {
    history.value = [
      {
        id: createId(),
        expression: next.expression.replace(/\s*=$/, ''),
        value: next.result,
      },
      ...history.value,
    ].slice(0, HISTORY_LIMIT)
    saveHistory()
  }
}

function loadHistoryItem(item, event) {
  calculator.value = reduce(calculator.value, { type: 'load', value: item.value })
  releasePointerFocus(event)
}

function clearHistory() {
  history.value = []
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // 忽略无法访问本地存储的情况。
  }
}

function handleKeydown(event) {
  if (event.ctrlKey || event.metaKey || event.altKey) return

  const key = event.key

  if (/^[0-9]$/.test(key)) {
    event.preventDefault()
    calculator.value = reduce(calculator.value, { type: 'digit', value: key })
    return
  }

  if (key === '+' || key === '-' || key === '*' || key === '/') {
    event.preventDefault()
    calculator.value = reduce(calculator.value, { type: 'operator', value: key })
    return
  }

  switch (key) {
    case 'x':
    case 'X':
      event.preventDefault()
      calculator.value = reduce(calculator.value, { type: 'operator', value: '*' })
      break
    case '.':
    case ',':
      event.preventDefault()
      calculator.value = reduce(calculator.value, { type: 'dot' })
      break
    case '%':
      event.preventDefault()
      calculator.value = reduce(calculator.value, { type: 'percent' })
      break
    case 'Backspace':
      event.preventDefault()
      calculator.value = reduce(calculator.value, { type: 'backspace' })
      break
    case 'Escape':
      event.preventDefault()
      calculator.value = reduce(calculator.value, { type: 'clear' })
      break
    case 'Enter':
    case '=':
      if (
        key === 'Enter' &&
        document.activeElement instanceof HTMLElement &&
        document.activeElement.tagName === 'BUTTON'
      ) {
        return
      }
      event.preventDefault()
      calculate()
      break
    default:
      break
  }
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', handleKeydown))
</script>

<template>
  <div class="page">
    <header class="masthead">
      <div class="brand">
        <svg class="brand-mark" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <rect width="24" height="24" fill="#1c211c" />
          <rect x="4" y="4" width="7" height="7" fill="#f7f7f2" />
          <rect x="13" y="4" width="7" height="7" fill="#f7f7f2" />
          <rect x="4" y="13" width="7" height="7" fill="#f7f7f2" />
          <rect x="13" y="13" width="7" height="7" fill="#f2d024" />
        </svg>
        <h1>计算器</h1>
      </div>
      <p class="masthead-note">无需联网，记录只存本机</p>
    </header>

    <main class="sheet">
      <section class="calculator" aria-label="计算器">
        <div class="readout">
          <div class="readout-meta">
            <button
              class="backspace"
              type="button"
              aria-label="退格"
              :disabled="calculator.phase !== 'input'"
              @click="pressBackspace"
            >
              退格
            </button>
            <p
              class="expression"
              :class="{ 'expression--error': isError }"
              :title="expression"
            >
              {{ expression }}
            </p>
          </div>

          <output
            class="result"
            :class="displayClasses"
          >
            {{ display }}
          </output>
          <p class="visually-hidden" aria-live="polite" aria-atomic="true">
            {{ announcement }}
          </p>
        </div>

        <div class="keypad" role="group" aria-label="计算器按键">
          <button
            v-for="key in keys"
            :key="key.label"
            class="key"
            :class="[
              key.variant ? `key--${key.variant}` : '',
              {
                'key--wide': key.wide,
                'key--pending': key.operator && pendingOperator === key.operator,
              },
            ]"
            type="button"
            :aria-label="key.aria"
            :aria-pressed="key.operator ? pendingOperator === key.operator : undefined"
            @click="pressKey(key, $event)"
          >
            {{ key.label }}
          </button>
        </div>
      </section>

      <aside class="history" aria-labelledby="history-title">
        <div class="history-header">
          <h2 id="history-title" class="history-title">历史</h2>
          <button
            v-if="history.length > 0"
            class="history-clear"
            type="button"
            @click="clearHistory"
          >
            清空
          </button>
        </div>

        <ol v-if="history.length > 0" class="history-list">
          <li v-for="item in history" :key="item.id">
            <button
              class="history-item"
              type="button"
              :aria-label="`载入结果 ${formatNumber(item.value)}，来自 ${item.expression}`"
              title="载入结果"
              @click="loadHistoryItem(item, $event)"
            >
              <span class="history-expression">{{ item.expression }}</span>
              <span class="history-value">{{ formatNumber(item.value) }}</span>
            </button>
          </li>
        </ol>

        <div v-else class="history-empty">
          <p class="history-empty-title">还没有计算</p>
          <p class="history-empty-copy">完成一次计算后，结果会留在这里。</p>
        </div>

        <p class="history-note">
          {{ history.length > 0 ? '点击记录可载入结果' : '记录只保存在本机浏览器' }}
        </p>
      </aside>
    </main>

    <footer class="page-footer">
      <p class="footer-help">键盘输入，Enter 求值，Esc 清除。</p>
      <p>xxxand.github.io</p>
    </footer>
  </div>
</template>
