import { useState } from 'react'
import Icon from './Icon'
import { Room, Workshop } from '../types'

interface Props {
  rooms: Room[]
  workshops: Workshop[]
  onAdd: (name: string, phone: string, services: { serviceType: 'room' | 'workshop'; serviceId: string; amount: number }[], paymentMethod: 'cash' | 'transfer') => { guestId: string; entries: any[] }
}

const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ'

function ServiceRow({ label, sublabel, price, selected, onToggle, showPrice = true }: { label: string; sublabel?: string; price?: number; selected: boolean; onToggle: () => void; showPrice?: boolean }) {
  return (
    <button type="button" onClick={onToggle} style={{
      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 14px', textAlign: 'left', cursor: 'pointer',
      background: selected ? 'rgba(123,28,44,0.04)' : 'white',
      border: `1.5px solid ${selected ? 'var(--burgundy)' : 'var(--border)'}`,
      boxShadow: selected ? '2px 2px 0 rgba(123,28,44,0.2)' : '2px 2px 0 var(--cream-deep)',
      borderRadius: 'var(--radius-sm)', transition: 'all 0.12s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className={`check-box ${selected ? 'checked' : ''}`}>
          {selected && <span style={{ color: 'white', fontSize: '0.65rem' }}>✓</span>}
        </div>
        <div>
          <p style={{ fontFamily: 'var(--font-type)', fontSize: '0.74rem', color: 'var(--brown)', letterSpacing: '0.03em' }}>{label}</p>
          {sublabel && <p style={{ fontFamily: 'var(--font-serif)', fontSize: '0.72rem', color: 'var(--tan)', fontStyle: 'italic', marginTop: 1 }}>{sublabel}</p>}
        </div>
      </div>
      {showPrice && price !== undefined && price > 0 && (
        <span style={{ fontFamily: 'var(--font-type)', fontSize: '0.7rem', color: 'var(--amber)', letterSpacing: '0.05em', flexShrink: 0, marginLeft: 8 }}>{fmt(price)}</span>
      )}
    </button>
  )
}

export default function BookingView({ rooms, workshops, onAdd }: Props) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([])
  const [selectedWsIds, setSelectedWsIds] = useState<string[]>([])
  const [payment, setPayment] = useState<'cash' | 'transfer' | ''>('')
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ entries: { number: number; label: string; amount: number }[]; total: number } | null>(null)

  const toggleRoom = (id: string) => setSelectedRoomIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  const toggleWs = (id: string) => setSelectedWsIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  const selfbooths = rooms.filter(r => r.type === 'selfbooth')
  const photobooths = rooms.filter(r => r.type === 'photobooth')
  const total = selectedRoomIds.map(id => rooms.find(r => r.id === id)).filter(r => r?.type === 'selfbooth').reduce((s, r) => s + (r?.price ?? 0), 0)
    + selectedWsIds.map(id => workshops.find(w => w.id === id)).reduce((s, w) => s + (w?.price ?? 0), 0)
  const hasSelection = selectedRoomIds.length > 0 || selectedWsIds.length > 0

  const handleSubmit = () => {
    if (!name.trim()) { setError('Vui lòng nhập họ & tên.'); return }
    if (!phone.trim()) { setError('Vui lòng nhập số điện thoại.'); return }
    if (!hasSelection) { setError('Vui lòng chọn ít nhất một dịch vụ.'); return }
    if (!payment) { setError('Vui lòng chọn hình thức thanh toán.'); return }
    setError('')
    const services = [
      ...selectedRoomIds.map(id => { const r = rooms.find(x => x.id === id)!; return { serviceType: 'room' as const, serviceId: id, amount: r.type === 'photobooth' ? 0 : r.price } }),
      ...selectedWsIds.map(id => { const w = workshops.find(x => x.id === id)!; return { serviceType: 'workshop' as const, serviceId: id, amount: w.price } }),
    ]
    const res = onAdd(name.trim(), phone.trim(), services, payment as 'cash' | 'transfer')
    const entries = res.entries.map(e => {
      const room = rooms.find(r => r.id === e.serviceId); const ws = workshops.find(w => w.id === e.serviceId)
      return { number: e.number, label: room ? `${room.name} · ${room.theme}` : ws?.title ?? '', amount: e.totalAmount }
    })
    setResult({ entries, total })
    setName(''); setPhone(''); setSelectedRoomIds([]); setSelectedWsIds([]); setPayment('')
  }

  if (result) return (
    <div className="fade-up" style={{ maxWidth: 460, margin: '0 auto' }}>
      <div className="card" style={{ padding: '28px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <p className="section-label" style={{ marginBottom: 6 }}>The Filmer Studio</p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontStyle: 'italic', color: 'var(--burgundy)' }}>Phiếu Hàng Chờ</p>
        </div>
        {/* Perforation top */}
        <div style={{ borderTop: '2px dashed var(--border)', marginBottom: 16, paddingTop: 16 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {result.entries.map((e, i) => (
            <div key={i} className="ticket-card stamp-in" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', animationDelay: `${i * 0.08}s` }}>
              <div>
                <p className="ticket-no ticket-number" style={{ fontSize: '2.8rem' }}>{String(e.number).padStart(2, '0')}</p>
                <p style={{ fontFamily: 'var(--font-type)', fontSize: '0.65rem', color: 'var(--tan)', letterSpacing: '0.08em', marginTop: 4 }}>{e.label}</p>
              </div>
              {e.amount > 0 && <p style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontStyle: 'italic', color: 'var(--burgundy)' }}>{fmt(e.amount)}</p>}
            </div>
          ))}
        </div>
        {result.total > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '10px 2px', borderTop: '2px solid var(--brown)', borderBottom: '2px solid var(--brown)', marginBottom: 16 }}>
            <p className="section-label">Tổng thanh toán</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.7rem', fontStyle: 'italic', color: 'var(--burgundy)' }}>{fmt(result.total)}</p>
          </div>
        )}
        <div style={{ background: 'rgba(201,146,42,0.06)', border: '1px solid var(--amber-l)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 18 }}>
          <p style={{ fontFamily: 'var(--font-type)', fontSize: '0.62rem', color: 'var(--amber)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 3, display:'flex', alignItems:'center', gap:4 }}><Icon name='hourglass_top' size='sm' filled style={{color:'var(--amber)'}} /> Chờ nhân viên duyệt</p>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: '0.82rem', color: 'var(--brown-mid)', fontStyle: 'italic' }}>Mỗi dịch vụ được phục vụ riêng biệt.</p>
        </div>
        <button onClick={() => setResult(null)} className="btn-stamp"
          style={{ width: '100%', padding: '12px', background: 'var(--burgundy)', color: 'var(--cream)', borderColor: 'var(--burgundy-d)', boxShadow: '3px 3px 0 var(--burgundy-d)', fontSize: '0.68rem' }}>
          + Lấy Số Mới
        </button>
      </div>
    </div>
  )

  return (
    <div className="fade-up" style={{ maxWidth: 500, margin: '0 auto' }}>
      <div className="card" style={{ padding: '26px 22px' }}>
        <div style={{ marginBottom: 22, paddingBottom: 14, borderBottom: '1px solid var(--cream-deep)' }}>
          <p className="section-label" style={{ marginBottom: 4 }}>Đăng Ký</p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontStyle: 'italic', color: 'var(--burgundy)' }}>Lượt Chụp</p>
        </div>
        {error && (
          <div style={{ background: 'rgba(123,28,44,0.06)', borderLeft: '3px solid var(--burgundy)', padding: '8px 12px', marginBottom: 16, borderRadius: '0 var(--radius-sm) var(--radius-sm) 0' }}>
            <p style={{ fontFamily: 'var(--font-type)', fontSize: '0.68rem', color: 'var(--burgundy)', letterSpacing: '0.05em' }}>{error}</p>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <p className="section-label" style={{ marginBottom: 6 }}>Họ & Tên</p>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Nguyễn Văn A" className="input-base" />
          </div>
          <div>
            <p className="section-label" style={{ marginBottom: 6 }}>Số Điện Thoại</p>
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="0901 234 567" type="tel" className="input-base" />
          </div>

          <div>
            <div className="deco-rule"><span style={{ fontFamily: 'var(--font-type)', fontSize: '0.6rem', color: 'var(--tan)', letterSpacing: '0.18em', display:'flex', alignItems:'center', gap:4 }}><Icon name='self_improvement' size='sm' style={{color:'var(--tan)'}} /> Selfbooth</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {selfbooths.map(r => <ServiceRow key={r.id} label={`${r.name} · ${r.theme}`} price={r.price} selected={selectedRoomIds.includes(r.id)} onToggle={() => toggleRoom(r.id)} />)}
            </div>
          </div>

          <div>
            <div className="deco-rule"><span style={{ fontFamily: 'var(--font-type)', fontSize: '0.6rem', color: 'var(--tan)', letterSpacing: '0.18em', display:'flex', alignItems:'center', gap:4 }}><Icon name='photo_camera' size='sm' style={{color:'var(--tan)'}} /> Photobooth</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {photobooths.map(r => <ServiceRow key={r.id} label={`${r.name} · ${r.theme}`} selected={selectedRoomIds.includes(r.id)} onToggle={() => toggleRoom(r.id)} showPrice={false} />)}
            </div>
          </div>

          <div>
            <div className="deco-rule"><span style={{ fontFamily: 'var(--font-type)', fontSize: '0.6rem', color: 'var(--tan)', letterSpacing: '0.18em', display:'flex', alignItems:'center', gap:4 }}><Icon name='school' size='sm' style={{color:'var(--tan)'}} /> Workshop</span></div>
            {workshops.filter(w => w.registered < w.capacity).length === 0
              ? <div className="empty-state" style={{ padding: '12px 0' }}><p className="empty-state-text">Chưa có workshop nào</p></div>
              : <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {workshops.filter(w => w.registered < w.capacity).map(w => (
                    <ServiceRow key={w.id} label={w.title} sublabel={`${w.date} · ${w.time} · còn ${w.capacity - w.registered} chỗ`} price={w.price} selected={selectedWsIds.includes(w.id)} onToggle={() => toggleWs(w.id)} />
                  ))}
                </div>
            }
          </div>

          <div>
            <p className="section-label" style={{ marginBottom: 8 }}>Thanh Toán</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {([['cash', 'cash', 'Tiền mặt'], ['transfer', 'transfer', 'Chuyển khoản']] as const).map(([val, icon, label]) => (
                <button key={val} onClick={() => setPayment(val)} style={{
                  padding: '14px 8px', textAlign: 'center', cursor: 'pointer',
                  background: payment === val ? 'rgba(123,28,44,0.05)' : 'white',
                  border: `2px solid ${payment === val ? 'var(--burgundy)' : 'var(--border)'}`,
                  boxShadow: payment === val ? '3px 3px 0 rgba(123,28,44,0.2)' : '2px 2px 0 var(--cream-deep)',
                  borderRadius: 'var(--radius-sm)', transition: 'all 0.1s ease',
                }}>
                  <div style={{ marginBottom: 4 }}>{icon}</div>
                  <p style={{ fontFamily: 'var(--font-type)', fontSize: '0.62rem', color: 'var(--brown)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {hasSelection && (
          <div style={{ marginTop: 16, background: 'var(--cream-dark)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '14px 16px' }}>
            <p className="section-label" style={{ marginBottom: 10 }}>Tóm Tắt</p>
            {selectedRoomIds.map(id => { const r = rooms.find(x => x.id === id)!; return (
              <div key={id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: '0.88rem', color: 'var(--brown)', fontStyle: 'italic' }}>{r.name} · {r.theme}</span>
                <span style={{ fontFamily: 'var(--font-type)', fontSize: '0.72rem', color: r.type === 'photobooth' ? 'var(--tan)' : 'var(--brown)' }}>{r.type === 'photobooth' ? '—' : fmt(r.price)}</span>
              </div>
            )})}
            {selectedWsIds.map(id => { const w = workshops.find(x => x.id === id)!; return (
              <div key={id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: '0.88rem', color: 'var(--brown)', fontStyle: 'italic' }}>{w.title}</span>
                <span style={{ fontFamily: 'var(--font-type)', fontSize: '0.72rem', color: 'var(--brown)' }}>{fmt(w.price)}</span>
              </div>
            )})}
            {total > 0 && (
              <div style={{ borderTop: '1px solid var(--border-d)', marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <p className="section-label">Tổng</p>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontStyle: 'italic', color: 'var(--burgundy)' }}>{fmt(total)}</p>
              </div>
            )}
          </div>
        )}

        <button onClick={handleSubmit} disabled={!hasSelection} className="btn-stamp"
          style={{ width: '100%', marginTop: 18, padding: '13px', background: 'var(--brown)', color: 'var(--cream)', borderColor: '#1a0a03', boxShadow: '4px 4px 0 #1a0a03', fontSize: '0.68rem', opacity: hasSelection ? 1 : 0.4 }}>
          Lấy Số Thứ Tự
        </button>
      </div>
    </div>
  )
}
