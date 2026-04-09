import { useState } from 'react'
import { QueueEntry, Room, Workshop } from '../types'
import Icon from './Icon'

const ADMIN_PW = '1234'
const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ'
const fmtT = (d: Date) => new Date(d).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

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

export function exportExcel(queue: QueueEntry[], rooms: Room[], workshops: Workshop[], label = 'export') {
  const getLabel = (e: QueueEntry) => {
    if (e.serviceType === 'room') { const r = rooms.find(x => x.id === e.serviceId); return r ? r.name + ' – ' + r.theme : e.serviceId }
    const w = workshops.find(x => x.id === e.serviceId); return w ? w.title : e.serviceId
  }
  const getType = (e: QueueEntry) => {
    if (e.serviceType === 'workshop') return 'Workshop'
    const r = rooms.find(x => x.id === e.serviceId); return r?.type === 'photobooth' ? 'Photobooth' : 'Selfbooth'
  }
  const rows = queue.filter(q => q.status !== 'cancelled' && q.status !== 'pending').map(q => ({
    'STT': q.number, 'Họ & Tên': q.name, 'Số điện thoại': q.phone,
    'Loại': getType(q), 'Dịch vụ': getLabel(q),
    'Thanh toán': q.paymentMethod === 'cash' ? 'Tiền mặt' : 'Chuyển khoản',
    'Tổng tiền': q.totalAmount,
    'Giờ đặt': fmtT(q.joinedAt),
    'Giờ duyệt': q.approvedAt ? fmtT(q.approvedAt) : '—',
    'Giờ p/v': q.servedAt ? fmtT(q.servedAt) : '—',
    'Trạng thái': q.status === 'done' ? 'Xong' : q.status === 'serving' ? 'Đang p/v' : 'Đang chờ',
  }))
  const cancelled = queue.filter(q => q.status === 'cancelled').map(q => ({
    'STT': q.number, 'Họ & Tên': q.name, 'Số điện thoại': q.phone,
    'Loại': getType(q), 'Dịch vụ': getLabel(q),
    'Thanh toán': q.paymentMethod === 'cash' ? 'Tiền mặt' : 'Chuyển khoản',
    'Tổng tiền': 0, 'Giờ đặt': fmtT(q.joinedAt), 'Giờ duyệt': '—', 'Giờ p/v': '—', 'Trạng thái': 'Đã huỷ',
  }))
  const allRows = [...rows, ...cancelled]
  if (!allRows.length) { alert('Chưa có dữ liệu.'); return }
  const headers = Object.keys(allRows[0])
  const csvRows = [headers.join(','), ...allRows.map(r => headers.map(h => {
    const v = String((r as Record<string,unknown>)[h]); return v.includes(',') || v.includes('"') ? '"' + v.replace(/"/g, '""') + '"' : v
  }).join(','))]
  const totalRev = rows.filter(r => r['Loại'] !== 'Photobooth').reduce((s, r) => s + r['Tổng tiền'], 0)
  const cashRev = queue.filter(q => q.paymentMethod === 'cash' && q.status !== 'cancelled' && q.status !== 'pending' && getType(q) !== 'Photobooth').reduce((s, q) => s + q.totalAmount, 0)
  csvRows.push('', '=== THỐNG KÊ ===',
    'Selfbooth,' + rows.filter(r => r['Loại'] === 'Selfbooth').length,
    'Photobooth,' + rows.filter(r => r['Loại'] === 'Photobooth').length,
    'Workshop,' + rows.filter(r => r['Loại'] === 'Workshop').length,
    'Huỷ,' + cancelled.length,
    '', '=== DOANH THU ===',
    'Tổng,' + totalRev, 'Tiền mặt,' + cashRev, 'Chuyển khoản,' + (totalRev - cashRev))
  const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob); const a = document.createElement('a')
  a.href = url; a.download = 'the-filmer-' + label + '.csv'; a.click(); URL.revokeObjectURL(url)
}

