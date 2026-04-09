import { useState } from 'react'
import Icon from './Icon'
import { QueueEntry, Room, Workshop } from '../types'

interface Props { queue: QueueEntry[]; rooms: Room[]; workshops: Workshop[]; onCancel: (id: string) => void }

export default function CheckView({ queue, rooms, workshops, onCancel }: Props) {
  const [phone, setPhone] = useState('')
  const [searched, setSearched] = useState(false)
  const [results, setResults] = useState<QueueEntry[]>([])
  const [showRefund, setShowRefund] = useState(false)
  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set())

  const handleSearch = () => {
    const found = queue.filter(q => q.phone.replace(/\s/g,'') === phone.replace(/\s/g,'') && q.status !== 'cancelled' && q.status !== 'done')
    setResults(found); setSearched(true)
  }
  const handleCancel = (id: string) => {
    onCancel(id); setResults(prev => prev.filter(e => e.id !== id)); setShowRefund(true)
  }
  const getLabel = (e: QueueEntry) => {
    if (e.serviceType === 'room') { const r = rooms.find(r => r.id === e.serviceId); return r ? `${r.name} · ${r.theme}` : e.serviceId }
    const w = workshops.find(w => w.id === e.serviceId); return w ? `${w.title}` : e.serviceId
  }
  const grouped = results.reduce((acc, e) => { if (!acc[e.guestId]) acc[e.guestId] = []; acc[e.guestId].push(e); return acc }, {} as Record<string, QueueEntry[]>)

  return (
    <div className="fade-up" style={{ maxWidth: 500, margin: '0 auto' }}>
      {/* Refund modal */}
      {showRefund && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(61,31,13,0.6)', padding: 16 }}>
          <div className="card stamp-in" style={{ padding: '32px 28px', maxWidth: 360, width: '100%', textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(44,74,44,0.15)', border: '2px solid #3a6a3a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <span style={{ color: '#3a6a3a', fontSize: '1.2rem' }}>✓</span>
            </div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontStyle: 'italic', color: 'var(--burgundy)', marginBottom: 6 }}>Đã Huỷ Lượt</p>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: '0.88rem', color: 'var(--tan)', fontStyle: 'italic', marginBottom: 18 }}>Lượt dịch vụ đã được huỷ thành công.</p>
            <div style={{ background: 'rgba(201,146,42,0.07)', border: '1px solid var(--amber-l)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', marginBottom: 20, textAlign: 'left' }}>
              <p style={{ fontFamily: 'var(--font-type)', fontSize: '0.62rem', color: 'var(--amber)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 5, display:'flex', alignItems:'center', gap:4 }}><Icon name='currency_exchange' size='sm' style={{color:'var(--amber)'}} /> Hoàn Tiền</p>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: '0.88rem', color: 'var(--brown-mid)', fontStyle: 'italic', lineHeight: 1.55 }}>Vui lòng liên hệ nhân viên tại quầy hoặc nhắn tin qua Instagram của The Filmer để được hoàn lại tiền.</p>
            </div>
            <button onClick={() => setShowRefund(false)} className="btn-stamp"
              style={{ width: '100%', padding: '11px', background: 'var(--burgundy)', color: 'var(--cream)', borderColor: 'var(--burgundy-d)', boxShadow: '3px 3px 0 var(--burgundy-d)', fontSize: '0.68rem' }}>
              Đã Hiểu
            </button>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: '26px 22px' }}>
        <div style={{ marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid var(--cream-deep)' }}>
          <p className="section-label" style={{ marginBottom: 4 }}>Tra Cứu</p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontStyle: 'italic', color: 'var(--burgundy)' }}>Kiểm Tra & Huỷ</p>
        </div>
        <div style={{ background: 'rgba(201,146,42,0.06)', border: '1px solid var(--amber-l)', borderLeft: '3px solid var(--amber)', borderRadius: '0 var(--radius-sm) var(--radius-sm) 0', padding: '10px 14px', marginBottom: 18 }}>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: '0.86rem', color: 'var(--brown-mid)', fontStyle: 'italic', lineHeight: 1.5 }}>Nhập số điện thoại để xem lượt đặt. Mỗi dịch vụ có thể huỷ riêng.</p>
        </div>
        <p className="section-label" style={{ marginBottom: 6 }}>Số Điện Thoại</p>
        <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Nhập số đã đăng ký" type="tel"
          onKeyDown={e => e.key === 'Enter' && handleSearch()} className="input-base" style={{ marginBottom: 12 }} />
        <button onClick={handleSearch} className="btn-stamp"
          style={{ width: '100%', padding: '11px', background: 'var(--brown)', color: 'var(--cream)', borderColor: '#1a0a03', boxShadow: '3px 3px 0 #1a0a03', fontSize: '0.68rem' }}>
          Kiểm Tra
        </button>

        {searched && (
          <div style={{ marginTop: 20 }}>
            {Object.keys(grouped).length === 0
              ? (
                <div className="empty-state">
                  <div className="empty-state-bg"><span>Không Tìm Thấy</span></div>
                  <p className="empty-state-text">Không tìm thấy lượt đặt nào đang chờ</p>
                </div>
              )
              : Object.entries(grouped).map(([gId, entries]) => (
                  <div key={gId} className="slide-in" style={{ marginBottom: 12, border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: '2px 2px 0 var(--cream-deep)' }}>
                    <div style={{ background: 'var(--brown)', padding: '8px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p style={{ fontFamily: 'var(--font-type)', fontSize: '0.72rem', color: 'var(--cream)', letterSpacing: '0.05em' }}>{entries[0].name}</p>
                      <p style={{ fontFamily: 'var(--font-type)', fontSize: '0.62rem', color: 'rgba(242,232,217,0.55)' }}>{entries[0].paymentMethod === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'}</p>
                    </div>
                    {entries.map((entry, idx) => (
                      <div key={entry.id} className={approvedIds.has(entry.id) ? 'flash-approved' : ''} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: idx < entries.length - 1 ? '1px solid var(--cream-deep)' : 'none', background: 'white' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div>
                            <p style={{ fontFamily: 'var(--font-type)', fontSize: '0.5rem', color: 'var(--tan)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>No.</p>
                            <p className="ticket-number" style={{ fontSize: '1.9rem' }}>{String(entry.number).padStart(2,'0')}</p>
                          </div>
                          <div>
                            <p style={{ fontFamily: 'var(--font-type)', fontSize: '0.7rem', color: 'var(--brown)', letterSpacing: '0.03em' }}>{getLabel(entry)}</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                              <span className={`status-badge ${entry.status === 'serving' ? 'status-serving' : entry.status === 'pending' ? 'status-pending' : 'status-waiting'}`}>
                                {entry.status === 'serving' ? <><Icon name='play_circle' size='sm' style={{marginRight:3}} />Đang phục vụ</> : entry.status === 'pending' ? <><Icon name='hourglass_top' size='sm' style={{marginRight:3}} />Chờ duyệt</> : <><Icon name='schedule' size='sm' style={{marginRight:3}} />Đang chờ</>}
                              </span>
                              {entry.totalAmount > 0 && <span style={{ fontFamily: 'var(--font-type)', fontSize: '0.62rem', color: 'var(--tan)' }}>{new Intl.NumberFormat('vi-VN').format(entry.totalAmount)}đ</span>}
                            </div>
                          </div>
                        </div>
                        <button onClick={() => handleCancel(entry.id)} className="btn-stamp"
                          style={{ padding: '4px 10px', fontSize: '0.58rem', color: 'var(--burgundy)', borderColor: 'var(--burgundy)', boxShadow: '2px 2px 0 var(--burgundy)', background: 'white', flexShrink: 0, marginLeft: 8 }}>
                          × Huỷ
                        </button>
                      </div>
                    ))}
                  </div>
                ))
            }
          </div>
        )}
      </div>
    </div>
  )
}
