import { useState, useEffect } from 'react'
import BookingView from './components/BookingView'
import CheckView from './components/CheckView'
import QueueDisplayView from './components/QueueDisplayView'
import ManagementView from './components/ManagementView'
import { Room, QueueEntry, Workshop } from './types'
import {
  isConfigured,
  subscribeQueue, subscribeNextNumbers, subscribeRoomNumbers,
  subscribeSettings, subscribeHistory, subscribePasswords,
  addQueueEntries, updateQueueEntry,
  setNextNumbers, setRoomNumber, saveSettings, initSettingsIfEmpty, savePasswords,
} from './firebase'
import './App.css'

const DEFAULT_ROOMS: Room[] = [
  { id: 'room-1', name: 'Phòng 1', theme: 'Star Light',   type: 'selfbooth',  price: 150000, currentNumber: 0, totalServed: 0 },
  { id: 'room-2', name: 'Phòng 2', theme: 'Heart Garden', type: 'selfbooth',  price: 150000, currentNumber: 0, totalServed: 0 },
  { id: 'room-3', name: 'Phòng 3', theme: 'Red Cherry',   type: 'photobooth', price: 0,      currentNumber: 0, totalServed: 0 },
]
const DEFAULT_WORKSHOPS: Workshop[] = [
  { id: 'ws-1', title: 'Film Photography Basics', date: '2026-04-20', time: '14:00', duration: 120, capacity: 12, registered: 0, price: 350000, description: 'Học cách chụp film analog từ cơ bản đến nâng cao.', instructor: 'Minh Khoa' },
  { id: 'ws-2', title: 'Portrait Lighting Masterclass', date: '2026-04-27', time: '10:00', duration: 180, capacity: 8, registered: 0, price: 550000, description: 'Kỹ thuật ánh sáng chân dung chuyên nghiệp.', instructor: 'Lan Anh' },
]

type View = 'booking' | 'check' | 'queue' | 'manage'
const NAV: { id: View; label: string }[] = [
  { id: 'booking', label: 'Đặt Lịch' },
  { id: 'check', label: 'Kiểm Tra & Huỷ' },
  { id: 'queue', label: 'Hàng Chờ' },
  { id: 'manage', label: 'Quản Lý' },
]

