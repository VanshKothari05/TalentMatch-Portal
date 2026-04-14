const BASE = import.meta.env.VITE_API_URL || '/api'

async function req(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, opts)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Request failed')
  }
  return res.json()
}

export const api = {
  stats:          ()            => req('/stats'),
  listJobs:       ()            => req('/jobs'),
  listCandidates: ()            => req('/candidates'),
  uploadJobs:     (body)        => req('/jobs',       { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  uploadCandidates:(body)       => req('/candidates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  uploadJobFile:  (file)        => { const fd = new FormData(); fd.append('file', file); return req('/jobs/upload', { method: 'POST', body: fd }) },
  uploadCandFile: (file)        => { const fd = new FormData(); fd.append('file', file); return req('/candidates/upload', { method: 'POST', body: fd }) },
  match:          (jdId, topK)  => req(`/match/${jdId}?top_k=${topK || 20}`),
  matchDetail:    (jdId, cId)   => req(`/match/${jdId}/${cId}`),
}
