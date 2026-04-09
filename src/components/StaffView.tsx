import { useState } from 'react'
import { AppState, QueueEntry, Room } from '../types'

interface Props {
  state: AppState
  onAddToQueue: (name: string, groupSize: number, phone?: string) => void
  onCallGuest: (entryId: string, roomId: string) => void
  onCompleteSession: (roomId: string) => void
  onRemoveFromQueue: (entryId: string) => void
}

function RoomCard({ room, waitingGuests, onCallGuest, onComplete }: {
  room: Room
  waitingGuests: QueueEntry[]
  onCallGuest: (entryId: string, roomId: string) => void
  onComplete: (roomId: string) => void
}) {
  const [selectedGuest, setSelectedGuest] = useState('')
  const isAvailable = room.status === 'available'
  const isOccupied = room.status === 'occupied'

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${isOccupied ? 'border-[#8B2E2E] bg-[#FDF5EC]' : 'border-[#D4B896] bg-white'}`}>
      <div className={`px-4 py-3 border-b ${isOccupied ? 'border-[#D4A0A0] bg-[#8B2E2E]' : 'border-[#D4B896] bg-[#F5EDD8]'}`}>
        <div className="flex items-center justify-between">
          <h3 className={`font-semibold tracking-wider text-sm uppercase ${isOccupied ? 'text-[#F5EDD8]' : 'text-[#2C1A0E]'}`}>{room.name}</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            isAvailable ? 'bg-[#D4EDD4] text-[#2E6B2E]' : 'bg-[#F5EDD8] text-[#F5EDD8] bg-opacity-20'
          }`}>
            {isAvailable ? 'Trống' : isOccupied ? <span className="text-[#FFD0D0]">Đang dùng</span> : 'Dọn dẹp'}
          </span>
        </div>
        <p className={`text-xs mt-0.5 ${isOccupied ? 'text-[#E8C0C0]' : 'text-[#8B6347]'}`}>{room.theme}</p>
      </div>
      <div className="p-4 space-y-2">
        {isAvailable ? (
          <>
            <select
              value={selectedGuest}
              onChange={e => setSelectedGuest(e.target.value)}
              className="w-full bg-[#F5EDD8] border border-[#D4B896] text-[#2C1A0E] text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#8B2E2E]"
            >
              <option value="">-- Chọn khách --</option>
              {waitingGuests.map(g => (
                <option key={g.id} value={g.id}>#{g.number} {g.name} ({g.groupSize} người)</option>
              ))}
            </select>
            <button
              disabled={!selectedGuest}
              onClick={() => { onCallGuest(selectedGuest, room.id); setSelectedGuest('') }}
              className="w-full py-2 text-sm font-medium rounded-lg tracking-wider uppercase transition-all disabled:opacity-30 bg-[#8B2E2E] text-[#F5EDD8] hover:bg-[#A03535] disabled:cursor-not-allowed"
            >
              Gọi vào phòng
            </button>
          </>
        ) : isOccupied ? (
          <button
            onClick={() => onComplete(room.id)}
            className="w-full py-2 text-sm font-medium rounded-lg tracking-wider uppercase bg-[#E8F5E8] text-[#2E6B2E] border border-[#A8D4A8] hover:bg-[#D4EDD4] transition-all"
          >
            ✓ Kết thúc session
          </button>
        ) : null}
      </div>
    </div>
  )
}

function AddGuestModal({ onClose, onAdd }: { onClose: () => void; onAdd: (name: string, groupSize: number, phone?: string) => void }) {
  const [name, setName] = useState('')
  const [groupSize, setGroupSize] = useState(1)
  const [phone, setPhone] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2C1A0E]/50">
      <div className="bg-white border border-[#D4B896] rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl">
        <h2 className="text-[#2C1A0E] font-semibold tracking-widest text-sm uppercase mb-5">Thêm khách vào queue</h2>
        <div className="space-y-4">
          <div>
            <label className="text-[#8B6347] text-xs uppercase tracking-wider block mb-1">Tên khách *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nguyễn Văn A"
              className="w-full bg-[#FAF5EE] border border-[#D4B896] text-[#2C1A0E] text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#8B2E2E] placeholder-[#C4A882]" />
          </div>
          <div>
            <label className="text-[#8B6347] text-xs uppercase tracking-wider block mb-1">Số người</label>
            <div className="flex items-center gap-3">
              <button onClick={() => setGroupSize(Math.max(1, groupSize - 1))} className="w-8 h-8 rounded-lg border border-[#D4B896] text-[#2C1A0E] hover:bg-[#F5EDD8] transition-all">−</button>
              <span className="text-[#2C1A0E] font-semibold text-lg w-6 text-center">{groupSize}</span>
              <button onClick={() => setGroupSize(Math.min(10, groupSize + 1))} className="w-8 h-8 rounded-lg border border-[#D4B896] text-[#2C1A0E] hover:bg-[#F5EDD8] transition-all">+</button>
            </div>
          </div>
          <div>
            <label className="text-[#8B6347] text-xs uppercase tracking-wider block mb-1">Số điện thoại (tuỳ chọn)</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="0912 345 678"
              className="w-full bg-[#FAF5EE] border border-[#D4B896] text-[#2C1A0E] text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#8B2E2E] placeholder-[#C4A882]" />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2 text-sm border border-[#D4B896] text-[#8B6347] rounded-lg hover:bg-[#F5EDD8] transition-all">Huỷ</button>
          <button onClick={() => { if (!name.trim()) return; onAdd(name.trim(), groupSize, phone.trim() || undefined); onClose() }}
            disabled={!name.trim()} className="flex-1 py-2 text-sm bg-[#8B2E2E] text-[#F5EDD8] rounded-lg font-medium disabled:opacity-30 hover:bg-[#A03535] transition-all">
            Thêm
          </button>
        </div>
      </div>
    </div>
  )
}

