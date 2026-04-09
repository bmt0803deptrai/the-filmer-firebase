import { useState } from 'react'
import { QueueEntry, Room, Workshop } from '../types'
import Icon from './Icon'
import StatsPanel from './StatsPanel'

interface Props {
  queue: QueueEntry[]; rooms: Room[]; workshops: Workshop[]
  history: Record<string, QueueEntry[]>
  adminPw: string; settingsPw: string
  onUpdatePasswords: (adminPw: string, settingsPw: string) => void
  onApprove: (id: string) => void; onServeNext: (serviceId: string) => void
  onServeSpecific: (entryId: string, serviceId: string) => void
  onCancel: (id: string) => void; onReset: (serviceId: string) => void
  onUpdateSettings: (rooms: Room[], workshops: Workshop[]) => void
}


const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ'
const fmtTime = (d: Date) => new Date(d).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

function SL({ children }: { children: React.ReactNode }) {
  return <p style={{ fontFamily: 'var(--font-type)', fontSize: '0.62rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--tan)', marginBottom: 6 }}>{children}</p>
}
function DR({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0 10px' }}>
      <div style={{ flex: 1, height: 1, background: 'var(--amber-l)', opacity: 0.5 }} />
      <p style={{ fontFamily: 'var(--font-type)', fontSize: '0.62rem', letterSpacing: '0.2em', color: 'var(--tan)', textTransform: 'uppercase' }}>{children}</p>
      <div style={{ flex: 1, height: 1, background: 'var(--amber-l)', opacity: 0.5 }} />
    </div>
  )
}

