import { initializeApp, FirebaseApp } from 'firebase/app'
import { getDatabase, ref, set, onValue, off, update, get, DataSnapshot, Database } from 'firebase/database'
import firebaseConfig from './firebaseConfig'
import { QueueEntry, Room, Workshop } from './types'

// ─── Check if Firebase is configured ─────────────────────────
export const isConfigured = !firebaseConfig.apiKey.startsWith('YOUR_')

let app: FirebaseApp | null = null
let db: Database | null = null

if (isConfigured) {
  app = initializeApp(firebaseConfig)
  db = getDatabase(app)
}

function parseEntry(e: any): QueueEntry {
  return {
    ...e,
    joinedAt: new Date(e.joinedAt),
    approvedAt: e.approvedAt ? new Date(e.approvedAt) : undefined,
    servedAt: e.servedAt ? new Date(e.servedAt) : undefined,
    cancelledAt: e.cancelledAt ? new Date(e.cancelledAt) : undefined,
  }
}

// ─── Queue ────────────────────────────────────────────────────
export function subscribeQueue(callback: (entries: QueueEntry[]) => void) {
  if (!db) return () => {}
  const r = ref(db, 'queue')
  const handler = (snap: DataSnapshot) => {
    const val = snap.val() ?? {}
    callback(Object.values(val).map(parseEntry))
  }
  onValue(r, handler)
  return () => off(r, 'value', handler)
}

export async function addQueueEntries(entries: QueueEntry[]) {
  if (!db) return
  const updates: Record<string, any> = {}
  entries.forEach(e => { updates[`queue/${e.id}`] = { ...e, joinedAt: e.joinedAt.toISOString() } })
  await update(ref(db), updates)
}

export async function updateQueueEntry(id: string, changes: Partial<QueueEntry>) {
  if (!db) return
  const payload: any = { ...changes }
  if (changes.approvedAt) payload.approvedAt = changes.approvedAt.toISOString()
  if (changes.servedAt) payload.servedAt = changes.servedAt.toISOString()
  if (changes.cancelledAt) payload.cancelledAt = changes.cancelledAt.toISOString()
  delete payload.joinedAt
  await update(ref(db, `queue/${id}`), payload)
}

// ─── Next Numbers ─────────────────────────────────────────────
export function subscribeNextNumbers(callback: (nums: Record<string, number>) => void) {
  if (!db) return () => {}
  const r = ref(db, 'nextNumbers')
  const handler = (snap: DataSnapshot) => callback(snap.val() ?? {})
  onValue(r, handler)
  return () => off(r, 'value', handler)
}

export async function setNextNumbers(nums: Record<string, number>) {
  if (!db) return
  await set(ref(db, 'nextNumbers'), nums)
}

// ─── Room Numbers ─────────────────────────────────────────────
export function subscribeRoomNumbers(callback: (nums: Record<string, number>) => void) {
  if (!db) return () => {}
  const r = ref(db, 'roomNumbers')
  const handler = (snap: DataSnapshot) => callback(snap.val() ?? {})
  onValue(r, handler)
  return () => off(r, 'value', handler)
}

export async function setRoomNumber(roomId: string, num: number) {
  if (!db) return
  await update(ref(db, 'roomNumbers'), { [roomId]: num })
}

// ─── Settings ─────────────────────────────────────────────────
export function subscribeSettings(callback: (rooms: Room[], workshops: Workshop[]) => void) {
  if (!db) return () => {}
  const r = ref(db, 'settings')
  const handler = (snap: DataSnapshot) => {
    const val = snap.val()
    if (val?.rooms && val?.workshops) {
      callback(Object.values(val.rooms) as Room[], Object.values(val.workshops) as Workshop[])
    }
  }
  onValue(r, handler)
  return () => off(r, 'value', handler)
}

export async function saveSettings(rooms: Room[], workshops: Workshop[]) {
  if (!db) return
  const roomsObj: Record<string, Room> = {}
  rooms.forEach(r => { roomsObj[r.id] = r })
  const wsObj: Record<string, Workshop> = {}
  workshops.forEach(w => { wsObj[w.id] = w })
  await set(ref(db, 'settings'), { rooms: roomsObj, workshops: wsObj })
}

export async function initSettingsIfEmpty(rooms: Room[], workshops: Workshop[]) {
  if (!db) return
  const snap = await get(ref(db, 'settings'))
  if (!snap.exists()) await saveSettings(rooms, workshops)
}

// ─── Passwords (synced via Firebase) ─────────────────────────
export function subscribePasswords(callback: (adminPw: string, settingsPw: string) => void) {
  if (!db) return () => {}
  const r = ref(db, 'passwords')
  const handler = (snap: DataSnapshot) => {
    const val = snap.val() ?? {}
    callback(val.admin ?? '1234', val.settings ?? '5678')
  }
  onValue(r, handler)
  return () => off(r, 'value', handler)
}

export async function savePasswords(adminPw: string, settingsPw: string) {
  if (!db) return
  await set(ref(db, 'passwords'), { admin: adminPw, settings: settingsPw })
}

// ─── History ─────────────────────────────────────────────────
export function subscribeHistory(callback: (history: Record<string, QueueEntry[]>) => void) {
  if (!db) return () => {}
  const r = ref(db, 'history')
  const handler = (snap: DataSnapshot) => {
    const val = snap.val() ?? {}
    const result: Record<string, QueueEntry[]> = {}
    Object.entries(val).forEach(([date, entries]: [string, any]) => {
      result[date] = Object.values(entries).map(parseEntry)
    })
    callback(result)
  }
  onValue(r, handler)
  return () => off(r, 'value', handler)
}