function getWaitMinutes(joinedAt: Date) {
  return Math.floor((Date.now() - new Date(joinedAt).getTime()) / 60000)
}

export default function StaffView({ state, onAddToQueue, onCallGuest, onCompleteSession, onRemoveFromQueue }: Props) {
  const [showAdd, setShowAdd] = useState(false)
  const waiting = state.queue.filter(q => q.status === 'waiting')
  const called = state.queue.filter(q => q.status === 'called')

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {showAdd && <AddGuestModal onClose={() => setShowAdd(false)} onAdd={onAddToQueue} />}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[#2C1A0E] text-xl font-light tracking-widest uppercase">Queue Management</h1>
          <p className="text-[#8B6347] text-xs mt-1">{waiting.length} đang chờ · {called.length} đang chụp</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="px-5 py-2 bg-[#8B2E2E] text-[#F5EDD8] text-sm font-medium rounded-lg tracking-wider uppercase hover:bg-[#A03535] transition-all shadow-sm">
          + Thêm khách
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <p className="text-[#8B6347] text-xs uppercase tracking-widest mb-3">Phòng chụp</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {state.rooms.map(room => (
              <RoomCard key={room.id} room={room} waitingGuests={waiting} onCallGuest={onCallGuest} onComplete={onCompleteSession} />
            ))}
          </div>

          {called.length > 0 && (
            <div className="mt-6">
              <p className="text-[#8B6347] text-xs uppercase tracking-widest mb-3">Đang trong phòng</p>
              <div className="space-y-2">
                {called.map(entry => {
                  const room = state.rooms.find(r => r.currentGuest === entry.id)
                  return (
                    <div key={entry.id} className="flex items-center justify-between bg-[#FFF8F0] border border-[#E8C8A0] rounded-xl px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-[#8B2E2E] font-bold text-lg w-8">#{entry.number}</span>
                        <div>
                          <p className="text-[#2C1A0E] text-sm font-medium">{entry.name}</p>
                          <p className="text-[#8B6347] text-xs">{entry.groupSize} người · {room?.name}</p>
                        </div>
                      </div>
                      <span className="text-xs text-[#8B2E2E] bg-[#F5DDD8] px-2 py-1 rounded-full font-medium">Đang chụp</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div>
          <p className="text-[#8B6347] text-xs uppercase tracking-widest mb-3">Hàng chờ ({waiting.length})</p>
          {waiting.length === 0 ? (
            <div className="border border-dashed border-[#D4B896] rounded-xl p-8 text-center">
              <p className="text-[#C4A882] text-sm">Không có khách chờ</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {waiting.map((entry) => (
                <div key={entry.id} className="bg-white border border-[#E8D8C0] rounded-xl px-4 py-3 flex items-center justify-between group hover:border-[#D4B896] transition-all">
                  <div className="flex items-center gap-3">
                    <span className="text-[#8B2E2E] font-bold text-lg w-8">#{entry.number}</span>
                    <div>
                      <p className="text-[#2C1A0E] text-sm">{entry.name}</p>
                      <p className="text-[#8B6347] text-xs">{entry.groupSize} người · {getWaitMinutes(entry.joinedAt)}p chờ</p>
                    </div>
                  </div>
                  <button onClick={() => onRemoveFromQueue(entry.id)}
                    className="text-[#C4A882] hover:text-[#8B2E2E] opacity-0 group-hover:opacity-100 transition-all text-xs">✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
