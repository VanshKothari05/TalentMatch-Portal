import React, { useState } from 'react'
import { api } from '../utils/api'
import JDModal from '../components/JDModal'

function ScoreBar({ value }) {
  return (
    <div className="score-bar-bg" style={{ width: '100%' }}>
      <div className="score-bar" style={{ width: `${Math.round(value * 100)}%` }} />
    </div>
  )
}

function FitLabel({ fit }) {
  const cls = { STRONG: 'fit-strong', MODERATE: 'fit-moderate', WEAK: 'fit-weak' }
  return <span style={{ fontSize: '0.75rem', fontWeight: 500, color: fit === 'STRONG' ? '#2d6a3f' : fit === 'MODERATE' ? '#7a5c1e' : '#8b2020' }}>{fit}</span>
}

function DetailPanel({ result, job, onClose }) {
  if (!result) return null
  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, width: 440, height: '100vh',
      background: '#fff', borderLeft: '1px solid #e2ddd6',
      overflowY: 'auto', zIndex: 200, padding: 28,
    }} className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: '1rem' }}>{result.candidate_name}</div>
          <div style={{ fontSize: '0.78rem', color: '#888', marginTop: 2 }}>for {job?.title}</div>
        </div>
        <button className="btn" style={{ padding: '5px 12px', fontSize: '0.8rem' }} onClick={onClose}>Close</button>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
        <span style={{ fontSize: '2.4rem', fontWeight: 600, letterSpacing: '-0.03em' }}>{Math.round(result.score * 100)}</span>
        <span style={{ fontSize: '0.85rem', color: '#888' }}>/ 100</span>
        <FitLabel fit={result.fit} />
      </div>
      <ScoreBar value={result.score} />

      <div style={{ display: 'flex', gap: 20, marginTop: 10, marginBottom: 24, fontSize: '0.78rem', color: '#888' }}>
        <span>KW {Math.round(result.breakdown.keyword_score * 100)}%</span>
        <span>SEM {Math.round(result.breakdown.semantic_score * 100)}%</span>
        <span>Rules {Math.round(result.breakdown.rules_score * 100)}%</span>
        <span>Complete {Math.round(result.confidence * 100)}%</span>
      </div>

      <div style={{ background: '#f7f5f0', border: '1px solid #e2ddd6', borderRadius: 6, padding: 14, marginBottom: 20, fontSize: '0.83rem', color: '#333', lineHeight: 1.65 }}>
        {result.explanation}
      </div>

      {[
        { label: 'Matched skills', items: result.details.matched_skills, cls: 'matched' },
        { label: 'Missing skills', items: result.details.missing_skills, cls: 'missing' },
      ].map(s => s.items.length > 0 && (
        <div key={s.label} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: '0.72rem', color: '#999', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 7 }}>{s.label}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {s.items.map(sk => <span key={sk} className={`tag ${s.cls}`}>{sk}</span>)}
          </div>
        </div>
      ))}

      {result.details.semantic_bridges.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: '0.72rem', color: '#999', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 7 }}>Transferable skills</div>
          {result.details.semantic_bridges.map((b, i) => (
            <div key={i} style={{ fontSize: '0.8rem', color: '#555', marginBottom: 4 }}>
              {b.candidate_skill} <span style={{ color: '#bbb' }}>≈</span> {b.job_skill} <span style={{ color: '#bbb' }}>({b.category})</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: '0.72rem', color: '#999', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 7 }}>Experience</div>
        <div style={{ fontSize: '0.82rem', color: '#444' }}>{result.details.experience_note}</div>
      </div>

      {result.details.skill_recommendations.length > 0 && (
        <div>
          <div style={{ fontSize: '0.72rem', color: '#999', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 7 }}>Recommendations</div>
          {result.details.skill_recommendations.map((r, i) => (
            <div key={i} style={{ fontSize: '0.8rem', color: '#555', marginBottom: 5, paddingLeft: 10, borderLeft: '2px solid #e2ddd6' }}>{r}</div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Match({ jobs }) {
  const [selectedJob, setSelectedJob] = useState(null)
  const [results, setResults]         = useState(null)
  const [detail, setDetail]           = useState(null)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState(null)
  const [topK, setTopK]               = useState(20)
  const [viewingJD, setViewingJD]     = useState(false)

  const runMatch = async () => {
    if (!selectedJob) return
    setLoading(true); setError(null); setDetail(null)
    try {
      const data = await api.match(selectedJob.id, topK)
      setResults(data)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="fade-in" style={{ paddingRight: detail ? 460 : 0, transition: 'padding-right 0.2s' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 4 }}>Match candidates</h1>
        <p style={{ color: '#666', fontSize: '0.9rem' }}>Select a job description to rank all candidates.</p>
      </div>

      <div className="card" style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <label>Job description</label>
          <select value={selectedJob?.id || ''} onChange={e => { setSelectedJob(jobs.find(j => j.id === e.target.value)); setResults(null) }}>
            <option value="">Select a job...</option>
            {jobs.map(j => <option key={j.id} value={j.id}>{j.title}{j.company ? ` — ${j.company}` : ''}</option>)}
          </select>
        </div>
        <div style={{ width: 100 }}>
          <label>Top K</label>
          <select value={topK} onChange={e => setTopK(Number(e.target.value))}>
            {[10, 20, 50].map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <button className="btn btn-primary" onClick={runMatch} disabled={!selectedJob || loading}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {loading ? <><div className="spinner" />Running...</> : 'Run match'}
        </button>
      </div>


      {selectedJob && (
        <div className="card" style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{selectedJob.title}</div>
            <div style={{ fontSize: '0.75rem', color: '#888', marginTop: 2 }}>
              {selectedJob.company && <span>{selectedJob.company} · </span>}
              Mode: <span style={{ fontFamily: 'var(--mono)' }}>{selectedJob.hiring_mode}</span>
              {selectedJob.min_experience != null && (
                <span> · Exp: {selectedJob.min_experience}–{selectedJob.max_experience} yrs</span>
              )}
            </div>
          </div>
          <button className="btn" style={{ fontSize: '0.78rem', padding: '5px 14px', flexShrink: 0 }}
            onClick={() => setViewingJD(true)}>
            View JD
          </button>
        </div>
      )}

      {error && (
        <div style={{ padding: 12, border: '1px solid #e8b4b4', borderRadius: 6, color: '#8b2020', marginBottom: 16, fontSize: '0.85rem', background: '#fdf2f2' }}>
          {error}
        </div>
      )}

      {results && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: '0.8rem', color: '#888' }}>
              {results.results.length} of {results.total_candidates} candidates ranked
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: '0.78rem' }}>
              <span style={{ color: '#2d6a3f' }}>{results.results.filter(r => r.fit === 'STRONG').length} strong</span>
              <span style={{ color: '#7a5c1e' }}>{results.results.filter(r => r.fit === 'MODERATE').length} moderate</span>
              <span style={{ color: '#8b2020' }}>{results.results.filter(r => r.fit === 'WEAK').length} weak</span>
            </div>
          </div>

          <div style={{ border: '1px solid #e2ddd6', borderRadius: 6, overflow: 'hidden', background: '#fff' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2ddd6', background: '#f7f5f0' }}>
                  {['#', 'Candidate', 'Fit', 'Score', 'Keyword', 'Semantic', 'Rules', ''].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '0.72rem', color: '#888', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.results.map((r, i) => (
                  <tr key={r.candidate_id} style={{ borderBottom: '1px solid #f0ede8', cursor: 'pointer' }}
                    onClick={() => setDetail(r)}
                    onMouseEnter={e => e.currentTarget.style.background = '#faf8f4'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <td style={{ padding: '10px 12px', color: '#999', fontFamily: 'var(--mono)', fontSize: '0.78rem' }}>{r.rank}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 500 }}>{r.candidate_name}</td>
                    <td style={{ padding: '10px 12px' }}><FitLabel fit={r.fit} /></td>
                    <td style={{ padding: '10px 12px', minWidth: 100 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, maxWidth: 60 }}>
                          <ScoreBar value={r.score} />
                        </div>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: '0.78rem', color: '#555' }}>{Math.round(r.score * 100)}</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#888', fontFamily: 'var(--mono)', fontSize: '0.78rem' }}>{Math.round(r.breakdown.keyword_score * 100)}%</td>
                    <td style={{ padding: '10px 12px', color: '#888', fontFamily: 'var(--mono)', fontSize: '0.78rem' }}>{Math.round(r.breakdown.semantic_score * 100)}%</td>
                    <td style={{ padding: '10px 12px', color: '#888', fontFamily: 'var(--mono)', fontSize: '0.78rem' }}>{Math.round(r.breakdown.rules_score * 100)}%</td>
                    <td style={{ padding: '10px 12px', color: '#aaa', fontSize: '0.8rem' }}>View →</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!results && !loading && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#bbb', fontSize: '0.88rem' }}>
          Select a job and run a match to see ranked candidates
        </div>
      )}

      {viewingJD && <JDModal job={selectedJob} onClose={() => setViewingJD(false)} />}
      {detail && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.15)', zIndex: 199 }} onClick={() => setDetail(null)} />}
      <DetailPanel result={detail} job={selectedJob} onClose={() => setDetail(null)} />
    </div>
  )
}