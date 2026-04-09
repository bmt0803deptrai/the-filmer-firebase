/**
 * Firebase Realtime Database structure:
 *
 * /settings
 *   /rooms/{id}: { name, theme, type, price, currentNumber }
 *   /workshops/{id}: { title, date, time, duration, capacity, registered, price, description, instructor }
 *
 * /queue/{entryId}: QueueEntry   ← today's live queue, reset at 0h05
 *
 * /nextNumbers/{serviceId}: number
 *
 * /history/{YYYY-MM-DD}/{entryId}: QueueEntry   ← permanent archive
 */

import { db } from '../firebase'
import { ref, set, update, onValue, off, get } from 'firebase/database'
import { type Room, type Workshop, type QueueEntry } from '../types'

// ── Settings ──────────────────────────────────────────────────────────────────
export function watchSettings(
  onRooms: (rooms: Room[]) => void,
  onWorkshops: (workshops: Workshop[]) => void
) {
  const roomsRef = ref(db, 'settings/rooms')
  const wsRef = ref(db, 'settings/workshops')

  onValue(roomsRef, snap => {
    if (snap.exists()) {
      const data = snap.val()
      onRooms(Object.values(data) as Room[])
    }
  })

  onValue(wsRef, snap => {
    if (snap.exists()) {
      const data = snap.val()
      onWorkshops(Object.values(data) as Workshop[])
    }
  })

  return () => { off(roomsRef); off(wsRef) }
}

export async function saveSettings(rooms: Room[], workshops: Workshop[]) {
  const roomsObj: Record<string, Room> = {}
  rooms.forEach(r => { roomsObj[r.id] = r })
  const wsObj: Record<string, Workshop> = {}
  workshops.forEach(w => { wsObj[w.id] = w })

  await update(ref(db, 'settings'), {
    rooms: roomsObj,
    workshops: wsObj,
  })
}

// ── Queue ─────────────────────────────────────────────────────────────────────
export function watchQueue(onChange: (queue: QueueEntry[]) => void) {
  const qRef = ref(db, 'queue')
  onValue(qRef, snap => {
    if (snap.exists()) {
      const data = snap.val()
      const entries = Object.values(data).map((e: any) => ({
        ...e,
        joinedAt: new Date(e.joinedAt),
        approvedAt: e.approvedAt ? new Date(e.approvedAt) : undefined,
        servedAt: e.servedAt ? new Date(e.servedAt) : undefined,
        cancelledAt: e.cancelledAt ? new Date(e.cancelledAt) : undefined,
      })) as QueueEntry[]
      onChange(entries)
    } else {
      onChange([])
    }
  })
  return () => off(qRef)
}

export async function addQueueEntry(entry: QueueEntry) {
  await set(ref(db, `queue/${entry.id}`), {
    ...entry,
    joinedAt: entry.joinedAt.toISOString(),
  })
}

export async function updateQueueEntry(id: string, updates: Partial<QueueEntry>) {
  const patch: Record<string, any> = { ...updates }
  if (updates.approvedAt) patch.approvedAt = updates.approvedAt.toISOString()
  if (updates.servedAt) patch.servedAt = updates.servedAt.toISOString()
  if (updates.cancelledAt) patch.cancelledAt = updates.cancelledAt.toISOString()
  await update(ref(db, `queue/${id}`), patch)
}

// ── Next numbers ──────────────────────────────────────────────────────────────
export function watchNextNumbers(onChange: (nums: Record<string, number>) => void) {
  const r = ref(db, 'nextNumbers')
  onValue(r, snap => {
    onChange(snap.exists() ? snap.val() : {})
  })
  return () => off(r)
}

export async function incrementNextNumber(serviceId: string, current: number) {
  await set(ref(db, `nextNumbers/${serviceId}`), current + 1)
}

// ── History ───────────────────────────────────────────────────────────────────
export function watchHistory(
  dateKey: string,
  onChange: (entries: QueueEntry[]) => void
) {
  const r = ref(db, `history/${dateKey}`)
  onValue(r, snap => {
    if (snap.exists()) {
      const entries = Object.values(snap.val()).map((e: any) => ({
        ...e,
        joinedAt: new Date(e.joinedAt),
        approvedAt: e.approvedAt ? new Date(e.approvedAt) : undefined,
        servedAt: e.servedAt ? new Date(e.servedAt) : undefined,
        cancelledAt: e.cancelledAt ? new Date(e.cancelledAt) : undefined,
      })) as QueueEntry[]
      onChange(entries)
    } else {
      onChange([])
    }
  })
  return () => off(r)
}

export async function getAllHistory(): Promise<Record<string, QueueEntry[]>> {
  const snap = await get(ref(db, 'history'))
  if (!snap.exists()) return {}
  const result: Record<string, QueueEntry[]> = {}
  const data = snap.val()
  Object.entries(data).forEach(([dateKey, entries]: [string, any]) => {
    result[dateKey] = Object.values(entries).map((e: any) => ({
      ...e,
      joinedAt: new Date(e.joinedAt),
      approvedAt: e.approvedAt ? new Date(e.approvedAt) : undefined,
      servedAt: e.servedAt ? new Date(e.servedAt) : undefined,
      cancelledAt: e.cancelledAt ? new Date(e.cancelledAt) : undefined,
    })) as QueueEntry[]
  })
  return result
}

// ── Room current number ───────────────────────────────────────────────────────
export async function updateRoomCurrentNumber(roomId: string, number: number) {
  await set(ref(db, `settings/rooms/${roomId}/currentNumber`), number)
}
