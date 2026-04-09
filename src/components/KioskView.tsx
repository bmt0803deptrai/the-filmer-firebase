import { useEffect, useState } from 'react'
import { AppState } from '../types'

interface Props { state: AppState }

function Clock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="text-right">
      <p className="text-[#2C1A0E] text-3xl font-light tracking-widest">
        {time.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </p>
      <p className="text-[#8B6347] text-sm">
        {time.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
      </p>
    </div>
  )
}

export default function KioskView({ state }: Props) {
  const waiting = state.queue.filter(q => q.status === 'waiting')
  const called = state.queue.filter(q => q.status === 'called')
  const availableRooms = state.rooms.filter(r => r.status === 'available').length

  return (
    <div className="min-h-screen bg-[#F5EDD8] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-10 py-6 border-b border-[#D4B896] bg-[#FAF5EE]">
        <div>
          <h1 className="text-[#2C1A0E] text-3xl font-light tracking-[0.3em] uppercase" style={{fontFamily:'Crimson Pro, serif'}}>The Filmer</h1>
          <p className="text-[#8B2E2E] text-sm tracking-widest mt-1">Studio Queue Display</p>
        </div>
        <Clock />
      </div>

      <div className="flex-1 px-10 py-8 grid grid-cols-3 gap-8">
        {/* Now serving */}
        <div className="col-span-2">
          <p className="text-[#8B6347] text-xs uppercase tracking-widest mb-4">Đang chụp</p>
          {called.length === 0 ? (
            <div className="border border-dashed border-[#D4B896] rounded-2xl p-12 text-center">
              <p className="text-[#C4A882] text-lg">Chưa có khách</p>
            </div>
          ) : (
            <div className="space-y-4">
              {called.map(entry => {
                const room = state.rooms.find(r => r.currentGuest === entry.id)
                return (
                  <div key={entry.id} className="bg-white border border-[#D4B896] rounded-2xl p-6 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 rounded-full bg-[#8B2E2E] flex items-center justify-center shadow-md">
                        <span className="text-[#F5EDD8] text-3xl font-bold">#{entry.number}</span>
                      </div>
                      <div>
                        <p className="text-[#2C1A0E] text-2xl font-light" style={{fontFamily:'Crimson Pro, serif'}}>{entry.name}</p>
                        <p className="text-[#8B6347] text-sm mt-1">{entry.groupSize} người</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[#8B2E2E] text-lg font-semibold">{room?.name}</p>
                      <p className="text-[#8B6347] text-sm">{room?.theme}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Room status */}
          <p className="text-[#8B6347] text-xs uppercase tracking-widest mt-8 mb-4">Trạng thái phòng</p>
          <div className="grid grid-cols-3 gap-4">
            {state.rooms.map(room => (
              <div key={room.id} className={`rounded-xl p-5 border ${room.status === 'available' ? 'border-[#A8D4A8] bg-[#F0FAF0]' : 'border-[#D4A0A0] bg-[#FFF0F0]'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[#2C1A0E] text-sm font-medium">{room.name}</span>
                  <div className={`w-2.5 h-2.5 rounded-full ${room.status === 'available' ? 'bg-[#4CAF50]' : 'bg-[#E05050]'}`}></div>
                </div>
                <p className="text-[#8B6347] text-xs">{room.theme}</p>
                <p className={`text-xs mt-2 font-medium ${room.status === 'available' ? 'text-[#2E6B2E]' : 'text-[#8B2E2E]'}`}>
                  {room.status === 'available' ? 'Trống' : 'Đang dùng'}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Queue list */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-[#8B6347] text-xs uppercase tracking-widest">Hàng chờ</p>
            <span className="text-[#8B2E2E] text-xs bg-[#F5DDD8] border border-[#D4A0A0] px-2 py-0.5 rounded-full">{waiting.length} người</span>
          </div>
          {waiting.length === 0 ? (
            <div className="border border-dashed border-[#D4B896] rounded-xl p-8 text-center">
              <p className="text-[#C4A882]">Không có khách chờ</p>
            </div>
          ) : (
            <div className="space-y-2">
              {waiting.map((entry, idx) => (
                <div key={entry.id}
                  className={`rounded-xl px-5 py-4 flex items-center justify-between ${idx === 0 ? 'bg-[#8B2E2E] shadow-md' : 'bg-white border border-[#E8D8C0]'}`}>
                  <div className="flex items-center gap-4">
                    <span className={`font-bold text-xl ${idx === 0 ? 'text-[#F5EDD8]' : 'text-[#8B2E2E]'}`}>#{entry.number}</span>
                    <div>
                      <p className={`text-sm font-medium ${idx === 0 ? 'text-[#F5EDD8]' : 'text-[#2C1A0E]'}`}>{entry.name}</p>
                      <p className={`text-xs ${idx === 0 ? 'text-[#E8C0C0]' : 'text-[#8B6347]'}`}>{entry.groupSize} người</p>
                    </div>
                  </div>
                  {idx === 0 && (
                    <span className="text-xs text-[#8B2E2E] bg-[#F5EDD8] px-2 py-1 rounded-full animate-pulse font-medium">Tiếp theo</span>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 space-y-3">
            <div className="bg-white border border-[#E8D8C0] rounded-xl px-5 py-4 flex items-center justify-between">
              <span className="text-[#8B6347] text-sm">Phòng trống</span>
              <span className="text-[#2E6B2E] text-xl font-bold">{availableRooms}</span>
            </div>
            <div className="bg-white border border-[#E8D8C0] rounded-xl px-5 py-4 flex items-center justify-between">
              <span className="text-[#8B6347] text-sm">Đang chờ</span>
              <span className="text-[#2C1A0E] text-xl font-bold">{waiting.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-[#D4B896] bg-[#FAF5EE] px-10 py-4 flex items-center justify-between">
        <p className="text-[#C4A882] text-xs tracking-widest">THE FILMER STUDIO</p>
        <p className="text-[#C4A882] text-xs">Vui lòng chú ý màn hình khi được gọi tên</p>
      </div>
    </div>
  )
}
