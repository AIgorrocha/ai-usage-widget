'use strict'

// Historico semanal por janela (fonte + nome). Cada vez que o reset muda, a
// semana anterior e fechada com o % final e o ritmo. Guarda ate 12 semanas.
// A recomendacao sai daqui: semanas fechadas pesam mais que a semana corrente.

const fs = require('node:fs')

const MAX_WEEKS = 12
const LOW = 0.45   // abaixo: sobra
const HIGH = 1.15  // acima: estoura

function ratioOf (pct, startsAt, resetsAt, now) {
  if (pct == null || !startsAt || !resetsAt) return null
  const el = Math.min(1, Math.max(0.02, (now - startsAt) / (resetsAt - startsAt)))
  return { elapsed: el, ratio: pct / (el * 100) }
}

function verdict (ratio) {
  if (ratio == null) return null
  return ratio > HIGH ? 'bad' : ratio < LOW ? 'low' : 'ok'
}

function load (file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')) } catch { return {} }
}

function save (file, hist) {
  try { fs.writeFileSync(file, JSON.stringify(hist)) } catch { /* historico nao e critico */ }
}

// sources: [{key, label, vm}] ; hist: {"<key>|<window>": {weeks:[{resetsAt,pct,ratio}], current:{...}}}
// Devolve true se algo mudou (para o chamador decidir se grava).
function record (hist, sources, now = Date.now()) {
  let changed = false
  for (const s of sources) {
    for (const w of (s.vm && s.vm.windows) || []) {
      if (!w.resetsAt || !w.startsAt) continue
      const k = `${s.key}|${w.name}`
      const e = hist[k] || (hist[k] = { weeks: [], current: null })
      const r = ratioOf(w.pct, w.startsAt, w.resetsAt, now)
      // A API devolve o reset com jitter de segundos: so e semana nova se andou mais de 1 h pra frente.
      if (e.current && w.resetsAt - e.current.resetsAt > 3600000) {
        // reset aconteceu: fecha a semana anterior com o ultimo valor visto
        e.weeks.push({ resetsAt: e.current.resetsAt, pct: e.current.pct, ratio: e.current.ratio })
        if (e.weeks.length > MAX_WEEKS) e.weeks.shift()
        e.current = null
        changed = true
      }
      const cur = { resetsAt: e.current ? e.current.resetsAt : w.resetsAt, pct: w.pct, ratio: r ? +r.ratio.toFixed(2) : null, elapsed: r ? +r.elapsed.toFixed(2) : null }
      if (!e.current || e.current.pct !== cur.pct || e.current.ratio !== cur.ratio) { e.current = cur; changed = true }
    }
  }
  return changed
}

// Uma recomendacao por fonte. Olha ate 3 semanas fechadas mais a corrente (esta
// so conta depois de metade da semana). Pior janela da fonte manda.
function recommend (hist, sources) {
  const out = []
  for (const s of sources) {
    const entries = Object.entries(hist).filter(([k]) => k.startsWith(s.key + '|'))
    if (!entries.length) continue
    let worst = null // {level, weeksSeen, votes}
    for (const [, e] of entries) {
      const samples = e.weeks.slice(-3).map(w => w.ratio).filter(r => r != null)
      if (e.current && e.current.elapsed >= 0.5 && e.current.ratio != null) samples.push(e.current.ratio)
      if (!samples.length) continue
      const v = samples.map(verdict)
      const bad = v.filter(x => x === 'bad').length
      const low = v.filter(x => x === 'low').length
      const level = bad >= 1 ? 'bad' : low === samples.length ? 'low' : 'ok'
      const rank = { bad: 3, ok: 2, low: 1 }
      if (!worst || rank[level] > rank[worst.level]) worst = { level, samples: samples.length, closed: e.weeks.length, bad, low }
    }
    if (!worst) { out.push({ key: s.key, label: s.label, level: 'wait', text: 'coletando a primeira semana' }); continue }
    const n = worst.samples
    const weeks = n === 1 ? '1 semana' : `${n} semanas`
    let text
    if (worst.level === 'bad') text = `estourou em ${worst.bad} de ${weeks}: suba o plano ou mova volume para outra ferramenta`
    else if (worst.level === 'low') text = worst.closed >= 3 ? `sobrou em ${weeks} seguidas: pode descer o plano` : `sobrando (${weeks}): se seguir assim por 3 a 4 semanas, desça o plano`
    else text = `no ritmo em ${weeks}: mantenha o plano`
    out.push({ key: s.key, label: s.label, level: worst.level, text, plan: s.plan })
  }
  return out
}

module.exports = { record, recommend, load, save, ratioOf, verdict, LOW, HIGH }
