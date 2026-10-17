/**
 * Live Proctor Console — teacher view for a batch.
 * Shows: 25–30 student tiles (status, flag count), cluster alert banner, health indicator.
 * Polls every 15 seconds for live updates.
 */
import React, { useEffect, useState, useCallback } from 'react'
import {
  Monitor, Keyboard, Play, LogOut, Flag, AlertTriangle, ShieldAlert,
  RefreshCw, Pause, Activity, Users, Wifi, WifiOff
} from 'lucide-react'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface Tile {
  student_id: string
  student_name: string
  status: 'typing' | 'idle' | 'running_code' | 'tab_away'
  flag_count: number
  last_event_at: string | null
}

interface ClusterAlert {
  batch_id: string
  cluster_rate: number
  threshold: number
  active_students: number
  flagged_students: number
  likely_causes: string[]
  fired_at: string
  is_active: boolean
}

interface ConsoleData {
  batch_id: string
  tiles: Tile[]
  cluster_alert: ClusterAlert | null
  health_indicator: 'normal' | 'elevated' | 'critical'
}

function statusIcon(status: string, size = 14) {
  switch (status) {
    case 'typing':      return <Keyboard size={size} color="#34d399" />
    case 'running_code': return <Play size={size} color="#60a5fa" />
    case 'tab_away':    return <LogOut size={size} color="#f87171" />
    default:            return <Monitor size={size} color="#64748b" />
  }
}

function statusLabel(status: string) {
  switch (status) {
    case 'typing':       return 'Typing'
    case 'running_code': return 'Running Code'
    case 'tab_away':     return 'Tab Away'
    default:             return 'Idle'
  }
}

function statusColor(status: string) {
  switch (status) {
    case 'typing':       return '#34d399'
    case 'running_code': return '#60a5fa'
    case 'tab_away':     return '#f87171'
    default:             return '#64748b'
  }
}

function healthColor(h: string) {
  if (h === 'critical') return '#f87171'
  if (h === 'elevated') return '#fbbf24'
  return '#34d399'
}

function healthLabel(h: string) {
  if (h === 'critical') return 'Critical'
  if (h === 'elevated') return 'Elevated'
  return 'Normal'
}

