import test from 'node:test'
import assert from 'node:assert/strict'

import {
  createInitialState,
  formatEntry,
  formatNumber,
  getDisplay,
  getExpression,
  getPendingOperator,
  reduce,
} from './calculator.ts'
import type {
  CalculatorAction,
  CalculatorState,
  Operator,
} from './calculator.ts'

function run(
  actions: CalculatorAction[],
  start: CalculatorState = createInitialState(),
): CalculatorState {
  return actions.reduce((state, action) => reduce(state, action), start)
}

const digit = (value: string | number): CalculatorAction => ({
  type: 'digit',
  value: String(value),
})
const digits = (value: string | number): CalculatorAction[] =>
  [...String(value)].map((character) => digit(character))
const dot = (): CalculatorAction => ({ type: 'dot' })
const equals = (): CalculatorAction => ({ type: 'equals' })
const clear = (): CalculatorAction => ({ type: 'clear' })
const backspace = (): CalculatorAction => ({ type: 'backspace' })
const percent = (): CalculatorAction => ({ type: 'percent' })
const toggleSign = (): CalculatorAction => ({ type: 'toggle-sign' })
const operator = (value: Operator): CalculatorAction => ({
  type: 'operator',
  value,
})

test('starts with a zero on the display', () => {
  const state = createInitialState()
  assert.equal(getDisplay(state), '0')
  assert.equal(getExpression(state), '')
})

test('collects digits and groups thousands', () => {
  const state = run(digits(1234567))
  assert.equal(getDisplay(state), '1,234,567')
})

test('ignores leading zeros and limits the input length', () => {
  assert.equal(getDisplay(run(digits('0005'))), '5')
  const state = run(digits('1'.repeat(20)))
  assert.equal(state.entry, '111111111111111')
})

test('accepts a single decimal point', () => {
  const state = run([digit(1), dot(), digit(2), dot(), digit(3)])
  assert.equal(state.entry, '1.23')
  assert.equal(getDisplay(run([dot(), digit(5)])), '0.5')
})

test('adds and shows the finished expression', () => {
  const state = run([...digits(12), operator('+'), ...digits(5), equals()])
  assert.equal(state.phase, 'evaluated')
  assert.equal(getDisplay(state), '17')
  assert.equal(getExpression(state), '12 + 5 =')
})

test('respects operator precedence', () => {
  const state = run([
    ...digits(2),
    operator('+'),
    ...digits(3),
    operator('*'),
    ...digits(4),
    equals(),
  ])
  assert.equal(getDisplay(state), '14')
  assert.equal(getExpression(state), '2 + 3 × 4 =')
})

test('evaluates operators of equal precedence left to right', () => {
  assert.equal(
    getDisplay(
      run([
        ...digits(8),
        operator('/'),
        ...digits(4),
        operator('/'),
        ...digits(2),
        equals(),
      ]),
    ),
    '1',
  )
  assert.equal(
    getDisplay(
      run([
        ...digits(10),
        operator('-'),
        ...digits(3),
        operator('-'),
        ...digits(2),
        equals(),
      ]),
    ),
    '5',
  )
})

test('replaces a pending operator when another one is pressed', () => {
  const state = run([...digits(5), operator('+'), operator('*'), ...digits(2)])
  assert.deepEqual(state.tokens, [5, '*'])
  assert.equal(getDisplay(run([equals()], state)), '10')
})

test('ignores equals while the expression is incomplete', () => {
  const state = run([...digits(5), operator('+'), equals()])
  assert.equal(state.phase, 'input')
  assert.equal(getDisplay(state), '5')
  assert.deepEqual(state.tokens, [5, '+'])
})

test('reports division by zero and starts over on the next digit', () => {
  const state = run([...digits(1), operator('/'), digit(0), equals()])
  assert.equal(state.phase, 'error')
  assert.equal(getDisplay(state), '错误')
  assert.equal(getExpression(state), '不能除以零')

  const restarted = reduce(state, digit(7))
  assert.equal(restarted.phase, 'input')
  assert.equal(getDisplay(restarted), '7')
})

test('normalizes floating point noise', () => {
  const state = run([
    dot(),
    digit(1),
    operator('+'),
    dot(),
    digit(2),
    equals(),
  ])
  assert.equal(getDisplay(state), '0.3')
})

test('shows negative operands in parentheses', () => {
  const state = run([
    ...digits(5),
    operator('+'),
    ...digits(3),
    toggleSign(),
    equals(),
  ])
  assert.equal(getDisplay(state), '2')
  assert.equal(getExpression(state), '5 + (-3) =')
})