export default function StatsPanel({ queue, rooms, workshops }: { queue: QueueEntry[]; rooms: Room[]; workshops: Workshop[] }) {
  const [pw, setPw] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [pwErr, setPwErr] = useState(false)
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')
  const [filteredQueue, setFilteredQueue] = useState(null as (QueueEntry[] | null))

  if (!unlocked) return (
    <div className="card" style={{ padding: '28px 24px', maxWidth: 480, margin: '0 auto' }}>
      <SL>Xác Thực</SL>
      <p className="display-text" style={{ fontSize: '1.6rem', fontStyle: 'italic', color: 'var(--burgundy)', marginBottom: 16 }}>Thống Kê</p>
      <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="Mật khẩu"
        onKeyDown={e => e.key === 'Enter' && (pw === ADMIN_PW ? (setUnlocked(true), setPwErr(false)) : setPwErr(true))}
        className="input-base" style={{ marginBottom: 10 }} />
      {pwErr && <p style={{ fontFamily: 'var(--font-type)', fontSize: '0.65rem', color: 'var(--burgundy)', marginBottom: 8 }}>Sai mật khẩu. (Mặc định: 1234)</p>}
      <button onClick={() => pw === ADMIN_PW ? (setUnlocked(true), setPwErr(false)) : setPwErr(true)} className="btn-stamp"
        style={{ width: '100%', padding: '11px', background: 'var(--brown)', color: 'var(--cream)', borderColor: '#1a0a03', boxShadow: '3px 3px 0 #1a0a03', fontSize: '0.68rem' }}>
        <Icon name="bar_chart" size="sm" style={{ marginRight: 5 }} /> Xem Thống Kê
      </button>
    </div>
  )

  const active = queue.filter(q => q.status !== 'cancelled' && q.status !== 'pending')
  const cancelled = queue.filter(q => q.status === 'cancelled')
  const getType = (e: QueueEntry) => {
    if (e.serviceType === 'workshop') return 'workshop'
    return rooms.find(r => r.id === e.serviceId)?.type ?? 'selfbooth'
  }
  const selfboothActive = active.filter(q => getType(q) === 'selfbooth')
  const photoboothActive = active.filter(q => getType(q) === 'photobooth')
  const workshopActive = active.filter(q => getType(q) === 'workshop')
  const totalRevenue = [...selfboothActive, ...workshopActive].reduce((s, q) => s + q.totalAmount, 0)
  const cashRevenue = active.filter(q => getType(q) !== 'photobooth' && q.paymentMethod === 'cash').reduce((s, q) => s + q.totalAmount, 0)
  const transferRevenue = totalRevenue - cashRevenue
  const roomStats = rooms.filter(r => r.type === 'selfbooth').map(r => ({
    ...r,
    count: active.filter(q => q.serviceId === r.id).length,
    revenue: active.filter(q => q.serviceId === r.id).reduce((s, q) => s + q.totalAmount, 0),
  }))
  const photoStats = rooms.filter(r => r.type === 'photobooth').map(r => ({ ...r, count: active.filter(q => q.serviceId === r.id).length }))
  const wsStats = workshops.map(w => ({
    ...w,
    count: active.filter(q => q.serviceId === w.id).length,
    revenue: active.filter(q => q.serviceId === w.id).reduce((s, q) => s + q.totalAmount, 0),
  }))

  // Date key helpers
  const dateKey = (d: Date) => new Date(d).toISOString().slice(0, 10)
  const weekStart = (d: Date) => {
    const dt = new Date(d); dt.setHours(0, 0, 0, 0)
    const day = dt.getDay(); dt.setDate(dt.getDate() - day + (day === 0 ? -6 : 1))
    return dt.toISOString().slice(0, 10)
  }
  const monthKey = (d: Date) => new Date(d).toISOString().slice(0, 7)

  // Build week/month maps
  const wkMap: {[k: string]: {ok: number; cancelled: number}} = {}
  const moMap: {[k: string]: {ok: number; cancelled: number}} = {}
  queue.filter(q => q.status !== 'pending').forEach(q => {
    const wk = weekStart(q.joinedAt)
    if (!wkMap[wk]) wkMap[wk] = { ok: 0, cancelled: 0 }
    const mo = monthKey(q.joinedAt)
    if (!moMap[mo]) moMap[mo] = { ok: 0, cancelled: 0 }
    if (q.status === 'cancelled') { wkMap[wk].cancelled++; moMap[mo].cancelled++ }
    else { wkMap[wk].ok++; moMap[mo].ok++ }
  })
  const weekEntries = Object.entries(wkMap).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 4)
  const monthEntries = Object.entries(moMap).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 6)

  // Build day map
  const dayMap: {[k: string]: QueueEntry[]} = {}
  queue.filter(q => q.status !== 'pending').forEach(q => {
    const dk = dateKey(q.joinedAt)
    if (!dayMap[dk]) dayMap[dk] = []
    dayMap[dk].push(q)
  })
  const dayEntries = Object.entries(dayMap).sort((a, b) => b[0].localeCompare(a[0]))

  const applyFilter = () => {
    if (!filterFrom && !filterTo) { setFilteredQueue(null); return }
    const from = filterFrom ? new Date(filterFrom) : new Date('2000-01-01')
    const to = filterTo ? new Date(filterTo + 'T23:59:59') : new Date('2099-12-31')
    setFilteredQueue(queue.filter(q => new Date(q.joinedAt) >= from && new Date(q.joinedAt) <= to))
  }

  const buildDisplay = (entries: QueueEntry[]) => {
    const m: {[k: string]: QueueEntry[]} = {}
    entries.filter(q => q.status !== 'pending').forEach(q => {
      const dk = dateKey(q.joinedAt)
      if (!m[dk]) m[dk] = []
      m[dk].push(q)
    })
    return Object.entries(m).sort((a, b) => b[0].localeCompare(a[0]))
  }
  const displayDays = filteredQueue ? buildDisplay(filteredQueue) : dayEntries

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* KPI + Revenue */}
      <div className="card" style={{ padding: '20px' }}>
        <p className="display-text" style={{ fontSize: '1.6rem', fontStyle: 'italic', color: 'var(--burgundy)', marginBottom: 16 }}>Thống Kê & Doanh Thu</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 16 }}>
          {[{ l: 'Selfbooth', v: selfboothActive.length }, { l: 'Photobooth', v: photoboothActive.length }, { l: 'Workshop', v: workshopActive.length }, { l: 'Tổng huỷ', v: cancelled.length }].map(({ l, v }) => (
            <div key={l} style={{ background: 'var(--cream-dark)', border: '1px solid var(--border)', padding: '12px 8px', textAlign: 'center', borderRadius: 'var(--radius-sm)' }}>
              <p className="ticket-number" style={{ fontSize: '1.8rem' }}>{v}</p>
              <p className="section-label" style={{ marginTop: 4 }}>{l}</p>
            </div>
          ))}
        </div>
        <DR>Doanh Thu (Selfbooth + Workshop)</DR>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 16 }}>
          <div style={{ background: 'var(--burgundy)', padding: '14px 10px', textAlign: 'center', boxShadow: '3px 3px 0 var(--burgundy-d)', borderRadius: 'var(--radius-sm)' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontStyle: 'italic', color: 'var(--amber)', lineHeight: 1 }}>{fmt(totalRevenue)}</p>
            <p style={{ fontFamily: 'var(--font-type)', fontSize: '0.55rem', color: 'var(--cream-deep)', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 4 }}>Tổng</p>
          </div>
          <div style={{ background: 'var(--cream-dark)', border: '1px solid var(--border)', padding: '14px 10px', textAlign: 'center', borderRadius: 'var(--radius-sm)' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontStyle: 'italic', color: 'var(--brown)', lineHeight: 1 }}>{fmt(cashRevenue)}</p>
            <p className="section-label" style={{ marginTop: 4 }}>Tiền mặt</p>
          </div>
          <div style={{ background: 'var(--cream-dark)', border: '1px solid var(--border)', padding: '14px 10px', textAlign: 'center', borderRadius: 'var(--radius-sm)' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontStyle: 'italic', color: 'var(--brown)', lineHeight: 1 }}>{fmt(transferRevenue)}</p>
            <p className="section-label" style={{ marginTop: 4 }}>Chuyển khoản</p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <SL>Selfbooth</SL>
            {roomStats.map(r => (
              <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid var(--cream-deep)' }}>
                <div>
                  <p style={{ fontFamily: 'var(--font-serif)', fontSize: '0.82rem', fontStyle: 'italic', color: 'var(--brown)' }}>{r.theme}</p>
                  <p style={{ fontFamily: 'var(--font-type)', fontSize: '0.58rem', color: 'var(--tan)' }}>{r.count} lượt</p>
                </div>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', fontStyle: 'italic', color: 'var(--burgundy)' }}>{fmt(r.revenue)}</p>
              </div>
            ))}
            <div style={{ marginTop: 8 }}>
              <SL>Photobooth</SL>
              {photoStats.map(r => (
                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--cream-deep)' }}>
                  <p style={{ fontFamily: 'var(--font-serif)', fontSize: '0.82rem', fontStyle: 'italic', color: 'var(--brown)' }}>{r.theme}</p>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', fontStyle: 'italic', color: 'var(--amber)' }}>{r.count} lượt</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <SL>Workshop</SL>
            {wsStats.filter(w => w.count > 0).map(w => (
              <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid var(--cream-deep)' }}>
                <div>
                  <p style={{ fontFamily: 'var(--font-type)', fontSize: '0.65rem', color: 'var(--brown)' }}>{w.title}</p>
                  <p style={{ fontFamily: 'var(--font-type)', fontSize: '0.58rem', color: 'var(--tan)' }}>{w.count} người</p>
                </div>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', fontStyle: 'italic', color: 'var(--burgundy)' }}>{fmt(w.revenue)}</p>
              </div>
            ))}
            {wsStats.every(w => w.count === 0) && <p style={{ fontFamily: 'var(--font-serif)', fontSize: '0.8rem', color: 'var(--tan)', fontStyle: 'italic' }}>Chưa có workshop</p>}
          </div>
        </div>
      </div>

      {/* Weekly / Monthly */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="card" style={{ padding: '16px' }}>
          <SL>Theo Tuần</SL>
          {weekEntries.length === 0 && <p style={{ fontFamily: 'var(--font-serif)', fontSize: '0.8rem', color: 'var(--tan)', fontStyle: 'italic' }}>Chưa có dữ liệu</p>}
          {weekEntries.map(([k, s]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--cream-deep)' }}>
              <p style={{ fontFamily: 'var(--font-type)', fontSize: '0.63rem', color: 'var(--tan)' }}>Tuần {k}</p>
              <p style={{ fontFamily: 'var(--font-type)', fontSize: '0.63rem' }}>
                <span style={{ color: 'var(--brown)' }}>✓{s.ok}</span>
                {s.cancelled > 0 && <span style={{ color: 'var(--burgundy)', marginLeft: 8 }}>×{s.cancelled}</span>}
              </p>
            </div>
          ))}
        </div>
        <div className="card" style={{ padding: '16px' }}>
          <SL>Theo Tháng</SL>
          {monthEntries.length === 0 && <p style={{ fontFamily: 'var(--font-serif)', fontSize: '0.8rem', color: 'var(--tan)', fontStyle: 'italic' }}>Chưa có dữ liệu</p>}
          {monthEntries.map(([k, s]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--cream-deep)' }}>
              <p style={{ fontFamily: 'var(--font-type)', fontSize: '0.63rem', color: 'var(--tan)' }}>{k}</p>
              <p style={{ fontFamily: 'var(--font-type)', fontSize: '0.63rem' }}>
                <span style={{ color: 'var(--brown)' }}>✓{s.ok}</span>
                {s.cancelled > 0 && <span style={{ color: 'var(--burgundy)', marginLeft: 8 }}>×{s.cancelled}</span>}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Date filter */}
      <div className="card" style={{ padding: '16px' }}>
        <SL>Lọc Theo Ngày</SL>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
          <div><SL>Từ ngày</SL><input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} className="input-base" /></div>
          <div><SL>Đến ngày</SL><input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)} className="input-base" /></div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <button onClick={applyFilter} className="btn-stamp" style={{ padding: '7px 14px', fontSize: '0.62rem', background: 'var(--brown)', color: 'var(--cream)', borderColor: '#1a0a03', boxShadow: '2px 2px 0 #1a0a03' }}>
            <Icon name="filter_alt" size="sm" style={{ marginRight: 4 }} /> Lọc
          </button>
          {filteredQueue && (
            <button onClick={() => exportExcel(filteredQueue, rooms, workshops, filterFrom + '_' + filterTo)} className="btn-stamp" style={{ padding: '7px 14px', fontSize: '0.62rem', background: '#1a4a1a', color: 'var(--cream)', borderColor: '#0d2a0d', boxShadow: '2px 2px 0 #0d2a0d' }}>
              <Icon name="file_download" size="sm" style={{ marginRight: 4 }} /> Xuất Ngày Lọc
            </button>
          )}
          <button onClick={() => exportExcel(queue, rooms, workshops, 'tat-ca')} className="btn-stamp" style={{ padding: '7px 14px', fontSize: '0.62rem', color: 'var(--brown)', borderColor: 'var(--border-d)', boxShadow: '2px 2px 0 var(--cream-deep)', background: 'white' }}>
            <Icon name="download_for_offline" size="sm" style={{ marginRight: 4 }} /> Xuất Tất Cả
          </button>
          {filteredQueue && (
            <button onClick={() => { setFilteredQueue(null); setFilterFrom(''); setFilterTo('') }} className="btn-stamp" style={{ padding: '7px 10px', fontSize: '0.62rem', color: 'var(--tan)', borderColor: 'var(--border)', boxShadow: '2px 2px 0 var(--cream-deep)', background: 'white' }}>
              <Icon name="close" size="sm" />
            </button>
          )}
        </div>
      </div>

      {/* Daily history */}
      <div className="card" style={{ padding: '16px' }}>
        <SL>Lịch Sử Theo Ngày {filteredQueue ? '(đã lọc)' : ''}</SL>
        {displayDays.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-bg"><span>Chưa có dữ liệu</span></div>
            <p className="empty-state-text">Chưa có dữ liệu</p>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {displayDays.map(([dk, dq]) => {
            const da = dq.filter(q => q.status !== 'cancelled')
            const dc = dq.filter(q => q.status === 'cancelled')
            return (
              <div key={dk} style={{ border: '1px solid var(--border)', padding: '10px 14px', background: 'white', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <p style={{ fontFamily: 'var(--font-type)', fontSize: '0.72rem', color: 'var(--brown)', letterSpacing: '0.05em' }}>{dk}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <p style={{ fontFamily: 'var(--font-type)', fontSize: '0.65rem', color: 'var(--brown)' }}>✓ {da.length}</p>
                    {dc.length > 0 && <p style={{ fontFamily: 'var(--font-type)', fontSize: '0.65rem', color: 'var(--burgundy)' }}>× {dc.length}</p>}
                    <button onClick={() => exportExcel(dq, rooms, workshops, dk)} className="btn-stamp" style={{ padding: '3px 8px', fontSize: '0.58rem', background: 'var(--burgundy)', color: 'var(--cream)', borderColor: 'var(--burgundy-d)', boxShadow: '2px 2px 0 var(--burgundy-d)' }}>
                      <Icon name="download" size="sm" style={{ marginRight: 2 }} /> Excel
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {[...rooms, ...workshops.map(w => ({ id: w.id, name: w.title, theme: '' }))].map(svc => {
                    const cnt = dq.filter(q => q.serviceId === svc.id && q.status !== 'cancelled').length
                    const canc = dq.filter(q => q.serviceId === svc.id && q.status === 'cancelled').length
                    if (cnt === 0 && canc === 0) return null
                    return (
                      <span key={svc.id} style={{ fontFamily: 'var(--font-type)', fontSize: '0.6rem', color: 'var(--tan)' }}>
                        {svc.name}: <strong style={{ color: 'var(--brown)' }}>{cnt}</strong>
                        {canc > 0 && <span style={{ color: 'var(--burgundy)' }}> ·{canc}h</span>}
                      </span>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Detail table */}
      <div className="card" style={{ padding: '16px', overflowX: 'auto' }}>
        <SL>Chi Tiết Khách Hàng</SL>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.65rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--brown)' }}>
              {['STT','Tên','SĐT','Dịch vụ','T.toán','Tiền','Giờ đặt','Giờ duyệt','Giờ p/v','T.thái'].map(h => (
                <th key={h} style={{ fontFamily: 'var(--font-type)', fontSize: '0.55rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--tan)', padding: '6px 8px', textAlign: 'left', whiteSpace: 'nowrap', fontWeight: 'normal' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(filteredQueue ?? queue).filter(q => q.status !== 'pending').map(entry => {
              const room = rooms.find(r => r.id === entry.serviceId)
              const ws = workshops.find(w => w.id === entry.serviceId)
              const svcLabel = room ? room.name + ' · ' + room.theme : (ws?.title ?? '—')
              const sc = entry.status === 'done' ? '#1a5a1a' : entry.status === 'serving' ? 'var(--amber)' : entry.status === 'cancelled' ? 'var(--burgundy)' : 'var(--tan)'
              return (
                <tr key={entry.id} style={{ borderBottom: '1px solid var(--cream-deep)', opacity: entry.status === 'cancelled' ? 0.5 : 1 }}>
                  <td style={{ padding: '6px 8px', fontFamily: "'Courier Prime',monospace", fontWeight: 700, color: 'var(--amber)', fontSize: '0.9rem' }}>{String(entry.number).padStart(2, '0')}</td>
                  <td style={{ padding: '6px 8px', fontFamily: 'var(--font-type)', color: 'var(--brown)', whiteSpace: 'nowrap' }}>{entry.name}</td>
                  <td style={{ padding: '6px 8px', fontFamily: 'var(--font-type)', color: 'var(--tan)' }}>{entry.phone}</td>
                  <td style={{ padding: '6px 8px', fontFamily: 'var(--font-type)', color: 'var(--tan)', whiteSpace: 'nowrap' }}>{svcLabel}</td>
                  <td style={{ padding: '6px 8px', fontFamily: 'var(--font-type)', color: 'var(--tan)' }}>{entry.paymentMethod === 'cash' ? 'T.mặt' : 'C.khoản'}</td>
                  <td style={{ padding: '6px 8px', fontFamily: 'var(--font-type)', color: 'var(--brown)', whiteSpace: 'nowrap' }}>{entry.totalAmount > 0 ? fmt(entry.totalAmount) : '—'}</td>
                  <td style={{ padding: '6px 8px', fontFamily: 'var(--font-type)', color: 'var(--tan)', whiteSpace: 'nowrap' }}>{fmtT(entry.joinedAt)}</td>
                  <td style={{ padding: '6px 8px', fontFamily: 'var(--font-type)', color: 'var(--tan)', whiteSpace: 'nowrap' }}>{entry.approvedAt ? fmtT(entry.approvedAt) : '—'}</td>
                  <td style={{ padding: '6px 8px', fontFamily: 'var(--font-type)', color: 'var(--tan)', whiteSpace: 'nowrap' }}>{entry.servedAt ? fmtT(entry.servedAt) : '—'}</td>
                  <td style={{ padding: '6px 8px' }}>
                    <span className="status-badge" style={{ color: sc, borderColor: sc }}>
                      {entry.status === 'done' ? 'Xong' : entry.status === 'serving' ? 'P.vụ' : entry.status === 'cancelled' ? 'Huỷ' : 'Chờ'}
                    </span>
                  </td>
                </tr>
              )
            })}
            {queue.length === 0 && (
              <tr><td colSpan={10} style={{ textAlign: 'center', fontFamily: 'var(--font-serif)', fontSize: '0.85rem', color: 'var(--tan)', fontStyle: 'italic', padding: '20px' }}>Chưa có dữ liệu</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
