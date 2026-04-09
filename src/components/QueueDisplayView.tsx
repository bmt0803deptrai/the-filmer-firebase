import { useState } from 'react'
import Icon from './Icon'
import { QueueEntry, Room, Workshop } from '../types'

interface Props { queue: QueueEntry[]; rooms: Room[]; workshops: Workshop[] }

export default function QueueDisplayView({ queue, rooms, workshops }: Props) {
  const allServices = [...rooms.map(r => ({ id: r.id, label: `${r.name} · ${r.theme}`, icon: r.type === 'photobooth' ? 'photo_camera' : 'self_improvement' })), ...workshops.map(w => ({ id: w.id, label: w.title, icon: 'school' }))]
  const [activeId, setActiveId] = useState(allServices[0]?.id ?? '')
  const waitingFor = (id: string) => queue.filter(q => q.serviceId === id && q.status === 'waiting').sort((a,b) => a.number - b.number)
  const servingFor = (id: string) => queue.find(q => q.serviceId === id && q.status === 'serving')

  return (
    <div className="fade-up">
      {/* Room cards */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${rooms.length}, 1fr)`, gap: 8, marginBottom: 20 }}>
        {rooms.map(r => {
          const s = servingFor(r.id); const w = waitingFor(r.id)
          return (
            <div key={r.id} className="card" style={{ padding: '16px 12px', textAlign: 'center' }}>
              <p className="section-label" style={{ marginBottom: 2 }}>{r.name}</p>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', fontStyle: 'italic', color: 'var(--burgundy)', marginBottom: 8 }}>{r.theme}</p>
              <p className="ticket-no ticket-number" style={{ fontSize: '2.8rem' }}>{w.length}</p>
              <p className="section-label" style={{ marginTop: 4 }}>đang chờ</p>
              {s
                ? <div style={{ background: 'var(--burgundy)', padding: '5px 8px', marginTop: 8, borderRadius: 'var(--radius-sm)' }}>
                    <p style={{ fontFamily: 'var(--font-type)', fontSize: '0.62rem', color: 'var(--cream)', letterSpacing: '0.1em' }}>Đang phục vụ: <strong style={{ color: 'var(--amber)' }}>{String(s.number).padStart(2,'0')}</strong></p>
                  </div>
                : <div className="empty-state" style={{ padding: '6px 0', marginTop: 4 }}><p style={{ fontFamily: 'var(--font-serif)', fontSize: '0.72rem', fontStyle: 'italic', color: 'var(--cream-deep)', opacity: 0.5 }}>Trống</p></div>
              }
            </div>
          )
        })}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', borderBottom: '2px solid var(--brown)', marginBottom: 14 }}>
        {allServices.map(svc => (
          <button key={svc.id} onClick={() => setActiveId(svc.id)} style={{
            position: 'relative', padding: '8px 16px', cursor: 'pointer',
            fontFamily: 'var(--font-type)', fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase',
            background: activeId === svc.id ? 'var(--brown)' : 'transparent',
            color: activeId === svc.id ? 'var(--cream)' : 'var(--tan)',
            border: 'none', borderBottom: `2px solid ${activeId === svc.id ? 'var(--amber)' : 'transparent'}`,
            marginBottom: -2, borderRadius: `var(--radius-sm) var(--radius-sm) 0 0`, transition: 'all 0.15s',
          }}>
            {activeId === svc.id && <span className="nav-active-dot" />}
            <span style={{display:'flex',alignItems:'center',gap:4}}><Icon name={svc.icon} size='sm' />{svc.label}</span>
          </button>
        ))}
      </div>

      {/* Queue entries */}
      {waitingFor(activeId).length === 0 && !servingFor(activeId)
        ? (
          <div className="empty-state">
            <div className="empty-state-bg"><span>Hàng Chờ Trống</span></div>
            <p className="empty-state-text">Chưa có lượt nào · Hàng chờ trống</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {servingFor(activeId) && (() => { const s = servingFor(activeId)!; return (
              <div className="slide-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--burgundy)', padding: '14px 20px', borderRadius: 'var(--radius)', boxShadow: '3px 3px 0 var(--burgundy-d)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div>
                    <p style={{ fontFamily: 'var(--font-type)', fontSize: '0.52rem', color: 'rgba(242,232,217,0.5)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>No.</p>
                    <p style={{ fontFamily: "'Courier Prime', monospace", fontWeight: 700, fontSize: '2.6rem', color: 'var(--amber)', lineHeight: 1, textShadow: '2px 2px 0 var(--burgundy-d)' }}>{String(s.number).padStart(2,'0')}</p>
                  </div>
                  <div>
                    <p style={{ fontFamily: 'var(--font-type)', fontSize: '0.75rem', color: 'var(--cream)', letterSpacing: '0.05em' }}>{s.name}</p>
                    <p style={{ fontFamily: 'var(--font-type)', fontSize: '0.6rem', color: 'rgba(242,232,217,0.55)', marginTop: 2 }}>{s.phone}</p>
                  </div>
                </div>
                <span className="status-serving status-badge"><Icon name='play_circle' size='sm' filled style={{marginRight:3}} />Đang Phục Vụ</span>
              </div>
            )})()}
            {waitingFor(activeId).map((entry, idx) => (
              <div key={entry.id} className="slide-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: idx === 0 ? 'var(--cream-dark)' : 'white', padding: '10px 18px', borderRadius: 'var(--radius-sm)', border: `1.5px solid ${idx === 0 ? 'var(--border-d)' : 'var(--border)'}`, boxShadow: '2px 2px 0 var(--cream-deep)', animationDelay: `${idx * 0.04}s` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div>
                    <p style={{ fontFamily: 'var(--font-type)', fontSize: '0.5rem', color: 'var(--tan)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>No.</p>
                    <p className="ticket-number" style={{ fontSize: '1.9rem' }}>{String(entry.number).padStart(2,'0')}</p>
                  </div>
                  <div>
                    <p style={{ fontFamily: 'var(--font-type)', fontSize: '0.72rem', color: 'var(--brown)', letterSpacing: '0.03em' }}>{entry.name}</p>
                    <p style={{ fontFamily: 'var(--font-type)', fontSize: '0.6rem', color: 'var(--tan)', marginTop: 2 }}>{entry.phone}</p>
                  </div>
                </div>
                {idx === 0 && <span className="status-next status-badge"><Icon name='navigate_next' size='sm' style={{marginRight:3}} />Tiếp Theo</span>}
                {idx === 1 && <span className="status-badge status-waiting"><Icon name='schedule' size='sm' style={{marginRight:2}} />Sắp Tới</span>}
              </div>
            ))}
          </div>
        )
      }
    </div>
  )
}