test('toggles the sign of the current entry and of a result', () => {
  assert.equal(getDisplay(run([...digits(12), toggleSign()])), '-12')
  assert.equal(
    getDisplay(run([...digits(12), toggleSign(), toggleSign()])),
    '12',
  )
  assert.equal(getDisplay(run([digit(0), toggleSign()])), '0')

  const evaluated = run([...digits(5), operator('+'), ...digits(4), equals()])
  const negated = reduce(evaluated, toggleSign())
  assert.equal(negated.phase, 'input')
  assert.equal(getDisplay(negated), '-9')
  assert.equal(getDisplay(reduce(negated, operator('+'))), '-9')
})

test('turns percentages into hundredths', () => {
  const state = run([...digits(50), percent()])
  assert.equal(getDisplay(state), '0.5')
  assert.equal(
    getDisplay(run([operator('+'), digit(2), equals()], state)),
    '2.5',
  )

  const evaluated = run([...digits(1), operator('/'), ...digits(4), equals()])
  assert.equal(getDisplay(reduce(evaluated, percent())), '0.0025')
})

test('backspace removes digits, signs, and pending operators', () => {
  assert.equal(getDisplay(run([...digits(123), backspace()])), '12')
  assert.equal(getDisplay(run([digit(7), backspace()])), '0')
  assert.equal(
    getDisplay(run([...digits(8), toggleSign(), backspace()])),
    '0',
  )

  const undone = run([...digits(5), operator('+'), backspace()])
  assert.deepEqual(undone.tokens, [])
  assert.equal(undone.entry, '5')
  assert.equal(getDisplay(run([digit(3)], undone)), '53')
})

test('clear returns to the initial state', () => {
  const state = run([
    ...digits(12),
    operator('*'),
    ...digits(3),
    equals(),
    clear(),
  ])
  assert.deepEqual(state, createInitialState())
})

test('continues calculating from a result', () => {
  const state = run([
    ...digits(2),
    operator('+'),
    ...digits(3),
    equals(),
    operator('*'),
    ...digits(4),
    equals(),
  ])
  assert.equal(getDisplay(state), '20')
  assert.equal(getExpression(state), '5 × 4 =')
})

test('starts a new calculation when a digit is pressed after equals', () => {
  const state = run([
    ...digits(2),
    operator('+'),
    ...digits(3),
    equals(),
    digit(7),
  ])
  assert.equal(state.phase, 'input')
  assert.equal(getDisplay(state), '7')
  assert.equal(getExpression(state), '')
})

test('loads a stored value as the current result', () => {
  const loaded = reduce(createInitialState(), { type: 'load', value: 48 })
  assert.equal(getDisplay(loaded), '48')
  assert.equal(loaded.phase, 'evaluated')

  const state = run([operator('+'), digit(2), equals()], loaded)
  assert.equal(getDisplay(state), '50')
  assert.equal(getExpression(state), '48 + 2 =')
})

test('shows pending operators', () => {
  assert.equal(
    getPendingOperator(run([...digits(5), operator('+')])),
    '+',
  )
  assert.equal(
    getPendingOperator(run([...digits(5), operator('+'), digit(3)])),
    '+',
  )
  assert.equal(
    getPendingOperator(
      run([...digits(5), operator('+'), digit(3), equals()]),
    ),
    null,
  )
})

test('formats number display edge cases', () => {
  assert.equal(formatNumber(0), '0')
  assert.equal(formatNumber(-0), '0')
  assert.equal(formatNumber(1234.5), '1,234.5')
  assert.equal(formatNumber(0.000000001), '0.000000001')
  assert.equal(formatNumber(0.0000000001), '1e-10')
  assert.equal(formatNumber(1234567890123), '1.234568e12')
  assert.equal(formatEntry('1234.'), '1,234.')
  assert.equal(formatEntry('-1234567.25'), '-1,234,567.25')
})

test('ignores repeated equals presses', () => {
  const evaluated = run([
    ...digits(2),
    operator('+'),
    ...digits(3),
    equals(),
  ])
  const repeated = reduce(evaluated, equals())
  assert.deepEqual(repeated, evaluated)
})

test('ignores unknown actions', () => {
  const state = createInitialState()
  const unknownAction = { type: 'nope' } as unknown as CalculatorAction
  assert.equal(reduce(state, unknownAction), state)
})