export default function App() {
  const [view, setView] = useState<View>('booking')
  const [rooms, setRooms] = useState<Room[]>(DEFAULT_ROOMS)
  const [workshops, setWorkshops] = useState<Workshop[]>(DEFAULT_WORKSHOPS)
  const [queue, setQueue] = useState<QueueEntry[]>([])
  const [nextNumbers, setNextNumbersState] = useState<Record<string, number>>({
    'room-1': 1, 'room-2': 1, 'room-3': 1, 'ws-1': 1, 'ws-2': 1,
  })
  const [roomNumbers, setRoomNumbers] = useState<Record<string, number>>({})
  const [history, setHistory] = useState<Record<string, QueueEntry[]>>({})
  const [adminPw, setAdminPw] = useState('1234')
  const [settingsPw, setSettingsPw] = useState('5678')

  useEffect(() => {
    if (!isConfigured) return // offline mode — local state only

    initSettingsIfEmpty(DEFAULT_ROOMS, DEFAULT_WORKSHOPS)

    const unsubs = [
      subscribeQueue(setQueue),
      subscribeNextNumbers(setNextNumbersState),
      subscribeRoomNumbers(setRoomNumbers),
      subscribeSettings((r, w) => { setRooms(r); setWorkshops(w) }),
      subscribeHistory(setHistory),
      subscribePasswords((a, s) => { setAdminPw(a); setSettingsPw(s) }),
    ]
    return () => unsubs.forEach(fn => fn())
  }, [])

  const roomsWithNumbers = rooms.map(r => ({ ...r, currentNumber: roomNumbers[r.id] ?? 0 }))

  const addToQueue = async (
    name: string, phone: string,
    services: { serviceType: 'room' | 'workshop'; serviceId: string; amount: number }[],
    paymentMethod: 'cash' | 'transfer'
  ) => {
    const guestId = `guest-${Date.now()}`
    const newEntries: QueueEntry[] = []
    const newNumbers = { ...nextNumbers }
    services.forEach(svc => {
      const num = newNumbers[svc.serviceId] ?? 1
      newNumbers[svc.serviceId] = num + 1
      newEntries.push({
        id: `q-${Date.now()}-${svc.serviceId}`,
        guestId, number: num, name, phone,
        serviceType: svc.serviceType, serviceId: svc.serviceId,
        paymentMethod, status: 'pending',
        joinedAt: new Date(), totalAmount: svc.amount,
      })
    })
    if (isConfigured) {
      await Promise.all([addQueueEntries(newEntries), setNextNumbers(newNumbers)])
      const wsUpdated = workshops.map(w => {
        const booked = services.find(s => s.serviceId === w.id && s.serviceType === 'workshop')
        return booked ? { ...w, registered: w.registered + 1 } : w
      })
      if (wsUpdated.some((w, i) => w.registered !== workshops[i].registered)) {
        await saveSettings(rooms, wsUpdated)
      }
    } else {
      setQueue(prev => [...prev, ...newEntries])
      setNextNumbersState(newNumbers)
      setWorkshops(prev => prev.map(w => {
        const booked = services.find(s => s.serviceId === w.id && s.serviceType === 'workshop')
        return booked ? { ...w, registered: w.registered + 1 } : w
      }))
    }
    return { guestId, entries: newEntries }
  }

  const applyEntryChange = async (id: string, changes: Partial<QueueEntry>) => {
    if (isConfigured) await updateQueueEntry(id, changes)
    else setQueue(prev => prev.map(e => e.id === id ? { ...e, ...changes } : e))
  }

  const approveEntry = (id: string) => applyEntryChange(id, { status: 'waiting', approvedAt: new Date() })
  const cancelEntry = (id: string) => applyEntryChange(id, { status: 'cancelled', cancelledAt: new Date() })

  const serveNext = async (serviceId: string) => {
    const waiting = queue.filter(q => q.serviceId === serviceId && q.status === 'waiting').sort((a, b) => a.number - b.number)
    if (!waiting.length) return
    const next = waiting[0]
    if (isConfigured) {
      await Promise.all([updateQueueEntry(next.id, { status: 'serving', servedAt: new Date() }), setRoomNumber(serviceId, next.number)])
    } else {
      setQueue(prev => prev.map(e => e.id === next.id ? { ...e, status: 'serving', servedAt: new Date() } : e))
      setRoomNumbers(prev => ({ ...prev, [serviceId]: next.number }))
    }
  }

  const serveSpecific = async (entryId: string, serviceId: string) => {
    const current = queue.find(q => q.serviceId === serviceId && q.status === 'serving')
    const entry = queue.find(e => e.id === entryId)
    if (isConfigured) {
      const updates: Promise<any>[] = [updateQueueEntry(entryId, { status: 'serving', servedAt: new Date() })]
      if (current) updates.push(updateQueueEntry(current.id, { status: 'waiting' }))
      if (entry) updates.push(setRoomNumber(serviceId, entry.number))
      await Promise.all(updates)
    } else {
      setQueue(prev => prev.map(e =>
        e.id === entryId ? { ...e, status: 'serving', servedAt: new Date() } :
        e.id === current?.id ? { ...e, status: 'waiting' } : e
      ))
      if (entry) setRoomNumbers(prev => ({ ...prev, [serviceId]: entry.number }))
    }
  }

  const resetService = async (serviceId: string) => {
    const waiting = queue.filter(q => q.serviceId === serviceId && q.status === 'waiting')
    if (isConfigured) {
      await Promise.all([
        ...waiting.map(e => updateQueueEntry(e.id, { status: 'cancelled', cancelledAt: new Date() })),
        setRoomNumber(serviceId, 0),
      ])
    } else {
      setQueue(prev => prev.map(e => e.serviceId === serviceId && e.status === 'waiting' ? { ...e, status: 'cancelled', cancelledAt: new Date() } : e))
      setRoomNumbers(prev => ({ ...prev, [serviceId]: 0 }))
    }
  }

  const updateSettings = async (newRooms: Room[], newWorkshops: Workshop[]) => {
    if (isConfigured) {
      await saveSettings(newRooms, newWorkshops)
      const newNums = { ...nextNumbers }
      newWorkshops.forEach(w => { if (!newNums[w.id]) newNums[w.id] = 1 })
      await setNextNumbers(newNums)
    } else {
      setRooms(newRooms); setWorkshops(newWorkshops)
    }
  }

  const updatePasswords = async (newAdmin: string, newSettings: string) => {
    setAdminPw(newAdmin); setSettingsPw(newSettings)
    if (isConfigured) await savePasswords(newAdmin, newSettings)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      <header style={{ background: 'var(--brown)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: '4px 6px', border: '1px solid rgba(201,146,42,0.25)', pointerEvents: 'none', borderRadius: 4 }} />
        {['top:8px;left:12px', 'top:8px;right:12px', 'bottom:52px;left:12px', 'bottom:52px;right:12px'].map((pos, i) => (
          <div key={i} style={{ position: 'absolute', ...Object.fromEntries(pos.split(';').map(p => p.split(':'))), color: 'var(--amber)', opacity: 0.35, fontSize: '0.9rem', lineHeight: 1 }}>✦</div>
        ))}
        <div style={{ textAlign: 'center', padding: '22px 24px 10px', position: 'relative' }}>
          <h1 style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 'clamp(1.5rem, 5vw, 2.6rem)', fontWeight: 900, color: 'var(--cream)', letterSpacing: '0.15em', lineHeight: 1 }}>
            THE FILMER
          </h1>
        </div>
        <div className="ornament-divider" style={{ padding: '0 24px 8px', opacity: 0.45 }}>✦ ─── ✦ ─── ✦</div>
        <nav style={{ display: 'flex', justifyContent: 'center', borderTop: '1px solid rgba(201,146,42,0.2)' }}>
          {NAV.map(item => (
            <button key={item.id} onClick={() => setView(item.id)} style={{
              position: 'relative', padding: '11px 22px', cursor: 'pointer',
              fontFamily: 'var(--font-type)', fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase',
              background: 'transparent', border: 'none',
              color: view === item.id ? 'var(--cream)' : 'rgba(242,232,217,0.45)',
              borderBottom: `3px solid ${view === item.id ? 'var(--amber)' : 'transparent'}`,
              transition: 'all 0.15s ease',
            }}>
              {view === item.id && <span className="nav-active-dot stamp-in" />}
              {item.label}
            </button>
          ))}
        </nav>
      </header>
      <div style={{ height: 5, background: `repeating-linear-gradient(90deg, var(--burgundy) 0, var(--burgundy) 7px, var(--amber) 7px, var(--amber) 9px, var(--cream-dark) 9px, var(--cream-dark) 16px)` }} />
      <main style={{ maxWidth: 880, margin: '0 auto', padding: '24px 16px' }}>
        {view === 'booking' && <BookingView rooms={roomsWithNumbers} workshops={workshops} onAdd={addToQueue} />}
        {view === 'check' && <CheckView queue={queue} rooms={roomsWithNumbers} workshops={workshops} onCancel={cancelEntry} />}
        {view === 'queue' && <QueueDisplayView queue={queue} rooms={roomsWithNumbers} workshops={workshops} />}
        {view === 'manage' && (
          <ManagementView
            queue={queue} rooms={roomsWithNumbers} workshops={workshops} history={history}
            adminPw={adminPw} settingsPw={settingsPw} onUpdatePasswords={updatePasswords}
            onApprove={approveEntry} onServeNext={serveNext} onServeSpecific={serveSpecific}
            onCancel={cancelEntry} onReset={resetService} onUpdateSettings={updateSettings}
          />
        )}
      </main>
      <div className="ornament-divider" style={{ maxWidth: 880, margin: '0 auto', padding: '0 16px 20px', opacity: 0.35 }}>✦ ─── ✦ ─── ✦</div>
    </div>
  )
}
