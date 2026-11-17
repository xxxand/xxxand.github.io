export type Operator = '+' | '-' | '*' | '/'
export type Phase = 'input' | 'evaluated' | 'error'
export type Token = number | Operator

export type CalculatorAction =
  | { type: 'digit'; value: string }
  | { type: 'dot' }
  | { type: 'toggle-sign' }
  | { type: 'percent' }
  | { type: 'backspace' }
  | { type: 'clear' }
  | { type: 'operator'; value: Operator }
  | { type: 'equals' }
  | { type: 'load'; value: number }

export interface CalculatorState {
  tokens: Token[]
  entry: string
  phase: Phase
  result: number | null
  expression: string | null
  error: string | null
}

const OPERATORS: ReadonlySet<string> = new Set(['+', '-', '*', '/'])
const SYMBOLS: Record<Operator, string> = {
  '+': '+',
  '-': '−',
  '*': '×',
  '/': '÷',
}
const MAX_INPUT_DIGITS = 15
const PRECISION = 12

const numberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 12,
  useGrouping: true,
})

export class CalculatorError extends Error {}

export function createInitialState(): CalculatorState {
  return {
    tokens: [],
    entry: '',
    phase: 'input',
    result: null,
    expression: null,
    error: null,
  }
}

export function isOperator(value: unknown): value is Operator {
  return typeof value === 'string' && OPERATORS.has(value)
}

function normalize(value: number): number {
  if (!Number.isFinite(value)) return value
  const rounded = Number(value.toPrecision(PRECISION))
  return Object.is(rounded, -0) ? 0 : rounded
}

function toEntry(value: number): string {
  return Object.is(value, -0) ? '0' : String(value)
}

function countDigits(entry: string): number {
  return entry.replace(/[-.]/g, '').length
}

function symbolFor(operator: Operator): string {
  return SYMBOLS[operator]
}

export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '错误'
  if (Object.is(value, -0) || value === 0) return '0'

  const absolute = Math.abs(value)
  if (absolute >= 1e12 || absolute < 1e-9) {
    return value
      .toExponential(6)
      .replace(/\.?0+e/, 'e')
      .replace('e+', 'e')
  }

  return numberFormatter.format(value)
}

export function formatEntry(entry: string): string {
  if (!entry) return '0'
  if (entry.includes('e') || entry.includes('E')) {
    return formatNumber(Number(entry))
  }

  const negative = entry.startsWith('-')
  const unsigned = negative ? entry.slice(1) : entry
  const [whole, fraction] = unsigned.split('.')
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const dot = unsigned.includes('.') ? '.' : ''

  return `${negative ? '-' : ''}${grouped}${dot}${fraction ?? ''}`
}

function formatOperand(
  value: number,
  index: number,
  useParentheses = true,
): string {
  const text = formatNumber(value)
  return useParentheses && value < 0 && index > 0 ? `(${text})` : text
}

function formatTokens(tokens: Token[]): string {
  return tokens
    .map((token, index) =>
      typeof token === 'number' ? formatOperand(token, index) : symbolFor(token),
    )
    .join(' ')
}

export function getDisplay(state: CalculatorState): string {
  if (state.phase === 'error') return '错误'
  if (state.entry !== '') return formatEntry(state.entry)
  if (state.phase === 'evaluated' && state.result !== null) {
    return formatNumber(state.result)
  }

  for (let index = state.tokens.length - 1; index >= 0; index -= 1) {
    const token = state.tokens[index]
    if (typeof token === 'number') {
      return formatNumber(token)
    }
  }

  return '0'
}

export function getExpression(state: CalculatorState): string {
  if (state.phase === 'error') return state.error ?? ''
  if (state.phase === 'evaluated') return state.expression ?? ''
  if (state.tokens.length === 0) return ''

  const parts = state.tokens.map((token, index) =>
    typeof token === 'number'
      ? formatOperand(token, index)
      : symbolFor(token),
  )

  if (state.entry !== '') {
    const entry = formatEntry(state.entry)
    parts.push(
      state.entry.startsWith('-') && parts.length > 0 ? `(${entry})` : entry,
    )
  }

  return parts.join(' ')
}

export function getPendingOperator(state: CalculatorState): Operator | null {
  if (state.phase !== 'input') return null
  const last = state.tokens[state.tokens.length - 1]
  return isOperator(last) ? last : null
}

function precedence(operator: Operator): number {
  return operator === '*' || operator === '/' ? 2 : 1
}

function applyTop(values: number[], operators: Operator[]): void {
  const operator = operators.pop()
  const right = values.pop()
  const left = values.pop()

  if (operator === undefined || left === undefined || right === undefined) {
    throw new CalculatorError('无法计算')
  }

  let value: number
  switch (operator) {
    case '+':
      value = left + right
      break
    case '-':
      value = left - right
      break
    case '*':
      value = left * right
      break
    case '/':
      if (right === 0) throw new CalculatorError('不能除以零')
      value = left / right
      break
    default:
      throw new CalculatorError('无法计算')
  }

  if (!Number.isFinite(value)) {
    throw new CalculatorError('结果超出可计算范围')
  }

  values.push(value)
}

function evaluateTokens(tokens: Token[]): number {
  const values: number[] = []
  const operators: Operator[] = []

  for (const token of tokens) {
    if (typeof token === 'number') {
      values.push(token)
      continue
    }

    while (
      operators.length > 0 &&
      precedence(operators[operators.length - 1]) >= precedence(token)
    ) {
      applyTop(values, operators)
    }
    operators.push(token)
  }

  while (operators.length > 0) {
    applyTop(values, operators)
  }

  if (values.length !== 1) {
    throw new CalculatorError('无法计算')
  }

  return values[0]
}