export function ProctoringConsolePage({ batchId }: { batchId: string }) {
  const [data, setData] = useState<ConsoleData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [pausing, setPausing] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/proctor/${batchId}`)
      if (res.ok) {
        setData(await res.json())
        setLastRefresh(new Date())
      }
    } catch (e) {
      console.error('Proctor fetch failed:', e)
    } finally {
      setLoading(false)
    }
  }, [batchId])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 15000)
    return () => clearInterval(interval)
  }, [fetchData])

  const handlePause = async () => {
    setPausing(true)
    try {
      await fetch(`${BASE_URL}/api/proctor/${batchId}/pause`, { method: 'POST' })
      alert('Test paused for batch. Students notified.')
    } finally {
      setPausing(false)
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px', color: 'var(--color-muted)' }}>
        <RefreshCw size={28} className="spin-animation" style={{ margin: '0 auto 12px' }} />
        <p>Loading live proctor console…</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: 'var(--color-muted)' }}>
        <WifiOff size={28} style={{ margin: '0 auto 12px' }} />
        <p>Could not load proctor data. Ensure backend is running.</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div className="glassmorphic-card" style={{ padding: '20px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Monitor size={18} color="#818cf8" />
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Live Proctor Console</h1>
              <span style={{
                padding: '2px 8px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 700,
                background: `rgba(${data.health_indicator === 'critical' ? '239,68,68' : data.health_indicator === 'elevated' ? '245,158,11' : '16,185,129'},0.15)`,
                color: healthColor(data.health_indicator)
              }}>
                <Activity size={11} style={{ marginRight: 4 }} />
                {healthLabel(data.health_indicator)}
              </span>
            </div>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.86rem' }}>
              Batch: <strong>{batchId}</strong> · {data.tiles.length} students · Last updated {lastRefresh.toLocaleTimeString()}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={fetchData} className="glassmorphic-inner-card"
              style={{ padding: '8px 16px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.84rem', color: '#f8fafc' }}>
              <RefreshCw size={14} /> Refresh
            </button>
            <button onClick={handlePause} disabled={pausing}
              style={{
                padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.3)',
                background: 'rgba(239,68,68,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center',
                gap: 6, fontSize: '0.84rem', color: '#f87171', fontWeight: 700,
              }}>
              <Pause size={14} /> {pausing ? 'Pausing…' : 'Pause Test'}
            </button>
          </div>
        </div>

        {/* Health bar */}
        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--color-muted)', whiteSpace: 'nowrap' }}>Cluster rate vs threshold</span>
          <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${Math.min(100, ((data.cluster_alert?.cluster_rate || 0) / 0.4) * 100)}%`,
              background: healthColor(data.health_indicator),
              transition: 'width 0.5s ease',
              borderRadius: 3,
            }} />
          </div>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: healthColor(data.health_indicator), whiteSpace: 'nowrap' }}>
            {data.cluster_alert ? `${Math.round(data.cluster_alert.cluster_rate * 100)}%` : '0%'} / {Math.round(0.20 * 100)}% threshold
          </span>
        </div>
      </div>

      {/* Cluster alert banner */}
      {data.cluster_alert && data.cluster_alert.is_active && (
        <div style={{
          padding: '18px 22px', borderRadius: 12,
          background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(245,158,11,0.1))',
          border: '1px solid rgba(239,68,68,0.3)',
          display: 'flex', flexDirection: 'column', gap: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ShieldAlert size={20} color="#f87171" />
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#fca5a5' }}>
                CLUSTER ALERT — {data.cluster_alert.flagged_students} / {data.cluster_alert.active_students} students flagged ({Math.round(data.cluster_alert.cluster_rate * 100)}%)
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)', marginTop: 2 }}>
                Exceeds {Math.round(data.cluster_alert.threshold * 100)}% threshold. Review these scenarios before drawing conclusions:
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {data.cluster_alert.likely_causes.map(cause => (
              <span key={cause} style={{
                padding: '4px 10px', borderRadius: 6, fontSize: '0.78rem',
                background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)',
                color: '#fca5a5'
              }}>{cause}</span>
            ))}
          </div>
          <p style={{ fontSize: '0.76rem', color: '#64748b', fontStyle: 'italic' }}>
            No conclusion is drawn. This needs a human to look at the situation.
          </p>
        </div>
      )}

      {/* Student tiles grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
        {data.tiles.map(tile => (
          <div key={tile.student_id} className="glassmorphic-inner-card" style={{
            padding: '14px 16px', position: 'relative',
            border: tile.flag_count > 0
              ? '1px solid rgba(245,158,11,0.35)'
              : tile.status === 'tab_away'
                ? '1px solid rgba(239,68,68,0.25)'
                : '1px solid rgba(255,255,255,0.06)',
          }}>
            {/* Flag badge */}
            {tile.flag_count > 0 && (
              <div style={{
                position: 'absolute', top: 8, right: 8,
                background: 'rgba(245,158,11,0.2)', color: '#fbbf24',
                borderRadius: 6, padding: '1px 7px', fontSize: '0.72rem', fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: 4
              }}>
                <Flag size={10} /> {tile.flag_count}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <img
                src={`https://api.dicebear.com/7.x/bottts/svg?seed=${tile.student_name}`}
                alt={tile.student_name}
                style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }}
              />
              <div style={{ fontSize: '0.82rem', fontWeight: 700, lineHeight: 1.2, wordBreak: 'break-word' }}>
                {tile.student_name}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {statusIcon(tile.status)}
              <span style={{ fontSize: '0.76rem', color: statusColor(tile.status), fontWeight: 600 }}>
                {statusLabel(tile.status)}
              </span>
            </div>

            {tile.last_event_at && (
              <div style={{ fontSize: '0.68rem', color: 'var(--color-subtle)', marginTop: 6 }}>
                {new Date(tile.last_event_at).toLocaleTimeString()}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="glassmorphic-inner-card" style={{ padding: '12px 18px', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {[
          { status: 'typing', label: 'Typing' },
          { status: 'running_code', label: 'Running Code' },
          { status: 'tab_away', label: 'Tab Away' },
          { status: 'idle', label: 'Idle' },
        ].map(({ status, label }) => (
          <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--color-muted)' }}>
            {statusIcon(status, 13)}
            <span>{label}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: '#fbbf24' }}>
          <Flag size={13} color="#fbbf24" /> Individual flag (quiet — no verdict)
        </div>
      </div>
    </div>
  )
}
