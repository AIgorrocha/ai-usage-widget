'use strict'

const { test } = require('node:test')
const assert = require('node:assert/strict')
const { record, recommend } = require('../lib/history')

const DAY = 86400000
const src = (pct, start, end) => [{ key: 'claude', label: 'Claude', vm: { windows: [{ name: 'Semana', pct, startsAt: start, resetsAt: end }] } }]

test('historico: fecha a semana quando o reset muda e recomenda descer apos 3 semanas de sobra', () => {
  const hist = {}
  let t0 = Date.parse('2026-08-01T00:00:00Z')
  for (let wk = 0; wk < 3; wk++) {
    const start = t0 + wk * 7 * DAY, end = start + 7 * DAY
    record(hist, src(5, start, end), start + 3 * DAY)   // meio da semana, 5%
    record(hist, src(20, start, end), end - 3600000)     // fim da semana, 20% -> ritmo ~0.2
  }
  const start = t0 + 21 * DAY, end = start + 7 * DAY
  record(hist, src(3, start, end), start + DAY) // nova semana: fecha a terceira
  assert.equal(hist['claude|Semana'].weeks.length, 3)
  const reco = recommend(hist, src(3, start, end))
  assert.equal(reco[0].level, 'low')
  assert.match(reco[0].text, /pode descer/)
})

test('historico: uma semana estourando manda subir', () => {
  const hist = {}
  const start = Date.parse('2026-08-01T00:00:00Z'), end = start + 7 * DAY
  record(hist, src(90, start, end), start + 4 * DAY) // 90% com 57% da semana -> 1.57x
  const reco = recommend(hist, src(90, start, end))
  assert.equal(reco[0].level, 'bad')
  assert.match(reco[0].text, /suba o plano/)
})

test('historico: sem meia semana ainda, fica coletando', () => {
  const hist = {}
  const start = Date.parse('2026-08-01T00:00:00Z'), end = start + 7 * DAY
  record(hist, src(10, start, end), start + DAY)
  assert.equal(recommend(hist, src(10, start, end))[0].level, 'wait')
})

test('historico: jitter de segundos no reset nao fecha semana', () => {
  const hist = {}
  const start = Date.parse('2026-08-01T00:00:00Z'), end = start + 7 * DAY
  record(hist, src(10, start, end), start + 2 * DAY)
  record(hist, src(11, start, end + 800), start + 2 * DAY + 60000)
  assert.equal(hist['claude|Semana'].weeks.length, 0)
})
