import { useState, useEffect } from 'react'
import { type QueueEntry, type Room, type Workshop } from '../types'
import { getAllHistory } from '../services/db'
import Icon from './Icon'

interface Props { rooms: Room[]; workshops: Workshop[]; liveQueue: QueueEntry[] }

const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ'
const fmtTime = (d: Date) => new Date(d).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p style={{ fontFamily: 'var(--font-type)', fontSize: '0.62rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--tan)', marginBottom: 8 }}>{children}</p>
}

function exportCSV(entries: QueueEntry[], rooms: Room[], workshops: Workshop[], label = 'export') {
  const getLabel = (e: QueueEntry) => {
    if (e.serviceType === 'room') { const r = rooms.find(x => x.id === e.serviceId); return r ? `${r.name} – ${r.theme}` : e.serviceId }
    const w = workshops.find(x => x.id === e.serviceId); return w ? w.title : e.serviceId
  }
  const getType = (e: QueueEntry) => {
    if (e.serviceType === 'workshop') return 'Workshop'
    return rooms.find(x => x.id === e.serviceId)?.type === 'photobooth' ? 'Photobooth' : 'Selfbooth'
  }
  const rows = entries.map(q => ({
    'STT': q.number, 'Họ & Tên': q.name, 'Số điện thoại': q.phone,
    'Loại': getType(q), 'Dịch vụ': getLabel(q),
    'Thanh toán': q.paymentMethod === 'cash' ? 'Tiền mặt' : 'Chuyển khoản',
    'Tổng tiền': q.totalAmount,
    'Giờ đặt': fmtTime(q.joinedAt),
    'Giờ duyệt': q.approvedAt ? fmtTime(q.approvedAt) : '—',
    'Giờ phục vụ': q.servedAt ? fmtTime(q.servedAt) : '—',
    'Trạng thái': q.status === 'cancelled' ? 'Đã huỷ' : q.status === 'done' ? 'Xong' : 'Phục vụ',
  }))
  if (!rows.length) { alert('Không có dữ liệu.'); return }
  const headers = Object.keys(rows[0])
  const csvRows = [headers.join(','), ...rows.map(r => headers.map(h => { const v = String((r as any)[h]); return v.includes(',') ? `"${v}"` : v }).join(','))]
  const totalRev = rows.filter(r => r['Loại'] !== 'Photobooth').reduce((s, r) => s + r['Tổng tiền'], 0)
  const cashRev = entries.filter(q => q.paymentMethod === 'cash' && q.status !== 'cancelled' && getType(q) !== 'Photobooth').reduce((s, q) => s + q.totalAmount, 0)
  csvRows.push('', '=== DOANH THU ===', `Tổng,${totalRev}`, `Tiền mặt,${cashRev}`, `Chuyển khoản,${totalRev - cashRev}`)
  const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob); const a = document.createElement('a')
  a.href = url; a.download = `the-filmer-${label}.csv`; a.click(); URL.revokeObjectURL(url)
}

