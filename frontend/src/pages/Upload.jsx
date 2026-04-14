import React, { useState, useRef } from 'react'
import { api } from '../utils/api'

function DropZone({ label, onFile, busy }) {
  const ref = useRef()
  const [over, setOver] = useState(false)
  const [name, setName] = useState(null)
  const handle = f => { if (!f) return; setName(f.name); onFile(f) }
  return (
    <div onClick={() => ref.current.click()}
      onDragOver={e => { e.preventDefault(); setOver(true) }}
      onDragLeave={() => setOver(false)}
      onDrop={e => { e.preventDefault(); setOver(false); handle(e.dataTransfer.files[0]) }}
      style={{
        border: `1px dashed ${over ? '#1a1a1a' : '#ccc8c0'}`,
        borderRadius: 6, padding: '24px 16px', textAlign: 'center',
        cursor: 'pointer', background: over ? '#f7f5f0' : '#fff', transition: 'all 0.15s',
      }}>
      <input ref={ref} type="file" accept=".json" style={{ display: 'none' }} onChange={e => handle(e.target.files[0])} />
      {busy
        ? <div style={{ display: 'flex', justifyContent: 'center' }}><div className="spinner" /></div>
        : <div style={{ fontSize: '0.83rem', color: '#888' }}>
            {name ? <span style={{ color: '#1a1a1a' }}>{name}</span> : label}
          </div>
      }
    </div>
  )
}

export default function Upload({ onRefresh }) {
  const [jobFile, setJobFile]   = useState(null)
  const [candFile, setCandFile] = useState(null)
  const [busy, setBusy]         = useState({ job: false, cand: false })
  const [log, setLog]           = useState([])

  const push = (ok, text) => setLog(l => [{ id: Date.now(), ok, text }, ...l])

  const upload = async (type) => {
    const file = type === 'job' ? jobFile : candFile
    if (!file) return
    setBusy(b => ({ ...b, [type]: true }))
    try {
      const res = type === 'job' ? await api.uploadJobFile(file) : await api.uploadCandFile(file)
      push(true, `Uploaded ${res.added} ${type === 'job' ? 'job(s)' : 'candidate(s)'}: ${res.ids.join(', ')}`)
      onRefresh()
    } catch (e) { push(false, e.message) }
    finally { setBusy(b => ({ ...b, [type]: false })) }
  }

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 4 }}>Upload data</h1>
        <p style={{ color: '#666', fontSize: '0.9rem' }}>Add job descriptions or candidate profiles via JSON file.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {[
          { type: 'job', title: 'Job descriptions', label: 'Drop jobs JSON here', file: jobFile, setFile: setJobFile, bk: busy.job },
          { type: 'cand', title: 'Candidate profiles', label: 'Drop candidates JSON here', file: candFile, setFile: setCandFile, bk: busy.cand },
        ].map(s => (
          <div key={s.type} className="card">
            <div style={{ fontWeight: 500, marginBottom: 4 }}>{s.title}</div>
            <div style={{ fontSize: '0.78rem', color: '#888', marginBottom: 14 }}>JSON array format</div>
            <DropZone label={s.label} onFile={s.setFile} busy={s.bk} />
            <button className="btn btn-primary" style={{ marginTop: 10, width: '100%', justifyContent: 'center' }}
              onClick={() => upload(s.type)} disabled={!s.file || s.bk}>
              {s.bk ? 'Uploading...' : `Upload ${s.type === 'job' ? 'jobs' : 'candidates'}`}
            </button>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: '0.75rem', color: '#999', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>Expected JSON schema</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { title: 'Job', code: `[{\n  "id": "jd001",\n  "title": "Backend Engineer",\n  "company": "Acme",\n  "required_skills": ["Python"],\n  "preferred_skills": ["Docker"],\n  "min_experience": 3,\n  "max_experience": 7,\n  "hiring_mode": "product"\n}]` },
            { title: 'Candidate', code: `[{\n  "id": "c001",\n  "name": "Priya Sharma",\n  "skills": ["Python","Django"],\n  "years_experience": 5,\n  "current_role": "Backend Dev",\n  "education": "B.Tech CS",\n  "summary": "..."\n}]` },
          ].map(s => (
            <div key={s.title}>
              <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: 5 }}>{s.title}</div>
              <pre style={{ background: '#f7f5f0', border: '1px solid #e2ddd6', borderRadius: 5, padding: 12, fontSize: '0.75rem', fontFamily: 'var(--mono)', color: '#444', overflowX: 'auto', lineHeight: 1.55 }}>{s.code}</pre>
            </div>
          ))}
        </div>
      </div>

      {log.length > 0 && (
        <div className="card">
          <div style={{ fontSize: '0.75rem', color: '#999', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>Activity</div>
          {log.map(l => (
            <div key={l.id} style={{ fontSize: '0.8rem', padding: '6px 10px', borderRadius: 4, marginBottom: 5,
              background: l.ok ? '#f0f8f2' : '#fdf2f2',
              border: `1px solid ${l.ok ? '#a8d5b5' : '#e8b4b4'}`,
              color: l.ok ? '#2d6a3f' : '#8b2020',
              fontFamily: 'var(--mono)' }}>
              {l.ok ? '✓' : '✗'} {l.text}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}