function inputDigit(state: CalculatorState, value: string): CalculatorState {
  if (!/^[0-9]$/.test(value)) return state

  if (
    state.phase === 'error' ||
    state.phase === 'evaluated' ||
    state.entry.includes('e')
  ) {
    return { ...createInitialState(), entry: value }
  }

  if (state.entry === '') {
    return { ...state, entry: value }
  }
  if (state.entry === '0') {
    return { ...state, entry: value }
  }
  if (state.entry === '-0') {
    return { ...state, entry: `-${value}` }
  }
  if (countDigits(state.entry) >= MAX_INPUT_DIGITS) {
    return state
  }

  return { ...state, entry: `${state.entry}${value}` }
}

function inputDot(state: CalculatorState): CalculatorState {
  if (
    state.phase === 'error' ||
    state.phase === 'evaluated' ||
    state.entry.includes('e')
  ) {
    return { ...createInitialState(), entry: '0.' }
  }
  if (state.entry === '') {
    return { ...state, entry: '0.' }
  }
  if (state.entry.includes('.')) {
    return state
  }

  return { ...state, entry: `${state.entry}.` }
}

function toggleSign(state: CalculatorState): CalculatorState {
  if (state.phase === 'error') return state

  if (state.entry !== '') {
    if (state.entry === '0') return state
    const entry = state.entry.startsWith('-')
      ? state.entry.slice(1)
      : `-${state.entry}`
    return { ...state, entry }
  }

  if (state.phase === 'evaluated' && state.result !== null) {
    const value = state.result === 0 ? 0 : -state.result
    return { ...createInitialState(), entry: toEntry(value) }
  }

  return state
}

function percent(state: CalculatorState): CalculatorState {
  if (state.phase === 'error') return state

  let value: number
  if (state.entry !== '') {
    value = Number(state.entry)
  } else if (state.phase === 'evaluated' && state.result !== null) {
    value = state.result
  } else {
    return state
  }

  const next = normalize(value / 100)
  if (!Number.isFinite(next)) {
    return {
      ...state,
      phase: 'error',
      result: null,
      expression: null,
      error: '结果超出可计算范围',
    }
  }

  return {
    ...state,
    entry: toEntry(next),
    phase: 'input',
    result: null,
    expression: null,
  }
}

function backspace(state: CalculatorState): CalculatorState {
  if (state.phase !== 'input') return state

  if (state.entry !== '') {
    if (state.entry.length <= 1) {
      return { ...state, entry: '0' }
    }

    let entry = state.entry.slice(0, -1)
    if (entry === '-' || entry === '-0') entry = '0'
    return { ...state, entry }
  }

  const last = state.tokens[state.tokens.length - 1]
  if (isOperator(last)) {
    const tokens = state.tokens.slice(0, -1)
    const previous = tokens[tokens.length - 1]
    if (typeof previous === 'number') {
      tokens.pop()
      return { ...state, tokens, entry: toEntry(previous) }
    }
    return { ...state, tokens }
  }

  return state
}

function chooseOperator(
  state: CalculatorState,
  operator: Operator,
): CalculatorState {
  if (state.phase === 'error') return state

  if (state.entry !== '') {
    return {
      ...state,
      tokens: [...state.tokens, Number(state.entry), operator],
      entry: '',
      phase: 'input',
      expression: null,
    }
  }

  if (state.phase === 'evaluated' && state.result !== null) {
    return { ...createInitialState(), tokens: [state.result, operator] }
  }

  const tokens = [...state.tokens]
  if (tokens.length === 0) {
    return { ...state, tokens: [0, operator] }
  }

  const last = tokens[tokens.length - 1]
  if (isOperator(last)) {
    tokens[tokens.length - 1] = operator
    return { ...state, tokens }
  }

  return { ...state, tokens: [...tokens, operator] }
}

function equals(state: CalculatorState): CalculatorState {
  if (state.phase === 'error') return state

  const tokens: Token[] = [...state.tokens]
  if (state.entry !== '') {
    tokens.push(Number(state.entry))
  }

  if (tokens.length === 0 || typeof tokens[tokens.length - 1] === 'string') {
    return state
  }

  try {
    const value = normalize(evaluateTokens(tokens))
    if (!Number.isFinite(value)) {
      throw new CalculatorError('结果超出可计算范围')
    }

    return {
      ...createInitialState(),
      phase: 'evaluated',
      result: value,
      expression: `${formatTokens(tokens)} =`,
    }
  } catch (error) {
    return {
      ...createInitialState(),
      phase: 'error',
      error: error instanceof CalculatorError ? error.message : '无法计算',
    }
  }
}

function loadValue(state: CalculatorState, value: number): CalculatorState {
  if (!Number.isFinite(value)) return state

  return {
    ...createInitialState(),
    phase: 'evaluated',
    result: normalize(value),
  }
}

export function reduce(
  state: CalculatorState,
  action: CalculatorAction,
): CalculatorState {
  switch (action.type) {
    case 'digit':
      return inputDigit(state, String(action.value))
    case 'dot':
      return inputDot(state)
    case 'toggle-sign':
      return toggleSign(state)
    case 'percent':
      return percent(state)
    case 'backspace':
      return backspace(state)
    case 'clear':
      return createInitialState()
    case 'operator':
      return chooseOperator(state, action.value)
    case 'equals':
      return equals(state)
    case 'load':
      return loadValue(state, action.value)
    default:
      return state
  }
}