export default function StatsView({ rooms, workshops, liveQueue }: Props) {
  const [pw, setPw] = useState(''); const [unlocked, setUnlocked] = useState(false); const [pwErr, setPwErr] = useState(false)
  const [history, setHistory] = useState<Record<string, QueueEntry[]>>({})
  const [historyLoading, setHistoryLoading] = useState(false)
  const [filterFrom, setFilterFrom] = useState(''); const [filterTo, setFilterTo] = useState('')

  const ADMIN_PW = '1234'

  const unlock = async () => {
    if (pw !== ADMIN_PW) { setPwErr(true); return }
    setUnlocked(true); setPwErr(false)
    setHistoryLoading(true)
    const h = await getAllHistory()
    // Merge today's live queue into today's history slot for display
    const today = new Date().toISOString().slice(0, 10)
    if (liveQueue.length > 0) h[today] = liveQueue
    setHistory(h)
    setHistoryLoading(false)
  }

  if (!unlocked) return (
    <div className="card" style={{ padding: '28px 24px', maxWidth: 480, margin: '0 auto' }}>
      <SectionLabel>Xác Thực</SectionLabel>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontStyle: 'italic', color: 'var(--burgundy)', marginBottom: 16 }}>Thống Kê</p>
      <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="Mật khẩu"
        onKeyDown={e => e.key === 'Enter' && unlock()} className="input-base" style={{ marginBottom: 10 }} />
      {pwErr && <p style={{ fontFamily: 'var(--font-type)', fontSize: '0.65rem', color: 'var(--burgundy)', marginBottom: 8 }}>Mật khẩu không đúng. (Mặc định: 1234)</p>}
      <button onClick={unlock} className="btn-stamp"
        style={{ width: '100%', padding: '11px', background: 'var(--brown)', color: 'var(--cream)', borderColor: '#1a0a03', boxShadow: '3px 3px 0 #1a0a03', fontSize: '0.68rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <Icon name="bar_chart" size="sm" /> Xem Thống Kê
      </button>
    </div>
  )

  if (historyLoading) return (
    <div style={{ textAlign: 'center', padding: '60px 0' }}>
      <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--tan)' }}>Đang tải dữ liệu...</p>
    </div>
  )

  // Flatten all history into one array for aggregation
  const allEntries = Object.values(history).flat()
  const active = allEntries.filter(q => q.status !== 'cancelled' && q.status !== 'pending')
  const cancelled = allEntries.filter(q => q.status === 'cancelled')
  const getType = (e: QueueEntry) => { if (e.serviceType === 'workshop') return 'workshop'; return rooms.find(r => r.id === e.serviceId)?.type ?? 'selfbooth' }
  const selfboothActive = active.filter(q => getType(q) === 'selfbooth')
  const photoboothActive = active.filter(q => getType(q) === 'photobooth')
  const workshopActive = active.filter(q => getType(q) === 'workshop')
  const totalRevenue = [...selfboothActive, ...workshopActive].reduce((s, q) => s + q.totalAmount, 0)
  const cashRevenue = active.filter(q => getType(q) !== 'photobooth' && q.paymentMethod === 'cash').reduce((s, q) => s + q.totalAmount, 0)
  const transferRevenue = totalRevenue - cashRevenue
  const roomStats = rooms.filter(r => r.type === 'selfbooth').map(r => ({ ...r, count: active.filter(q => q.serviceId === r.id).length, revenue: active.filter(q => q.serviceId === r.id).reduce((s, q) => s + q.totalAmount, 0) }))
  const photoStats = rooms.filter(r => r.type === 'photobooth').map(r => ({ ...r, count: active.filter(q => q.serviceId === r.id).length }))
  const wsStats = workshops.map(w => ({ ...w, count: active.filter(q => q.serviceId === w.id).length, revenue: active.filter(q => q.serviceId === w.id).reduce((s, q) => s + q.totalAmount, 0) }))
  // const hotItem unused

  const getWeekStart = (d: Date) => { const dt = new Date(d); dt.setHours(0,0,0,0); const day = dt.getDay(); dt.setDate(dt.getDate()-day+(day===0?-6:1)); return dt.toISOString().slice(0,10) }
  const getMonthKey = (d: Date) => new Date(d).toISOString().slice(0,7)

  const weekMap = {} as Record<string,{ok:number;cancelled:number}>
  const monthMap = {} as Record<string,{ok:number;cancelled:number}>
  allEntries.filter(q => q.status !== 'pending').forEach(q => {
    const wk = getWeekStart(q.joinedAt); if (!weekMap[wk]) weekMap[wk]={ok:0,cancelled:0}
    const mo = getMonthKey(q.joinedAt); if (!monthMap[mo]) monthMap[mo]={ok:0,cancelled:0}
    q.status === 'cancelled' ? (weekMap[wk].cancelled++, monthMap[mo].cancelled++) : (weekMap[wk].ok++, monthMap[mo].ok++)
  })
  const weekEntries = Object.entries(weekMap).sort((a,b)=>b[0].localeCompare(a[0])).slice(0,8)
  const monthEntries = Object.entries(monthMap).sort((a,b)=>b[0].localeCompare(a[0])).slice(0,12)

  // Day entries with optional date filter
  const allDayEntries = Object.entries(history).sort((a,b)=>b[0].localeCompare(a[0]))
  const filteredDayEntries = filterFrom || filterTo
    ? allDayEntries.filter(([dk]) => (!filterFrom || dk >= filterFrom) && (!filterTo || dk <= filterTo))
    : allDayEntries

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* KPI */}
      <div className="card" style={{ padding: '20px' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontStyle: 'italic', color: 'var(--burgundy)', marginBottom: 16 }}>Thống Kê & Doanh Thu</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 16 }}>
          {[{l:'Selfbooth',v:selfboothActive.length},{l:'Photobooth',v:photoboothActive.length},{l:'Workshop',v:workshopActive.length},{l:'Tổng huỷ',v:cancelled.length}].map(({l,v}) => (
            <div key={l} style={{ background:'var(--cream-dark)', border:'1px solid var(--border)', padding:'12px 10px', textAlign:'center', borderRadius:'var(--radius-sm)' }}>
              <p className="ticket-number" style={{ fontSize:'2rem' }}>{v}</p>
              <p className="section-label" style={{ marginTop:4 }}>{l}</p>
            </div>
          ))}
        </div>

        {/* Revenue */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:16 }}>
          <div style={{ background:'var(--burgundy)', padding:'14px 12px', textAlign:'center', boxShadow:'3px 3px 0 var(--burgundy-d)', borderRadius:'var(--radius-sm)' }}>
            <p style={{ fontFamily:'var(--font-display)', fontSize:'1.2rem', fontStyle:'italic', color:'var(--amber)', lineHeight:1 }}>{fmt(totalRevenue)}</p>
            <p style={{ fontFamily:'var(--font-type)', fontSize:'0.58rem', color:'var(--cream-deep)', letterSpacing:'0.15em', textTransform:'uppercase', marginTop:4 }}>Tổng Doanh Thu</p>
          </div>
          <div style={{ background:'var(--cream-dark)', border:'1px solid var(--border)', padding:'14px 12px', textAlign:'center', borderRadius:'var(--radius-sm)' }}>
            <p style={{ fontFamily:'var(--font-display)', fontSize:'1rem', fontStyle:'italic', color:'var(--brown)', lineHeight:1 }}>{fmt(cashRevenue)}</p>
            <p className="section-label" style={{ marginTop:4 }}>💵 Tiền mặt</p>
          </div>
          <div style={{ background:'var(--cream-dark)', border:'1px solid var(--border)', padding:'14px 12px', textAlign:'center', borderRadius:'var(--radius-sm)' }}>
            <p style={{ fontFamily:'var(--font-display)', fontSize:'1rem', fontStyle:'italic', color:'var(--brown)', lineHeight:1 }}>{fmt(transferRevenue)}</p>
            <p className="section-label" style={{ marginTop:4 }}>📱 Chuyển khoản</p>
          </div>
        </div>

        {/* Per room/ws */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div>
            <SectionLabel>🤳 Selfbooth</SectionLabel>
            {roomStats.map(r => (
              <div key={r.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom:'1px solid var(--cream-deep)' }}>
                <div><p style={{ fontFamily:'var(--font-serif)', fontSize:'0.85rem', fontStyle:'italic', color:'var(--brown)' }}>{r.theme}</p><p style={{ fontFamily:'var(--font-type)', fontSize:'0.6rem', color:'var(--tan)' }}>{r.count} lượt</p></div>
                <p style={{ fontFamily:'var(--font-display)', fontSize:'0.9rem', fontStyle:'italic', color:'var(--burgundy)' }}>{fmt(r.revenue)}</p>
              </div>
            ))}
            <div style={{ marginTop:10 }}>
              <SectionLabel>📷 Photobooth</SectionLabel>
              {photoStats.map(r => (
                <div key={r.id} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid var(--cream-deep)' }}>
                  <p style={{ fontFamily:'var(--font-serif)', fontSize:'0.85rem', fontStyle:'italic', color:'var(--brown)' }}>{r.theme}</p>
                  <p style={{ fontFamily:'var(--font-display)', fontSize:'0.9rem', fontStyle:'italic', color:'var(--amber)' }}>{r.count} lượt</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <SectionLabel>🎬 Workshop</SectionLabel>
            {wsStats.filter(w => w.count > 0).map(w => (
              <div key={w.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom:'1px solid var(--cream-deep)' }}>
                <div><p style={{ fontFamily:'var(--font-type)', fontSize:'0.68rem', color:'var(--brown)' }}>{w.title}</p><p style={{ fontFamily:'var(--font-type)', fontSize:'0.6rem', color:'var(--tan)' }}>{w.count} người</p></div>
                <p style={{ fontFamily:'var(--font-display)', fontSize:'0.9rem', fontStyle:'italic', color:'var(--burgundy)' }}>{fmt(w.revenue)}</p>
              </div>
            ))}
            {wsStats.every(w => w.count === 0) && <p style={{ fontFamily:'var(--font-serif)', fontSize:'0.78rem', color:'var(--tan)', fontStyle:'italic' }}>Chưa có dữ liệu</p>}
          </div>
        </div>
      </div>

      {/* Weekly / Monthly */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        {[['Theo Tuần', weekEntries, 'Tuần '],['Theo Tháng', monthEntries, '']].map(([title, entries, prefix]) => (
          <div key={title as string} className="card" style={{ padding:'16px' }}>
            <SectionLabel>{title as string}</SectionLabel>
            {(entries as any[]).length === 0 && <p style={{ fontFamily:'var(--font-serif)', fontSize:'0.78rem', color:'var(--tan)', fontStyle:'italic' }}>Chưa có dữ liệu</p>}
            {(entries as any[]).map(([key, stat]: [string, any]) => (
              <div key={key} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid var(--cream-deep)' }}>
                <p style={{ fontFamily:'var(--font-type)', fontSize:'0.65rem', color:'var(--tan)' }}>{prefix}{key}</p>
                <p style={{ fontFamily:'var(--font-type)', fontSize:'0.65rem' }}>
                  <span style={{ color:'var(--brown)' }}>✓{stat.ok}</span>
                  {stat.cancelled > 0 && <span style={{ color:'var(--burgundy)', marginLeft:8 }}>×{stat.cancelled}</span>}
                </p>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Date filter + export */}
      <div className="card" style={{ padding:'16px' }}>
        <SectionLabel>Lọc & Xuất</SectionLabel>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
          <div><SectionLabel>Từ ngày</SectionLabel><input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} className="input-base" /></div>
          <div><SectionLabel>Đến ngày</SectionLabel><input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)} className="input-base" /></div>
        </div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
          {(filterFrom || filterTo) && (
            <button onClick={() => exportCSV(filteredDayEntries.flatMap(([,e]) => e), rooms, workshops, `${filterFrom}_${filterTo}`)} className="btn-stamp"
              style={{ padding:'7px 14px', fontSize:'0.62rem', background:'#1a4a1a', color:'var(--cream)', borderColor:'#0d2a0d', boxShadow:'2px 2px 0 #0d2a0d', display:'flex', alignItems:'center', gap:5 }}>
              <Icon name="file_download" size="sm" /> Xuất Ngày Đã Lọc
            </button>
          )}
          <button onClick={() => exportCSV(allEntries, rooms, workshops, 'tat-ca')} className="btn-stamp"
            style={{ padding:'7px 14px', fontSize:'0.62rem', color:'var(--brown)', borderColor:'var(--brown-mid)', boxShadow:'2px 2px 0 var(--border-d)', background:'white', display:'flex', alignItems:'center', gap:5 }}>
            <Icon name="download_for_offline" size="sm" /> Xuất Tất Cả
          </button>
          {(filterFrom || filterTo) && (
            <button onClick={() => { setFilterFrom(''); setFilterTo('') }} className="btn-stamp"
              style={{ padding:'7px 10px', fontSize:'0.62rem', color:'var(--tan)', borderColor:'var(--border)', boxShadow:'2px 2px 0 var(--cream-deep)', background:'white', display:'flex', alignItems:'center', gap:4 }}>
              <Icon name="close" size="sm" />
            </button>
          )}
        </div>
      </div>

      {/* Daily history */}
      <div className="card" style={{ padding:'16px' }}>
        <SectionLabel>Lịch Sử Theo Ngày {(filterFrom || filterTo) ? '(đã lọc)' : ''}</SectionLabel>
        {filteredDayEntries.length === 0 && (
          <div className="empty-state"><div className="empty-state-bg"><span>Thống Kê</span></div><p className="empty-state-text">Chưa có dữ liệu</p></div>
        )}
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {filteredDayEntries.map(([dateKey, dayQueue]) => {
            const dayActive = dayQueue.filter(q => q.status !== 'cancelled')
            const dayCancelled = dayQueue.filter(q => q.status === 'cancelled')
            return (
              <div key={dateKey} style={{ border:'1px solid var(--border)', padding:'10px 14px', background:'white', borderRadius:'var(--radius-sm)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
                  <p style={{ fontFamily:'var(--font-type)', fontSize:'0.72rem', color:'var(--brown)', letterSpacing:'0.05em' }}>{dateKey}</p>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <p style={{ fontFamily:'var(--font-type)', fontSize:'0.65rem', color:'var(--brown)' }}>✓ {dayActive.length}</p>
                    {dayCancelled.length > 0 && <p style={{ fontFamily:'var(--font-type)', fontSize:'0.65rem', color:'var(--burgundy)' }}>× {dayCancelled.length}</p>}
                    <button onClick={() => exportCSV(dayQueue, rooms, workshops, dateKey)} className="btn-stamp"
                      style={{ padding:'3px 8px', fontSize:'0.58rem', background:'var(--burgundy)', color:'var(--cream)', borderColor:'var(--burgundy-d)', boxShadow:'2px 2px 0 var(--burgundy-d)', display:'flex', alignItems:'center', gap:3 }}>
                      <Icon name="download" size="sm" /> Excel
                    </button>
                  </div>
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
                  {[...rooms, ...workshops.map(w => ({id:w.id,name:w.title,theme:''}))].map(svc => {
                    const cnt = dayQueue.filter(q => q.serviceId === svc.id && q.status !== 'cancelled').length
                    const canc = dayQueue.filter(q => q.serviceId === svc.id && q.status === 'cancelled').length
                    if (cnt === 0 && canc === 0) return null
                    return <span key={svc.id} style={{ fontFamily:'var(--font-type)', fontSize:'0.6rem', color:'var(--tan)' }}>{svc.name}: <strong style={{ color:'var(--brown)' }}>{cnt}</strong>{canc > 0 && <span style={{ color:'var(--burgundy)' }}> ·{canc}h</span>}</span>
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