// ─── Service Panel ────────────────────────────────────────────────────────────
function ServicePanel({ serviceId, label, queue, onApprove, onServeNext, onServeSpecific, onCancel, rooms }: {
  serviceId: string; label: string; queue: QueueEntry[]
  onApprove: (id: string) => void; onServeNext: (id: string) => void
  onServeSpecific: (eId: string, sId: string) => void; onCancel: (id: string) => void
  rooms: Room[]
}) {
  const pending = queue.filter(q => q.serviceId === serviceId && q.status === 'pending').sort((a, b) => a.number - b.number)
  const waiting = queue.filter(q => q.serviceId === serviceId && q.status === 'waiting').sort((a, b) => a.number - b.number)
  const serving = queue.find(q => q.serviceId === serviceId && q.status === 'serving')
  const room = rooms.find(r => r.id === serviceId)
  const total = queue.filter(q => q.serviceId === serviceId && q.status !== 'cancelled').length

  return (
    <div className="card" style={{ padding: '18px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid var(--cream-deep)' }}>
        <div>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontStyle: 'italic', color: 'var(--burgundy)' }}>{label}</p>
          <p style={{ fontFamily: 'var(--font-type)', fontSize: '0.6rem', color: 'var(--tan)', marginTop: 2 }}>
            P/v: <strong style={{ color: 'var(--amber)' }}>{String(room?.currentNumber ?? serving?.number ?? 0).padStart(2, '0')}</strong> · Tổng: <strong>{total}</strong>
          </p>
        </div>
        {pending.length > 0 && (
          <span className="pulse-amber" style={{ background: 'var(--amber)', color: 'var(--brown)', fontFamily: 'var(--font-type)', fontSize: '0.62rem', padding: '3px 8px', borderRadius: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icon name="hourglass_top" size="sm" filled style={{ color: 'var(--brown)' }} />{pending.length} chờ duyệt
          </span>
        )}
      </div>

      {/* Pending */}
      {pending.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <SL>Chờ Duyệt</SL>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {pending.map(entry => (
              <div key={entry.id} className="slide-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fffbf0', border: '1px solid var(--amber-l)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <p className="ticket-no ticket-number" style={{ fontSize: '1.5rem', minWidth: 28 }}>{String(entry.number).padStart(2, '0')}</p>
                  <div>
                    <p style={{ fontFamily: 'var(--font-type)', fontSize: '0.7rem', color: 'var(--brown)' }}>{entry.name}</p>
                    <p style={{ fontFamily: 'var(--font-type)', fontSize: '0.6rem', color: 'var(--tan)', marginTop: 1 }}>{entry.phone} · {entry.paymentMethod === 'cash' ? 'T.mặt' : 'C.khoản'}{entry.totalAmount > 0 ? ' · ' + fmt(entry.totalAmount) : ''}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 5 }}>
                  <button onClick={() => onApprove(entry.id)} className="btn-stamp" style={{ padding: '4px 10px', fontSize: '0.6rem', background: '#1a4a1a', color: 'var(--cream)', borderColor: '#0d2a0d', boxShadow: '2px 2px 0 #0d2a0d', display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Icon name="check_circle" size="sm" /> Duyệt
                  </button>
                  <button onClick={() => onCancel(entry.id)} className="btn-stamp" style={{ padding: '4px 8px', fontSize: '0.6rem', color: 'var(--burgundy)', borderColor: 'var(--burgundy)', boxShadow: '2px 2px 0 var(--burgundy)', background: 'white' }}>
                    <Icon name="close" size="sm" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Serve next */}
      <button onClick={() => onServeNext(serviceId)} className="btn-stamp"
        style={{ width: '100%', padding: '10px', marginBottom: 12, background: 'var(--brown)', color: 'var(--cream)', borderColor: '#1a0a03', boxShadow: '3px 3px 0 #1a0a03', fontSize: '0.66rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <Icon name="skip_next" size="sm" /> Phục Vụ Số Tiếp Theo
      </button>

      {/* Queue */}
      <SL>Hàng Chờ Chính Thức ({waiting.length})</SL>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 240, overflowY: 'auto' }}>
        {serving && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--burgundy)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <p style={{ fontFamily: "'Courier Prime',monospace", fontWeight: 700, fontSize: '1.5rem', color: 'var(--amber)', lineHeight: 1 }}>{String(serving.number).padStart(2, '0')}</p>
              <div>
                <p style={{ fontFamily: 'var(--font-type)', fontSize: '0.7rem', color: 'var(--cream)' }}>{serving.name}</p>
                <p style={{ fontFamily: 'var(--font-type)', fontSize: '0.58rem', color: 'rgba(242,232,217,0.55)', marginTop: 1 }}>{serving.phone} · {fmtTime(serving.joinedAt)}</p>
              </div>
            </div>
            <span className="status-serving status-badge">Đang phục vụ</span>
          </div>
        )}
        {waiting.map(entry => (
          <div key={entry.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', padding: '7px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <p className="ticket-no ticket-number" style={{ fontSize: '1.4rem', minWidth: 28 }}>{String(entry.number).padStart(2, '0')}</p>
              <div>
                <p style={{ fontFamily: 'var(--font-type)', fontSize: '0.68rem', color: 'var(--brown)' }}>{entry.name}</p>
                <p style={{ fontFamily: 'var(--font-type)', fontSize: '0.58rem', color: 'var(--tan)', marginTop: 1 }}>{entry.phone} · {fmtTime(entry.joinedAt)}</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => onServeSpecific(entry.id, serviceId)} className="btn-stamp" style={{ padding: '3px 8px', fontSize: '0.58rem', background: 'var(--brown-mid)', color: 'var(--cream)', borderColor: 'var(--brown)', boxShadow: '2px 2px 0 var(--brown)', display: 'flex', alignItems: 'center', gap: 2 }}>
                <Icon name="play_arrow" size="sm" /> Phục vụ
              </button>
              <button onClick={() => onCancel(entry.id)} className="btn-stamp" style={{ padding: '3px 7px', fontSize: '0.58rem', color: 'var(--burgundy)', borderColor: 'var(--burgundy)', boxShadow: '2px 2px 0 var(--burgundy)', background: 'white' }}>
                <Icon name="close" size="sm" />
              </button>
            </div>
          </div>
        ))}
        {!serving && !waiting.length && (
          <div className="empty-state" style={{ padding: '12px 0' }}>
            <div className="empty-state-bg"><span>Trống</span></div>
            <p className="empty-state-text">Không có khách</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Change Password Section ─────────────────────────────────────────────────
function ChangePasswordSection({ adminPw, settingsPw, onSave }: { adminPw: string; settingsPw: string; onSave: (a: string, s: string) => void }) {
  const [tab, setTab] = useState<'admin' | 'settings'>('admin')
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const reset = () => { setCurrent(''); setNext(''); setConfirm(''); setMsg(null) }

  const handleChange = () => {
    const currentPW = tab === 'admin' ? adminPw : settingsPw
    if (current !== currentPW) { setMsg({ type: 'err', text: 'Mật khẩu hiện tại không đúng.' }); return }
    if (next.length < 4) { setMsg({ type: 'err', text: 'Mật khẩu mới phải có ít nhất 4 ký tự.' }); return }
    if (next !== confirm) { setMsg({ type: 'err', text: 'Xác nhận mật khẩu không khớp.' }); return }
    const newAdmin = tab === 'admin' ? next : adminPw
    const newSettings = tab === 'settings' ? next : settingsPw
    onSave(newAdmin, newSettings)
    setMsg({ type: 'ok', text: 'Đổi mật khẩu thành công!' })
    setTimeout(() => { reset() }, 1500)
  }

  return (
    <div className="card" style={{ padding: '14px' }}>
      <DecoRule><><Icon name="lock" size="sm" style={{ marginRight: 4, color: 'var(--tan)' }} /><span> Đổi Mật Khẩu</span></></DecoRule>

      {/* Tab: admin vs settings */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {(['admin', 'settings'] as const).map(t => (
          <button key={t} onClick={() => { setTab(t); reset() }}
            style={{
              padding: '5px 14px', cursor: 'pointer', borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--font-type)', fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase',
              background: tab === t ? 'var(--brown)' : 'white',
              color: tab === t ? 'var(--cream)' : 'var(--tan)',
              border: `1.5px solid ${tab === t ? 'var(--brown)' : 'var(--border)'}`,
            }}>
            {t === 'admin' ? 'Quản lý' : 'Cài đặt'}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          ['Mật khẩu hiện tại', current, setCurrent],
          ['Mật khẩu mới', next, setNext],
          ['Xác nhận mật khẩu mới', confirm, setConfirm],
        ].map(([label, val, setter]) => (
          <div key={label as string}>
            <SectionLabel>{label as string}</SectionLabel>
            <input type="password" value={val as string}
              onChange={e => (setter as (v: string) => void)(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleChange()}
              className="input-base" style={{ marginTop: 4 }} />
          </div>
        ))}
      </div>

      {msg && (
        <div style={{ marginTop: 10, padding: '7px 12px', borderRadius: 'var(--radius-sm)', background: msg.type === 'ok' ? 'rgba(44,100,44,0.08)' : 'rgba(123,28,44,0.07)', border: `1px solid ${msg.type === 'ok' ? '#3a6a3a' : 'var(--burgundy)'}` }}>
          <p style={{ fontFamily: 'var(--font-type)', fontSize: '0.65rem', color: msg.type === 'ok' ? '#2a5a2a' : 'var(--burgundy)', letterSpacing: '0.05em' }}>
            {msg.type === 'ok' ? '✓ ' : '✕ '}{msg.text}
          </p>
        </div>
      )}

      <button onClick={handleChange} className="btn-stamp"
        style={{ marginTop: 12, width: '100%', padding: '9px', background: 'var(--brown)', color: 'var(--cream)', borderColor: '#1a0a03', boxShadow: '3px 3px 0 #1a0a03', fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
        <Icon name="lock_open" size="sm" /> Đổi Mật Khẩu
      </button>
    </div>
  )
}

// ─── Settings Panel ───────────────────────────────────────────────────────────
function SettingsPanel({ rooms, workshops, adminPw, settingsPw, onSaveSettings, onSavePasswords }: { rooms: Room[]; workshops: Workshop[]; adminPw: string; settingsPw: string; onSaveSettings: (r: Room[], w: Workshop[]) => void; onSavePasswords: (a: string, s: string) => void }) {
  const [pw, setPw] = useState(''); const [unlocked, setUnlocked] = useState(false); const [pwErr, setPwErr] = useState(false)
  const [editRooms, setEditRooms] = useState(rooms.map(r => ({ ...r })))
  const [editWs, setEditWs] = useState(workshops.map(w => ({ ...w })))
  const [saved, setSaved] = useState(false)
  const selfbooths = editRooms.filter(r => r.type === 'selfbooth')
  const photobooths = editRooms.filter(r => r.type === 'photobooth')
  const selfboothPrice = selfbooths[0]?.price ?? 0
  const setSBPrice = (p: number) => setEditRooms(prev => prev.map(r => r.type === 'selfbooth' ? { ...r, price: p } : r))

  if (!unlocked) return (
    <div className="card" style={{ padding: '28px 24px', maxWidth: 480, margin: '0 auto' }}>
      <SL>Xác Thực</SL>
      <p className="display-text" style={{ fontSize: '1.6rem', fontStyle: 'italic', color: 'var(--burgundy)', marginBottom: 16 }}>Cài Đặt</p>
      <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="Mật khẩu cài đặt"
        onKeyDown={e => e.key === 'Enter' && (pw === settingsPw ? (setUnlocked(true), setPwErr(false)) : setPwErr(true))}
        className="input-base" style={{ marginBottom: 10 }} />
      {pwErr && <p style={{ fontFamily: 'var(--font-type)', fontSize: '0.65rem', color: 'var(--burgundy)', marginBottom: 8 }}>Sai mật khẩu. (Mặc định: 5678)</p>}
      <button onClick={() => pw === settingsPw ? (setUnlocked(true), setPwErr(false)) : setPwErr(true)} className="btn-stamp"
        style={{ width: '100%', padding: '11px', background: 'var(--brown)', color: 'var(--cream)', borderColor: '#1a0a03', boxShadow: '3px 3px 0 #1a0a03', fontSize: '0.68rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
        <Icon name="lock_open" size="sm" /> Mở Khoá
      </button>
    </div>
  )

  const handleSave = () => { onSaveSettings(editRooms, editWs); setSaved(true); setTimeout(() => setSaved(false), 2000) }

  return (
    <div className="card" style={{ padding: '22px 18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, paddingBottom: 12, borderBottom: '1px solid var(--cream-deep)' }}>
        <p className="display-text" style={{ fontSize: '1.6rem', fontStyle: 'italic', color: 'var(--burgundy)' }}>Cài Đặt</p>
        <button onClick={handleSave} className="btn-stamp"
          style={{ padding: '7px 16px', fontSize: '0.64rem', background: saved ? '#1a4a1a' : 'var(--burgundy)', color: 'var(--cream)', borderColor: saved ? '#0d2a0d' : 'var(--burgundy-d)', boxShadow: '2px 2px 0 ' + (saved ? '#0d2a0d' : 'var(--burgundy-d)'), display: 'flex', alignItems: 'center', gap: 4 }}>
          <Icon name={saved ? 'check' : 'save'} size="sm" /> {saved ? 'Đã Lưu' : 'Lưu'}
        </button>
      </div>

      <DR><Icon name="self_improvement" size="sm" style={{ marginRight: 4, color: 'var(--tan)' }} /> Selfbooth</DR>
      <div className="card" style={{ padding: '14px', marginBottom: 14 }}>
        {selfbooths.map(room => (
          <div key={room.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
            <div><SL>Tên phòng</SL><input value={room.name} onChange={e => setEditRooms(prev => prev.map(r => r.id === room.id ? { ...r, name: e.target.value } : r))} className="input-base" /></div>
            <div><SL>Tên theme</SL><input value={room.theme} onChange={e => setEditRooms(prev => prev.map(r => r.id === room.id ? { ...r, theme: e.target.value } : r))} className="input-base" /></div>
          </div>
        ))}
        <div style={{ borderTop: '1px solid var(--cream-deep)', paddingTop: 10 }}>
          <SL>Giá chung (cả 2 phòng selfbooth)</SL>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="number" value={selfboothPrice} onChange={e => setSBPrice(Number(e.target.value))} className="input-base" style={{ maxWidth: 150 }} />
            <span style={{ fontFamily: 'var(--font-type)', fontSize: '0.7rem', color: 'var(--tan)' }}>đ / lượt</span>
          </div>
        </div>
      </div>

      <DR><Icon name="photo_camera" size="sm" style={{ marginRight: 4, color: 'var(--tan)' }} /> Photobooth</DR>
      <div className="card" style={{ padding: '14px', marginBottom: 14 }}>
        {photobooths.map(room => (
          <div key={room.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div><SL>Tên phòng</SL><input value={room.name} onChange={e => setEditRooms(prev => prev.map(r => r.id === room.id ? { ...r, name: e.target.value } : r))} className="input-base" /></div>
            <div><SL>Tên theme</SL><input value={room.theme} onChange={e => setEditRooms(prev => prev.map(r => r.id === room.id ? { ...r, theme: e.target.value } : r))} className="input-base" /></div>
          </div>
        ))}
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: '0.75rem', color: 'var(--tan)', fontStyle: 'italic', marginTop: 10 }}>Chỉ thống kê số lượt, không hiển thị giá.</p>
      </div>

      <DR><Icon name="school" size="sm" style={{ marginRight: 4, color: 'var(--tan)' }} /> Workshop</DR>
      {editWs.map((ws, i) => (
        <div key={ws.id} className="card" style={{ padding: '14px', marginBottom: 10 }}>
          <div style={{ marginBottom: 8 }}><SL>Tên workshop</SL><input value={ws.title} onChange={e => setEditWs(prev => prev.map((w, j) => j === i ? { ...w, title: e.target.value } : w))} className="input-base" /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div><SL>Giá (đ)</SL><input type="number" value={ws.price} onChange={e => setEditWs(prev => prev.map((w, j) => j === i ? { ...w, price: Number(e.target.value) } : w))} className="input-base" /></div>
            <div><SL>Sức chứa</SL><input type="number" value={ws.capacity} onChange={e => setEditWs(prev => prev.map((w, j) => j === i ? { ...w, capacity: Number(e.target.value) } : w))} className="input-base" /></div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ManagementView({ queue, rooms, workshops, history, adminPw, settingsPw, onUpdatePasswords, onApprove, onServeNext, onServeSpecific, onCancel, onReset, onUpdateSettings }: Props) {
  const [authed, setAuthed] = useState(false)
  const [pw, setPw] = useState(''); const [pwErr, setPwErr] = useState(false)
  const [activeTab, setActiveTab] = useState<'rooms' | 'stats' | 'settings'>('rooms')
  const [activeServiceId, setActiveServiceId] = useState(rooms[0]?.id ?? '')

  const allServices = [
    ...rooms.map(r => ({ id: r.id, label: r.name + ' · ' + r.theme, icon: r.type === 'photobooth' ? 'photo_camera' : 'self_improvement' })),
    ...workshops.map(w => ({ id: w.id, label: w.title, icon: 'school' })),
  ]

  if (!authed) return (
    <div className="fade-up" style={{ maxWidth: 360, margin: '40px auto', textAlign: 'center' }}>
      <div className="card" style={{ padding: '36px 28px' }}>
        <Icon name="lock" size="lg" style={{ color: 'var(--tan)', marginBottom: 12, display: 'block' }} />
        <SL>Khu Vực Nhân Viên</SL>
        <p className="display-text" style={{ fontSize: '1.8rem', fontStyle: 'italic', color: 'var(--burgundy)', marginBottom: 20 }}>Quản Lý</p>
        <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="Nhập mật khẩu"
          onKeyDown={e => e.key === 'Enter' && (pw === adminPw ? (setAuthed(true), setPwErr(false)) : setPwErr(true))}
          className="input-base" style={{ textAlign: 'center', marginBottom: 10 }} />
        {pwErr && <p style={{ fontFamily: 'var(--font-type)', fontSize: '0.65rem', color: 'var(--burgundy)', marginBottom: 8 }}>Sai mật khẩu. (Mặc định: 1234)</p>}
        <button onClick={() => pw === adminPw ? (setAuthed(true), setPwErr(false)) : setPwErr(true)} className="btn-stamp"
          style={{ width: '100%', padding: '12px', background: 'var(--brown)', color: 'var(--cream)', borderColor: '#1a0a03', boxShadow: '4px 4px 0 #1a0a03', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <Icon name="login" size="sm" /> Xác Nhận
        </button>
      </div>
    </div>
  )

  return (
    <div className="fade-up">
      {/* Main tabs */}
      <div style={{ display: 'flex', borderBottom: '2px solid var(--brown)', marginBottom: 20 }}>
        {([['rooms', 'Quản Lý', 'manage_accounts'], ['stats', 'Thống Kê', 'bar_chart'], ['settings', 'Cài Đặt', 'settings']] as const).map(([id, label, icon]) => (
          <button key={id} onClick={() => setActiveTab(id)} style={{
            position: 'relative', padding: '10px 18px', cursor: 'pointer',
            fontFamily: 'var(--font-type)', fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase',
            background: activeTab === id ? 'var(--brown)' : 'transparent',
            color: activeTab === id ? 'var(--cream)' : 'var(--tan)',
            border: 'none', borderBottom: '2px solid ' + (activeTab === id ? 'var(--amber)' : 'transparent'),
            marginBottom: -2, borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
            transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 5,
          }}>
            {activeTab === id && <span className="nav-active-dot" />}
            <Icon name={icon} size="sm" /> {label}
          </button>
        ))}
      </div>

      {activeTab === 'rooms' && (
        <>
          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(' + allServices.length + ',1fr)', gap: 8, marginBottom: 14 }}>
            {allServices.map(svc => {
              const pCount = queue.filter(q => q.serviceId === svc.id && q.status === 'pending').length
              const wCount = queue.filter(q => q.serviceId === svc.id && q.status === 'waiting').length
              const total = queue.filter(q => q.serviceId === svc.id && q.status !== 'cancelled').length
              const isActive = activeServiceId === svc.id
              const isRoom = !!rooms.find(r => r.id === svc.id)
              return (
                <div key={svc.id} onClick={() => setActiveServiceId(svc.id)}
                  style={{ position: 'relative', padding: '12px 10px', textAlign: 'center', cursor: 'pointer', borderRadius: 'var(--radius-sm)',
                    background: isActive ? 'var(--burgundy)' : 'var(--cream-dark)',
                    border: '2px solid ' + (isActive ? 'var(--burgundy-d)' : 'var(--border)'),
                    boxShadow: isActive ? '3px 3px 0 var(--burgundy-d)' : '2px 2px 0 var(--cream-deep)',
                    transition: 'all 0.1s ease' }}>
                  {pCount > 0 && <span className="pulse-amber" style={{ position: 'absolute', top: 5, right: 5, background: 'var(--amber)', color: 'var(--brown)', fontFamily: 'var(--font-type)', fontSize: '0.56rem', padding: '1px 5px', borderRadius: 2 }}>{pCount}</span>}
                  <Icon name={svc.icon} size="md" style={{ color: isActive ? 'var(--amber-l)' : 'var(--tan)', marginBottom: 4, display: 'block', margin: '0 auto 4px' }} />
                  <p style={{ fontFamily: 'var(--font-type)', fontSize: '0.58rem', letterSpacing: '0.07em', color: isActive ? 'var(--cream-deep)' : 'var(--tan)', marginBottom: 5, textTransform: 'uppercase' }}>{svc.label}</p>
                  <p className="ticket-number" style={{ fontSize: '1.9rem', color: 'var(--amber)' }}>{wCount}</p>
                  <p style={{ fontFamily: 'var(--font-type)', fontSize: '0.55rem', color: isActive ? 'var(--cream-deep)' : 'var(--tan)', marginTop: 2 }}>chờ · {total} tổng</p>
                  {isRoom && (
                    <button onClick={e => { e.stopPropagation(); if (window.confirm('Reset ' + svc.label + '?')) onReset(svc.id) }}
                      style={{ marginTop: 6, fontFamily: 'var(--font-type)', fontSize: '0.56rem', letterSpacing: '0.08em', color: isActive ? 'rgba(242,232,217,0.5)' : 'var(--tan)', background: 'transparent', border: '1px solid ' + (isActive ? 'rgba(255,255,255,0.2)' : 'var(--border)'), padding: '2px 8px', cursor: 'pointer', borderRadius: 2 }}>
                      ↺ Reset
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          {/* Service sub-tabs */}
          <div style={{ display: 'flex', flexWrap: 'wrap', borderBottom: '1px solid var(--border)', marginBottom: 12 }}>
            {allServices.map(svc => (
              <button key={svc.id} onClick={() => setActiveServiceId(svc.id)}
                style={{ padding: '7px 14px', cursor: 'pointer', fontFamily: 'var(--font-type)', fontSize: '0.58rem', letterSpacing: '0.1em', textTransform: 'uppercase', background: activeServiceId === svc.id ? 'var(--cream-dark)' : 'transparent', color: activeServiceId === svc.id ? 'var(--brown)' : 'var(--tan)', border: 'none', borderBottom: '2px solid ' + (activeServiceId === svc.id ? 'var(--burgundy)' : 'transparent'), marginBottom: -1, borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0', transition: 'all 0.12s', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Icon name={svc.icon} size="sm" /> {svc.label}
              </button>
            ))}
          </div>

          {(() => {
            const svc = allServices.find(s => s.id === activeServiceId)
            return svc ? (
              <ServicePanel serviceId={activeServiceId} label={svc.label} queue={queue} rooms={rooms}
                onApprove={onApprove} onServeNext={onServeNext} onServeSpecific={onServeSpecific} onCancel={onCancel} />
            ) : null
          })()}
        </>
      )}
      {activeTab === 'stats' && <StatsView rooms={rooms} workshops={workshops} liveQueue={queue} />}
      {activeTab === 'settings' && <SettingsPanel rooms={rooms} workshops={workshops} adminPw={adminPw} settingsPw={settingsPw} onSaveSettings={onUpdateSettings} onSavePasswords={onUpdatePasswords} />}
    </div>
  )
}
