import { AppState, Workshop, WorkshopRegistration } from '../types'

interface Props {
  state: AppState
  workshops: Workshop[]
  registrations: WorkshopRegistration[]
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-white border border-[#E8D8C0] rounded-xl p-5 shadow-sm">
      <p className="text-[#8B6347] text-xs uppercase tracking-widest mb-2">{label}</p>
      <p className="font-bold text-2xl" style={{ color: color || '#2C1A0E' }}>{value}</p>
      {sub && <p className="text-[#C4A882] text-xs mt-1">{sub}</p>}
    </div>
  )
}

export default function AdminView({ state, workshops, registrations }: Props) {
  const totalToday = state.queue.length
  const doneToday = state.queue.filter(q => q.status === 'done').length
  const waitingNow = state.queue.filter(q => q.status === 'waiting').length
  const occupiedRooms = state.rooms.filter(r => r.status === 'occupied').length
  const totalWorkshopReg = workshops.reduce((s, w) => s + w.registered, 0)
  const totalWorkshopSlots = workshops.reduce((s, w) => s + w.capacity, 0)

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-[#2C1A0E] text-xl font-light tracking-widest uppercase">Admin Dashboard</h1>
        <p className="text-[#8B6347] text-xs mt-1">Tổng quan hoạt động hôm nay</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard label="Khách hôm nay" value={totalToday} sub="Tổng queue" />
        <StatCard label="Đã xong" value={doneToday} color="#2E6B2E" sub="Sessions hoàn thành" />
        <StatCard label="Đang chờ" value={waitingNow} color="#8B6010" sub="Trong queue" />
        <StatCard label="Phòng đang dùng" value={`${occupiedRooms}/3`} color="#8B2E2E" sub="Rooms occupied" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Room status */}
        <div className="bg-white border border-[#E8D8C0] rounded-xl p-5 shadow-sm">
          <p className="text-[#8B6347] text-xs uppercase tracking-widest mb-4">Trạng thái phòng</p>
          <div className="space-y-1">
            {state.rooms.map(room => {
              const isOccupied = room.status === 'occupied'
              const guest = isOccupied ? state.queue.find(q => q.id === room.currentGuest) : null
              return (
                <div key={room.id} className="flex items-center justify-between py-3 border-b border-[#F0E8D8] last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${isOccupied ? 'bg-[#E05050]' : 'bg-[#4CAF50]'}`}></div>
                    <div>
                      <p className="text-[#2C1A0E] text-sm">{room.name}</p>
                      <p className="text-[#C4A882] text-xs">{room.theme}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {guest ? (
                      <>
                        <p className="text-[#8B2E2E] text-xs font-medium">#{guest.number} {guest.name}</p>
                        <p className="text-[#C4A882] text-xs">{guest.groupSize} người</p>
                      </>
                    ) : (
                      <span className="text-[#2E6B2E] text-xs font-medium">Trống</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Workshop overview */}
        <div className="bg-white border border-[#E8D8C0] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[#8B6347] text-xs uppercase tracking-widest">Workshop sắp tới</p>
            <span className="text-xs text-[#8B6010] bg-[#FFF8E8] border border-[#E8D090] px-2 py-0.5 rounded-full">
              {totalWorkshopReg}/{totalWorkshopSlots} slots
            </span>
          </div>
          <div className="space-y-4">
            {workshops.map(ws => {
              const pct = Math.round((ws.registered / ws.capacity) * 100)
              const wsRegs = registrations.filter(r => r.workshopId === ws.id)
              return (
                <div key={ws.id} className="border border-[#E8D8C0] rounded-lg p-4 bg-[#FAF5EE]">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-[#2C1A0E] text-sm font-medium">{ws.title}</p>
                      <p className="text-[#8B6347] text-xs mt-0.5">{ws.date} · {ws.time} · {ws.instructor}</p>
                    </div>
                    <span className="text-[#8B6010] text-xs font-semibold">{ws.registered}/{ws.capacity}</span>
                  </div>
                  <div className="w-full bg-[#E8D8C0] rounded-full h-1.5 mt-2">
                    <div className="h-1.5 rounded-full bg-[#8B2E2E]" style={{ width: `${pct}%` }}></div>
                  </div>
                  {wsRegs.length > 0 && (
                    <div className="mt-3 space-y-1">
                      <p className="text-[#C4A882] text-xs uppercase tracking-wider">Đã đăng ký:</p>
                      {wsRegs.slice(0, 3).map(r => (
                        <div key={r.id} className="flex items-center justify-between text-xs">
                          <span className="text-[#8B6347]">{r.name}</span>
                          <span className="text-[#C4A882]">{r.phone}</span>
                        </div>
                      ))}
                      {wsRegs.length > 3 && <p className="text-[#C4A882] text-xs">+{wsRegs.length - 3} khách khác</p>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Queue history */}
        <div className="bg-white border border-[#E8D8C0] rounded-xl p-5 shadow-sm lg:col-span-2">
          <p className="text-[#8B6347] text-xs uppercase tracking-widest mb-4">Lịch sử queue hôm nay</p>
          {state.queue.length === 0 ? (
            <p className="text-[#C4A882] text-sm text-center py-8">Chưa có dữ liệu</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#F0E8D8]">
                    {['STT','Tên','Người','Trạng thái','Giờ vào'].map(h => (
                      <th key={h} className="text-left text-[#C4A882] text-xs uppercase tracking-wider pb-3 font-normal">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...state.queue].reverse().map(entry => (
                    <tr key={entry.id} className="border-b border-[#FAF5EE] hover:bg-[#FAF5EE]">
                      <td className="py-3 text-[#8B2E2E] font-bold">#{entry.number}</td>
                      <td className="py-3 text-[#2C1A0E]">{entry.name}</td>
                      <td className="py-3 text-[#8B6347]">{entry.groupSize}</td>
                      <td className="py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          entry.status === 'done' ? 'bg-[#D4EDD4] text-[#2E6B2E]' :
                          entry.status === 'called' ? 'bg-[#FFF8E0] text-[#8B6010]' :
                          'bg-[#F5EDD8] text-[#8B6347]'
                        }`}>
                          {entry.status === 'done' ? 'Xong' : entry.status === 'called' ? 'Đang chụp' : 'Chờ'}
                        </span>
                      </td>
                      <td className="py-3 text-[#C4A882] text-xs">
                        {new Date(entry.joinedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
