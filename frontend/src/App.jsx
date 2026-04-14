import React, { useState, useRef, useEffect } from 'react'

const API = "https://talentmatch-portal.onrender.com"
async function req(path, opts = {}) {
  const res = await fetch(`${API}${path}`, opts)
  if (!res.ok) { const e = await res.json().catch(() => ({ detail: res.statusText })); throw new Error(e.detail || 'Request failed') }
  return res.json()
}

const MODES = [
  { id: 'product', label: 'Product company', desc: 'Exact skills matter most' },
  { id: 'ai',      label: 'AI startup',      desc: 'Semantic understanding first' },
  { id: 'fresher', label: 'Fresher hiring',  desc: 'Potential over pedigree' },
  { id: 'default', label: 'General',         desc: 'Balanced approach' },
]
const TOP_K_OPTIONS = [
  { v: 10,  label: 'Top 10',  desc: 'Shortlist' },
  { v: 20,  label: 'Top 20',  desc: 'Standard' },
  { v: 50,  label: 'Top 50',  desc: 'Extended' },
  { v: 100, label: 'All',     desc: 'Full list' },
]

const font = "'Sora', -apple-system, sans-serif"

// Single neutral palette — no red/green/yellow
const scoreColor = score => {
  const s = Math.round(score * 100)
  if (s >= 65) return { text: '#1a1a1a', bg: '#f0ede8', border: '#d4d0c8', accent: '#1a1a1a', label: 'Strong' }
  if (s >= 40) return { text: '#555',    bg: '#f5f3ef', border: '#ddd9d2', accent: '#777',    label: 'Moderate' }
  return             { text: '#999',    bg: '#faf9f7', border: '#e8e4de', accent: '#bbb',    label: 'Weak' }
}
/* ── Global styles ─────────────────────────────────────────────────────── */
const FontLink = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: ${font}; background: #f8f7f4; }
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #ddd9d2; border-radius: 4px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes shimmer {
      0%   { background-position: -600px 0; }
      100% { background-position:  600px 0; }
    }
    @keyframes fadeSlide {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .shimmer {
      background: linear-gradient(90deg, #eeebe6 25%, #e4e0da 50%, #eeebe6 75%);
      background-size: 600px 100%;
      animation: shimmer 1.5s infinite linear;
      border-radius: 5px;
    }
    .fade-slide { animation: fadeSlide 0.25s ease forwards; }
    .row-hover:hover { background: #faf8f5 !important; }
  `}</style>
)

/* ── Loading steps ─────────────────────────────────────────────────────── */
const LOAD_STEPS = [
  'Parsing job description…',
  'Indexing candidate profiles…',
  'Running keyword analysis…',
  'Computing semantic matches…',
  'Scoring across all four modes…',
  'Ranking candidates…',
]

function LoadingScreen() {
  const [step, setStep] = useState(0)
  const pcts = [18, 38, 55, 70, 85, 96]
  useEffect(() => {
    const t = setInterval(() => setStep(s => Math.min(s + 1, LOAD_STEPS.length - 1)), 950)
    return () => clearInterval(t)
  }, [])
  const pct = pcts[step]
  const circ = 2 * Math.PI * 30

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: font, background: '#f8f7f4' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #e8e4de', height: 52, padding: '0 20px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        <Logo />
      </div>
      <div style={{ background: '#fff', borderBottom: '1px solid #e8e4de', display: 'flex', flexShrink: 0 }}>
        {MODES.map((m, i) => (
          <div key={m.id} style={{ flex: 1, padding: '10px 8px', textAlign: 'center', borderBottom: `2px solid ${i === 3 ? '#1a1a1a' : 'transparent'}` }}>
            <div style={{ fontSize: '0.79rem', color: i === 3 ? '#1a1a1a' : '#ccc', fontWeight: i === 3 ? 600 : 400 }}>{m.label}</div>
            <div className="shimmer" style={{ height: 7, width: 36, margin: '6px auto 0', borderRadius: 3 }} />
          </div>
        ))}
      </div>
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ width: 288, borderRight: '1px solid #e8e4de', background: '#fff', flexShrink: 0 }}>
          <div style={{ padding: '10px 16px', borderBottom: '1px solid #f5f3ef' }}>
            <div className="shimmer" style={{ height: 7, width: 120 }} />
          </div>
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} style={{ padding: '13px 16px', borderBottom: '1px solid #f5f3ef', display: 'flex', alignItems: 'center', gap: 11 }}>
              <div className="shimmer" style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="shimmer" style={{ height: 9, width: `${50 + (i % 5) * 12}%`, marginBottom: 9 }} />
                <div style={{ display: 'flex', gap: 5 }}>
                  {[40, 32, 36].map((w, j) => <div key={j} className="shimmer" style={{ height: 6, width: w, borderRadius: 20 }} />)}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
          <div style={{ position: 'relative', width: 76, height: 76 }}>
            <svg width="76" height="76" viewBox="0 0 76 76">
              <circle cx="38" cy="38" r="30" fill="none" stroke="#eeebe6" strokeWidth="5" />
              <circle cx="38" cy="38" r="30" fill="none" stroke="#1a1a1a" strokeWidth="5"
                strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)}
                strokeLinecap="round" transform="rotate(-90 38 38)"
                style={{ transition: 'stroke-dashoffset 0.75s ease' }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 700, color: '#1a1a1a' }}>
              {pct}%
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1a1a1a', marginBottom: 7 }}>Analyzing candidates</div>
            <div style={{ fontSize: '0.75rem', color: '#aaa', minHeight: 18 }}>{LOAD_STEPS[step]}</div>
          </div>
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            {LOAD_STEPS.map((_, i) => (
              <div key={i} style={{ height: 5, borderRadius: 3, width: i <= step ? 20 : 5, background: i <= step ? '#1a1a1a' : '#ddd9d2', transition: 'all 0.4s ease' }} />
            ))}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#ccc' }}>Running 4 scoring modes in parallel</div>
        </div>
      </div>
    </div>
  )
}

/* ── Shared components ─────────────────────────────────────────────────── */
function Tag({ children, type = 'neutral' }) {
  const map = {
    matched: { bg: '#f0ede8', border: '#d4d0c8', color: '#1a1a1a' },
    missing: { bg: '#faf9f7', border: '#e8e4de', color: '#999' },
    bridge:  { bg: '#f5f3ef', border: '#ddd9d2', color: '#555' },
    neutral: { bg: '#f5f3ef', border: '#ddd9d2', color: '#555' },
  }
  const s = map[type] || map.neutral
  return (
    <span style={{ display: 'inline-block', padding: '3px 9px', borderRadius: 20, fontSize: '0.7rem', background: s.bg, border: `1px solid ${s.border}`, color: s.color, margin: '2px 3px 2px 0', fontWeight: 500 }}>
      {children}
    </span>
  )
}

// Monochrome score ring — no green/yellow/red
function ScoreRing({ score, size = 52 }) {
  const sc = scoreColor(score)
  const r  = (size - 6) / 2
  const circ = 2 * Math.PI * r
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#eeebe6" strokeWidth="3.5" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={sc.accent} strokeWidth="3.5"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - score)}
          strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: size > 55 ? '1rem' : '0.78rem', fontWeight: 700, color: sc.text }}>{Math.round(score * 100)}</span>
      </div>
    </div>
  )
}

// Single-colour bars — opacity-scaled so higher = darker
function BarRow({ label, value }) {
  const pct = Math.round(value * 100)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 68, fontSize: '0.69rem', color: '#aaa', flexShrink: 0 }}>{label}</div>
      <div style={{ flex: 1, height: 4, background: '#f0ede8', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: '#1a1a1a', borderRadius: 3, transition: 'width 0.5s ease', opacity: 0.15 + (value * 0.6) }} />
      </div>
      <div style={{ width: 26, fontSize: '0.69rem', color: '#777', fontWeight: 700, textAlign: 'right', flexShrink: 0 }}>{pct}</div>
    </div>
  )
}

function SectionLabel({ children }) {
  return <div style={{ fontSize: '0.63rem', color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 9 }}>{children}</div>
}

/* ── DropZone ──────────────────────────────────────────────────────────── */
function DropZone({ label, hint, accept, file, onFile }) {
  const ref = useRef()
  const [over, setOver] = useState(false)
  const handle = f => { if (f) onFile(f) }
  return (
    <div onClick={() => ref.current.click()}
      onDragOver={e => { e.preventDefault(); setOver(true) }}
      onDragLeave={() => setOver(false)}
      onDrop={e => { e.preventDefault(); setOver(false); handle(e.dataTransfer.files[0]) }}
      style={{ border: `1.5px dashed ${over ? '#333' : file ? '#1a1a1a' : '#d4d0c8'}`, borderRadius: 8, padding: '20px', cursor: 'pointer', background: file ? '#f5f3ef' : over ? '#f5f3ef' : '#faf9f7', transition: 'all 0.15s', textAlign: 'center' }}>
      <input ref={ref} type="file" accept={accept} style={{ display: 'none' }} onChange={e => e.target.files[0] && handle(e.target.files[0])} />
      <div style={{ width: 32, height: 32, borderRadius: 8, background: file ? '#1a1a1a' : '#edeae4', margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={file ? '#fff' : '#888'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {file
            ? <polyline points="20 6 9 17 4 12"/>
            : <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="12" x2="12" y2="18"/><line x1="9" y1="15" x2="15" y2="15"/></>}
        </svg>
      </div>
      {file
        ? <><div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#1a1a1a' }}>{file.name}</div><div style={{ fontSize: '0.7rem', color: '#888', marginTop: 3 }}>Click to change</div></>
        : <><div style={{ fontWeight: 500, fontSize: '0.82rem', color: '#333' }}>{label}</div><div style={{ fontSize: '0.7rem', color: '#aaa', marginTop: 3 }}>{hint}</div></>}
    </div>
  )
}

/* ── HowWeEvaluate ─────────────────────────────────────────────────────── */
function HowWeEvaluate({ onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2ddd6', width: 640, maxHeight: '88vh', overflow: 'auto', fontFamily: font }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: '0.93rem' }}>How we evaluate candidates</div>
          <button onClick={onClose} style={{ background: 'none', border: '1px solid #e2ddd6', borderRadius: 6, padding: '4px 13px', cursor: 'pointer', color: '#666', fontSize: '0.76rem', fontFamily: font }}>Close</button>
        </div>
        <div style={{ padding: '20px 24px' }}>
          <SectionLabel>Three scoring signals</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 22 }}>
            {[
              { title: 'Keyword match', desc: 'Exact skill overlap. Required skills count 2× preferred.' },
              { title: 'Semantic match', desc: 'Skill category overlap — Django similar to Express.js.' },
              { title: 'Experience fit', desc: 'Years vs role range. Overqualified is flagged.' },
            ].map(s => (
              <div key={s.title} style={{ padding: '12px', border: '1px solid #ede9e3', borderRadius: 8, background: '#faf8f5' }}>
                <div style={{ fontWeight: 600, fontSize: '0.8rem', marginBottom: 5 }}>{s.title}</div>
                <div style={{ fontSize: '0.73rem', color: '#666', lineHeight: 1.55 }}>{s.desc}</div>
              </div>
            ))}
          </div>
          <SectionLabel>Weight by context</SectionLabel>
          <div style={{ border: '1px solid #ede9e3', borderRadius: 8, overflow: 'hidden', marginBottom: 20 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead><tr style={{ background: '#faf8f5' }}>
                {['Context','Keyword','Semantic','Experience','Best for'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#999', fontWeight: 600, fontSize: '0.66rem', borderBottom: '1px solid #ede9e3', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {[
                  { ctx: 'Product company', kw: '60%', sem: '25%', exp: '15%', when: 'SaaS, fintech' },
                  { ctx: 'AI startup',      kw: '30%', sem: '50%', exp: '20%', when: 'Flexible, research' },
                  { ctx: 'Fresher hiring',  kw: '40%', sem: '40%', exp: '20%', when: 'Campus, potential' },
                  { ctx: 'General',         kw: '45%', sem: '35%', exp: '20%', when: 'Most scenarios' },
                ].map((r, i) => (
                  <tr key={r.ctx} style={{ borderBottom: i < 3 ? '1px solid #f5f3ef' : 'none' }}>
                    <td style={{ padding: '9px 12px', fontWeight: 500 }}>{r.ctx}</td>
                    <td style={{ padding: '9px 12px', color: '#555', fontFamily: 'monospace' }}>{r.kw}</td>
                    <td style={{ padding: '9px 12px', color: '#555', fontFamily: 'monospace' }}>{r.sem}</td>
                    <td style={{ padding: '9px 12px', color: '#555', fontFamily: 'monospace' }}>{r.exp}</td>
                    <td style={{ padding: '9px 12px', color: '#888', fontSize: '0.75rem' }}>{r.when}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <SectionLabel>Score bands</SectionLabel>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { label: 'Strong fit', range: '65 – 100', bg: '#f0ede8', border: '#d4d0c8', text: '#1a1a1a' },
              { label: 'Moderate',   range: '40 – 64',  bg: '#f5f3ef', border: '#ddd9d2', text: '#555' },
              { label: 'Weak fit',   range: '0 – 39',   bg: '#faf9f7', border: '#e8e4de', text: '#999' },
            ].map(b => (
              <div key={b.label} style={{ flex: 1, padding: '11px', borderRadius: 8, border: `1px solid ${b.border}`, background: b.bg, textAlign: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: b.text }}>{b.range}</div>
                <div style={{ fontSize: '0.71rem', color: b.text, marginTop: 3, opacity: 0.7 }}>{b.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Candidate card (list) ─────────────────────────────────────────────── */
function CandidateCard({ result, active, onClick }) {
  return (
    <div className="row-hover" onClick={onClick} style={{
      padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #f5f3ef',
      background: active ? '#faf8f5' : '#fff',
      borderLeft: `3px solid ${active ? '#1a1a1a' : 'transparent'}`,
      transition: 'background 0.1s, border-color 0.1s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
        <ScoreRing score={result.score} size={44} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#1a1a1a', marginBottom: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {result.candidate_name}
          </div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {result.details.matched_skills.slice(0, 3).map(s => (
              <span key={s} style={{ fontSize: '0.61rem', padding: '2px 7px', borderRadius: 20, background: '#f0ede8', color: '#555', border: '1px solid #ddd9d2', fontWeight: 500 }}>{s}</span>
            ))}
            {result.details.missing_skills.length > 0 && (
              <span style={{ fontSize: '0.61rem', padding: '2px 7px', borderRadius: 20, background: '#faf9f7', color: '#bbb', border: '1px solid #e8e4de', fontWeight: 500 }}>
                −{result.details.missing_skills.length} missing
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Detail panel ──────────────────────────────────────────────────────── */
function DetailPanel({ resultsByMode, activeMode, onModeChange, onClose }) {
  const result = resultsByMode[activeMode]
  const [showCalc, setShowCalc] = useState(false)
  if (!result) return null

  const sc = scoreColor(result.score)
  const matchedCount  = result.details.matched_skills.length
  const missingCount  = result.details.missing_skills.length
  const bridgeCount   = result.details.semantic_bridges.length
  const totalRequired = matchedCount + missingCount

  const modeWeights = {
    product: { keyword: 0.60, semantic: 0.25, exp: 0.15 },
    ai:      { keyword: 0.30, semantic: 0.50, exp: 0.20 },
    fresher: { keyword: 0.40, semantic: 0.40, exp: 0.20 },
    default: { keyword: 0.45, semantic: 0.35, exp: 0.20 },
  }
  const w = modeWeights[activeMode] || modeWeights.default
  const kw  = (result.breakdown.keyword_score  * w.keyword  * 100).toFixed(1)
  const sem = (result.breakdown.semantic_score * w.semantic * 100).toFixed(1)
  const exp = (result.breakdown.rules_score    * w.exp      * 100).toFixed(1)

  const coverageNote = totalRequired > 0
    ? `Covers ${matchedCount} of ${totalRequired} required skills${bridgeCount > 0 ? `, plus ${bridgeCount} transferable skill${bridgeCount !== 1 ? 's' : ''} that map closely to what's needed` : ''}.`
    : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '100%', overflow: 'hidden', background: '#fff', fontFamily: font }}>

      {/* Header */}
      <div style={{ padding: '16px 22px', borderBottom: '1px solid #ede9e3', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.97rem', color: '#1a1a1a' }}>{result.candidate_name}</div>
          <div style={{ fontSize: '0.71rem', color: '#bbb', marginTop: 2 }}>Rank #{result.rank} &middot; {result.details.profile_completeness} profile complete</div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: '1px solid #e2ddd6', borderRadius: 6, padding: '4px 11px', cursor: 'pointer', color: '#999', fontSize: '0.74rem', fontFamily: font }}>Close</button>
      </div>

      {/* Score hero */}
      <div style={{ padding: '18px 22px', background: '#faf9f7', borderBottom: '1px solid #ede9e3', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18 }}>
          <ScoreRing score={result.score} size={64} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
              <span style={{ fontSize: '1.7rem', fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.03em', lineHeight: 1 }}>{Math.round(result.score * 100)}</span>
              <span style={{ fontSize: '0.72rem', color: '#bbb' }}>/ 100</span>
              <span style={{ fontSize: '0.65rem', padding: '3px 9px', borderRadius: 20, background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`, fontWeight: 600 }}>{sc.label}</span>
              <button
                onClick={() => setShowCalc(v => !v)}
                style={{ fontSize: '0.65rem', padding: '3px 10px', borderRadius: 6, border: '1px solid #e2ddd6', background: showCalc ? '#f5f3ef' : 'none', cursor: 'pointer', color: '#777', fontFamily: font }}
              >
                {showCalc ? 'Hide' : 'Show'} calculation {showCalc ? '▲' : '▼'}
              </button>
            </div>

            {showCalc && (
              <div style={{ padding: '10px 13px', background: '#fff', border: '1px solid #e8e4de', borderRadius: 7, fontSize: '0.74rem', color: '#555', lineHeight: 2, marginBottom: 10, fontFamily: 'monospace' }}>
                <div style={{ fontFamily: font, fontWeight: 600, fontSize: '0.72rem', color: '#333', marginBottom: 4 }}>
                  {MODES.find(m => m.id === activeMode)?.label} weights
                </div>
                Keyword &nbsp;&nbsp; {Math.round(result.breakdown.keyword_score  * 100)} × {w.keyword}  = {kw}<br />
                Semantic &nbsp;&nbsp; {Math.round(result.breakdown.semantic_score * 100)} × {w.semantic} = {sem}<br />
                Experience {Math.round(result.breakdown.rules_score * 100)} × {w.exp} = {exp}<br />
                <div style={{ borderTop: '1px solid #f0ede8', marginTop: 6, paddingTop: 6, fontFamily: font, fontWeight: 700, color: '#1a1a1a' }}>
                  Final score: {Math.round(result.score * 100)}
                </div>
              </div>
            )}

            <div style={{ fontSize: '0.8rem', color: '#333', lineHeight: 1.7, marginBottom: coverageNote ? 6 : 0 }}>{result.explanation}</div>
            {coverageNote && (
              <div style={{ fontSize: '0.73rem', color: '#aaa', lineHeight: 1.6 }}>{coverageNote}</div>
            )}
          </div>
        </div>
      </div>

      {/* Mode tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #ede9e3', flexShrink: 0, background: '#fff' }}>
        {MODES.map(m => {
          const r = resultsByMode[m.id]
          const isActive = activeMode === m.id
          return (
            <button key={m.id} onClick={() => onModeChange(m.id)} style={{
              flex: 1, padding: '8px 4px', border: 'none', cursor: 'pointer', fontFamily: font,
              background: isActive ? '#fff' : '#faf8f5',
              borderBottom: `2px solid ${isActive ? '#1a1a1a' : 'transparent'}`,
              color: isActive ? '#1a1a1a' : '#bbb', transition: 'all 0.12s',
            }}>
              <div style={{ fontSize: '0.71rem', fontWeight: isActive ? 600 : 400 }}>{m.label.split(' ')[0]}</div>
              <div style={{ fontSize: '0.64rem', color: isActive ? '#777' : '#d4d0c8', marginTop: 1 }}>
                {r ? Math.round(r.score * 100) : '—'}
              </div>
            </button>
          )
        })}
      </div>

      {/* Scrollable body */}
      <div style={{ flex: '1 1 0', overflowY: 'auto', minHeight: 0, padding: '18px 22px' }} key={activeMode}>

        {/* Skills breakdown */}
        {(result.details.matched_skills.length > 0 || result.details.missing_skills.length > 0) && (
          <div style={{ marginBottom: 18 }}>
            <SectionLabel>Skills breakdown</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: result.details.missing_skills.length > 0 ? '1fr 1fr' : '1fr', gap: 10 }}>
              {result.details.matched_skills.length > 0 && (
                <div style={{ padding: '12px 13px', background: '#faf8f5', borderRadius: 8, border: '1px solid #e8e4de' }}>
                  <div style={{ fontSize: '0.66rem', fontWeight: 700, color: '#888', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Has these</div>
                  <div>{result.details.matched_skills.map(s => <Tag key={s} type="matched">{s}</Tag>)}</div>
                </div>
              )}
              {result.details.missing_skills.length > 0 && (
                <div style={{ padding: '12px 13px', background: '#faf9f7', borderRadius: 8, border: '1px dashed #e0dbd4' }}>
                  <div style={{ fontSize: '0.66rem', fontWeight: 700, color: '#bbb', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Doesn't have</div>
                  <div>{result.details.missing_skills.map(s => <Tag key={s} type="missing">{s}</Tag>)}</div>
                </div>
              )}
            </div>
            {result.details.matched_skills.length > 0 && result.details.missing_skills.length === 0 && (
              <div style={{ marginTop: 8, padding: '9px 13px', background: '#faf8f5', borderRadius: 7, border: '1px solid #e8e4de', fontSize: '0.78rem', color: '#555', fontWeight: 500 }}>
                No skill gaps — all required skills are present
              </div>
            )}
          </div>
        )}

        {/* Transferable skills */}
        {result.details.semantic_bridges.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <SectionLabel>Transferable skills</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {result.details.semantic_bridges.map((b, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#faf9f7', borderRadius: 7, border: '1px solid #ede9e3', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#333' }}>{b.candidate_skill}</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  <span style={{ fontSize: '0.75rem', color: '#666' }}>{b.job_skill}</span>
                  <span style={{ fontSize: '0.65rem', color: '#bbb', marginLeft: 'auto' }}>{b.category}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Experience */}
        <div style={{ marginBottom: 18 }}>
          <SectionLabel>Experience</SectionLabel>
          <div style={{ padding: '12px 14px', background: '#faf8f5', borderRadius: 8, border: '1px solid #ede9e3', fontSize: '0.79rem', color: '#444', lineHeight: 1.65 }}>
            {result.details.experience_note}
          </div>
        </div>

        {result.vs_above && (
          <div style={{ paddingTop: 14, borderTop: '1px solid #f0ede8', fontSize: '0.72rem', color: '#bbb', lineHeight: 1.6, fontStyle: 'italic' }}>{result.vs_above}</div>
        )}
      </div>
    </div>
  )
}

/* ── Step wrapper ──────────────────────────────────────────────────────── */
function Step({ n, label, children }) {
  return (
    <div style={{ marginBottom: 26 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 11 }}>
        <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#1a1a1a', color: '#fff', fontSize: '0.66rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{n}</div>
        <div style={{ fontWeight: 500, fontSize: '0.84rem', color: '#222' }}>{label}</div>
      </div>
      {children}
    </div>
  )
}

/* ── Logo ──────────────────────────────────────────────────────────────── */
function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
      <div style={{ width: 26, height: 26, borderRadius: 6, background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      </div>
      <span style={{ fontWeight: 700, fontSize: '0.9rem', letterSpacing: '-0.02em', color: '#1a1a1a' }}>TalentMatch</span>
    </div>
  )
}

/* ── Main App ──────────────────────────────────────────────────────────── */
export default function App() {
  const [jdFile, setJdFile]               = useState(null)
  const [candFile, setCandFile]           = useState(null)
  const [mode, setMode]                   = useState('default')
  const [topK, setTopK]                   = useState(20)
  const [loading, setLoading]             = useState(false)
  const [error, setError]                 = useState(null)
  const [resultsByMode, setResultsByMode] = useState(null)
  const [activeMode, setActiveMode]       = useState('default')
  const [selected, setSelected]           = useState(null)
  const [detailMode, setDetailMode]       = useState('default')
  const [showHow, setShowHow]             = useState(false)
  const [jdText, setJdText]               = useState(null)
  const [showJD, setShowJD]               = useState(false)

  const currentResults = resultsByMode?.[activeMode]?.results || []

  const handleMatch = async () => {
    if (!jdFile || !candFile) return
    setLoading(true); setError(null); setResultsByMode(null); setSelected(null)
    try {
      const jdFd = new FormData(); jdFd.append('file', jdFile)
      await req('/jobs/upload', { method: 'POST', body: jdFd })
      const cFd = new FormData(); cFd.append('file', candFile)
      await req('/candidates/upload', { method: 'POST', body: cFd })
      const jobs = await req('/jobs')
      if (!jobs.length) throw new Error('No jobs found after upload')
      const job = jobs[jobs.length - 1]
      setJdText(job.description || '')
      const modeResults = await Promise.all(MODES.map(m => req(`/match/${job.id}?top_k=${topK}&hiring_mode=${m.id}`)))
      const byMode = {}
      MODES.forEach((m, i) => { byMode[m.id] = modeResults[i] })
      setResultsByMode(byMode)
      setActiveMode(mode)
      setDetailMode(mode)
      const idx = MODES.findIndex(m2 => m2.id === mode)
      if (modeResults[idx]?.results?.length) selectCandidate(modeResults[idx].results[0].candidate_id, byMode)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const selectCandidate = (candidateId, byMode) => {
    const all = {}
    MODES.forEach(m => {
      const found = (byMode || resultsByMode)?.[m.id]?.results?.find(r => r.candidate_id === candidateId)
      if (found) all[m.id] = found
    })
    setSelected(all)
    setDetailMode(activeMode)
  }

  const reset = () => {
    setJdFile(null); setCandFile(null); setResultsByMode(null)
    setSelected(null); setError(null); setJdText(null); setLoading(false)
  }

  if (loading) return <><FontLink /><LoadingScreen /></>

  /* ── Upload screen ─────────────────────────────────────────────────── */
  if (!resultsByMode) return (
    <div style={{ minHeight: '100vh', background: '#f8f7f4', fontFamily: font }}>
      <FontLink />
      {showHow && <HowWeEvaluate onClose={() => setShowHow(false)} />}
      <nav style={{ background: '#fff', borderBottom: '1px solid #e8e4de', padding: '0 32px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Logo />
        <button onClick={() => setShowHow(true)} style={{ background: 'none', border: '1px solid #e2ddd6', borderRadius: 6, padding: '5px 14px', fontSize: '0.74rem', color: '#666', cursor: 'pointer', fontFamily: font }}>How it works</button>
      </nav>
      <div style={{ overflowY: 'auto', height: 'calc(100vh - 52px)' }}>
        <div style={{ maxWidth: 540, margin: '0 auto', padding: '52px 24px 60px' }}>
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.03em', color: '#1a1a1a', marginBottom: 10, lineHeight: 1.2 }}>Find the right candidates</h1>
            <p style={{ color: '#aaa', fontSize: '0.84rem', lineHeight: 1.65 }}>Upload a job description and candidate data.<br/>Ranked across all hiring contexts instantly.</p>
          </div>
          <Step n="1" label="Upload job description">
            <DropZone label="Job description" hint="PDF, Word, or text file" accept=".pdf,.doc,.docx,.txt" file={jdFile} onFile={setJdFile} />
          </Step>
          <Step n="2" label="Upload candidate data">
            <DropZone label="Candidate profiles" hint="CSV, Excel, or JSON" accept=".csv,.xlsx,.xls,.json" file={candFile} onFile={setCandFile} />
          </Step>
          <Step n="3" label="Select primary hiring context">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {MODES.map(m => (
                <div key={m.id} onClick={() => setMode(m.id)} style={{ padding: '13px 15px', borderRadius: 8, cursor: 'pointer', border: `1.5px solid ${mode === m.id ? '#1a1a1a' : '#e2ddd6'}`, background: mode === m.id ? '#1a1a1a' : '#fff', transition: 'all 0.14s' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.83rem', color: mode === m.id ? '#fff' : '#1a1a1a', marginBottom: 3 }}>{m.label}</div>
                  <div style={{ fontSize: '0.71rem', color: mode === m.id ? '#888' : '#aaa' }}>{m.desc}</div>
                </div>
              ))}
            </div>
          </Step>
          <Step n="4" label="How many candidates to show?">
            <div style={{ display: 'flex', gap: 8 }}>
              {TOP_K_OPTIONS.map(k => (
                <div key={k.v} onClick={() => setTopK(k.v)} style={{ flex: 1, padding: '10px 6px', borderRadius: 8, cursor: 'pointer', textAlign: 'center', border: `1.5px solid ${topK === k.v ? '#1a1a1a' : '#e2ddd6'}`, background: topK === k.v ? '#1a1a1a' : '#fff', transition: 'all 0.14s' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.86rem', color: topK === k.v ? '#fff' : '#1a1a1a' }}>{k.label}</div>
                  <div style={{ fontSize: '0.68rem', color: topK === k.v ? '#888' : '#bbb', marginTop: 2 }}>{k.desc}</div>
                </div>
              ))}
            </div>
          </Step>
          {error && <div style={{ padding: '10px 14px', background: '#faf8f5', border: '1px solid #e8e4de', borderRadius: 7, color: '#555', fontSize: '0.8rem', marginBottom: 16 }}>{error}</div>}
          <button onClick={handleMatch} disabled={!jdFile || !candFile} style={{
            width: '100%', padding: '14px', borderRadius: 8, border: 'none',
            background: jdFile && candFile ? '#1a1a1a' : '#d5d1cc',
            color: '#fff', fontWeight: 700, fontSize: '0.9rem',
            cursor: jdFile && candFile ? 'pointer' : 'not-allowed',
            fontFamily: font, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
          }}>
            Find matches
          </button>
        </div>
      </div>
    </div>
  )

  /* ── Results screen ────────────────────────────────────────────────── */
  const sC = currentResults.filter(r => Math.round(r.score * 100) >= 65).length
const mC = currentResults.filter(r => Math.round(r.score * 100) >= 40 && Math.round(r.score * 100) < 65).length
const wC = currentResults.filter(r => Math.round(r.score * 100) < 40).length

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f8f7f4', fontFamily: font }}>
      <FontLink />
      {showHow && <HowWeEvaluate onClose={() => setShowHow(false)} />}

      {/* Top bar */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e8e4de', padding: '0 20px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Logo />
          <div style={{ width: 1, height: 16, background: '#e8e4de' }} />
          <div style={{ display: 'flex', gap: 5 }}>
            <span style={{ fontSize: '0.68rem', padding: '2px 9px', borderRadius: 20, background: '#f0ede8', color: '#1a1a1a', border: '1px solid #d4d0c8', fontWeight: 600 }}>{sC} strong</span>
            <span style={{ fontSize: '0.68rem', padding: '2px 9px', borderRadius: 20, background: '#f5f3ef', color: '#666',    border: '1px solid #ddd9d2', fontWeight: 600 }}>{mC} moderate</span>
            <span style={{ fontSize: '0.68rem', padding: '2px 9px', borderRadius: 20, background: '#faf9f7', color: '#bbb',    border: '1px solid #e8e4de', fontWeight: 600 }}>{wC} weak</span>
          </div>
          {jdText && <button onClick={() => setShowJD(true)} style={{ background: 'none', border: '1px solid #e2ddd6', borderRadius: 5, padding: '3px 10px', fontSize: '0.7rem', color: '#666', cursor: 'pointer', fontFamily: font }}>View JD</button>}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowHow(true)} style={{ background: 'none', border: '1px solid #e2ddd6', borderRadius: 5, padding: '4px 12px', fontSize: '0.7rem', color: '#666', cursor: 'pointer', fontFamily: font }}>How we evaluate</button>
          <button onClick={reset} style={{ background: '#1a1a1a', border: 'none', borderRadius: 5, padding: '4px 14px', fontSize: '0.7rem', color: '#fff', cursor: 'pointer', fontFamily: font }}>New search</button>
        </div>
      </div>

      {/* Mode tabs */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e8e4de', display: 'flex', flexShrink: 0 }}>
        {MODES.map(m => {
          const mR = resultsByMode[m.id]?.results || []
          const st = mR.filter(r => r.score >= 0.65).length
          const isA = activeMode === m.id
          return (
            <button key={m.id} onClick={() => { setActiveMode(m.id); if (selected) setDetailMode(m.id) }} style={{
              flex: 1, padding: '10px 8px', border: 'none', cursor: 'pointer', fontFamily: font,
              background: isA ? '#fff' : '#faf8f5',
              borderBottom: `2px solid ${isA ? '#1a1a1a' : 'transparent'}`,
              color: isA ? '#1a1a1a' : '#aaa', transition: 'all 0.12s',
            }}>
              <div style={{ fontWeight: isA ? 600 : 400, fontSize: '0.79rem' }}>{m.label}</div>
              <div style={{ fontSize: '0.65rem', color: '#bbb', marginTop: 2 }}>{st} strong</div>
            </button>
          )
        })}
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* List */}
       <div style={{ width: 284, borderRight: '1px solid #e8e4de', display: 'flex', flexDirection: 'column', background: '#fff', flexShrink: 0, overflow: 'hidden', height: '100%' }}>
          <div style={{ padding: '9px 16px', borderBottom: '1px solid #f5f3ef', flexShrink: 0 }}>
            <div style={{ fontSize: '0.68rem', color: '#bbb' }}>{currentResults.length} candidates ranked</div>
          </div>
<div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            {currentResults.map(r => (
              <CandidateCard
                key={r.candidate_id}
                result={r}
                active={selected && Object.values(selected)[0]?.candidate_id === r.candidate_id}
                onClick={() => selectCandidate(r.candidate_id, null)}
                allModeResults={resultsByMode}
              />
            ))}
          </div>
        </div>

        {/* Detail */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {selected
            ? <DetailPanel resultsByMode={selected} activeMode={detailMode} onModeChange={setDetailMode} onClose={() => setSelected(null)} />
            : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: '#f5f3ef', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                <div style={{ fontSize: '0.84rem', color: '#bbb', fontWeight: 500 }}>Select a candidate</div>
                <div style={{ fontSize: '0.72rem', color: '#d4d0c8', textAlign: 'center', lineHeight: 1.55 }}>Click any name on the left<br/>to view detailed analysis</div>
              </div>
            )}
        </div>
      </div>

      {/* JD modal */}
      {showJD && jdText && (
        <>
          <div onClick={() => setShowJD(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.2)', zIndex: 400 }} />
          <div style={{ position: 'fixed', top: '8%', left: '50%', transform: 'translateX(-50%)', width: 580, maxHeight: '78vh', background: '#fff', borderRadius: 12, border: '1px solid #e2ddd6', zIndex: 401, display: 'flex', flexDirection: 'column', fontFamily: font }}>
            <div style={{ padding: '16px 22px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Job description</div>
              <button onClick={() => setShowJD(false)} style={{ background: 'none', border: '1px solid #e2ddd6', borderRadius: 6, padding: '3px 12px', cursor: 'pointer', color: '#666', fontSize: '0.76rem', fontFamily: font }}>Close</button>
            </div>
            <div style={{ padding: '18px 22px', overflowY: 'auto', fontSize: '0.81rem', color: '#333', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{jdText.trim()}</div>
          </div>
        </>
      )}
    </div>
  )
}
