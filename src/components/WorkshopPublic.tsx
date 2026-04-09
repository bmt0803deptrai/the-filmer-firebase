import { useState } from 'react'
import { Workshop, WorkshopRegistration } from '../types'

interface Props {
  workshops: Workshop[]
  registrations: WorkshopRegistration[]
  onRegister: (reg: WorkshopRegistration) => void
}

function formatVND(n: number) { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n) }

function WorkshopCard({ ws, onSelect }: { ws: Workshop; onSelect: () => void }) {
  const pct = Math.round((ws.registered / ws.capacity) * 100)
  const isFull = ws.registered >= ws.capacity
  return (
    <div className="bg-[#F5EDD8] border border-[#D4B896] shadow-sm">
      <div className="h-1 bg-[#8B2E2E]"></div>
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-[#2C1A0E] font-medium text-lg leading-snug pr-4" style={{ fontFamily: 'Crimson Pro, serif' }}>{ws.title}</h3>
          <span className="text-[#7B1C2C] font-semibold text-sm whitespace-nowrap">{formatVND(ws.price)}</span>
        </div>
        <p className="text-[#8B6347] text-sm leading-relaxed mb-4">{ws.description}</p>
        <div className="space-y-1 text-xs text-[#8B6347] mb-4">
          <p>📅 {new Date(ws.date).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })} · {ws.time}</p>
          <p>⏱ {ws.duration} phút · Giảng viên: {ws.instructor}</p>
        </div>
        <div className="mb-4">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-[#C4A882]">{ws.registered}/{ws.capacity} đã đăng ký</span>
            {!isFull && <span className="text-[#8B6347]">Còn {ws.capacity - ws.registered} chỗ</span>}
          </div>
          <div className="w-full bg-[#E8D8C0] h-1">
            <div className="h-1 bg-[#8B2E2E] transition-all" style={{ width: `${pct}%` }}></div>
          </div>
        </div>
        <button disabled={isFull} onClick={onSelect}
          className={`w-full py-3 text-xs tracking-[0.15em] uppercase transition-all ${isFull ? 'bg-[#E8D8C0] text-[#C4A882] cursor-not-allowed' : 'bg-[#8B2E2E] text-[#F5EDD8] hover:bg-[#7B1C2C]'}`}>
          {isFull ? 'Hết chỗ' : 'Đăng ký ngay'}
        </button>
      </div>
    </div>
  )
}

function RegisterModal({ ws, onClose, onSubmit }: { ws: Workshop; onClose: () => void; onSubmit: (r: WorkshopRegistration) => void }) {
  const [name, setName] = useState(''); const [phone, setPhone] = useState('')
  const [email, setEmail] = useState(''); const [note, setNote] = useState('')
  const [done, setDone] = useState(false)

  const submit = () => {
    if (!name.trim() || !phone.trim()) return
    onSubmit({ id: `reg-${Date.now()}`, workshopId: ws.id, name: name.trim(), phone: phone.trim(), email: email.trim() || undefined, note: note.trim() || undefined, registeredAt: new Date() })
    setDone(true)
  }

  if (done) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2C1A0E]/60">
      <div className="bg-[#F5EDD8] border border-[#D4B896] p-8 w-full max-w-sm mx-4 text-center shadow-2xl">
        <p className="text-4xl mb-3">✓</p>
        <h2 className="text-2xl text-[#2C1A0E] mb-2" style={{ fontFamily: 'Crimson Pro, serif' }}>Đăng ký thành công!</h2>
        <p className="text-[#8B6347] text-sm mb-1"><strong className="text-[#7B1C2C]">{ws.title}</strong></p>
        <p className="text-[#8B6347] text-sm mb-6">{ws.date} · {ws.time}</p>
        <p className="text-[#C4A882] text-xs mb-6">The Filmer sẽ liên hệ xác nhận qua SĐT của bạn.</p>
        <button onClick={onClose} className="w-full py-3 bg-[#8B2E2E] text-[#F5EDD8] text-xs tracking-[0.2em] uppercase hover:bg-[#7B1C2C] transition-all">Đóng</button>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2C1A0E]/60 p-4">
      <div className="bg-[#F5EDD8] border border-[#D4B896] p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl text-[#2C1A0E]" style={{ fontFamily: 'Crimson Pro, serif' }}>Đăng ký Workshop</h2>
            <p className="text-[#8B2E2E] text-xs tracking-wider mt-0.5">{ws.title}</p>
          </div>
          <button onClick={onClose} className="text-[#C4A882] hover:text-[#8B6347] text-2xl">×</button>
        </div>
        <div className="bg-[#EDE0C4] border border-[#D4B896] p-3 mb-5 text-xs text-[#8B6347] space-y-0.5">
          <p>📅 {new Date(ws.date).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' })} · {ws.time} · {ws.duration} phút</p>
          <p className="text-[#7B1C2C] font-semibold">{formatVND(ws.price)}</p>
        </div>
        <div className="space-y-4">
          {[['Họ và tên *', name, setName, 'text', 'Nguyễn Văn A'], ['Số điện thoại *', phone, setPhone, 'tel', '0912 345 678'], ['Email (tuỳ chọn)', email, setEmail, 'email', 'email@example.com']].map(([label, val, setter, type, ph]) => (
            <div key={label as string}>
              <label className="block text-xs tracking-[0.12em] uppercase text-[#8B6347] mb-1.5">{label as string}</label>
              <input type={type as string} value={val as string} onChange={e => (setter as (v: string) => void)(e.target.value)} placeholder={ph as string}
                className="w-full bg-white border border-[#D4B896] text-[#2C1A0E] px-4 py-2.5 text-sm focus:outline-none focus:border-[#8B2E2E] placeholder-[#C4A882]" />
            </div>
          ))}
          <div>
            <label className="block text-xs tracking-[0.12em] uppercase text-[#8B6347] mb-1.5">Ghi chú</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Câu hỏi hoặc yêu cầu đặc biệt..." rows={3}
              className="w-full bg-white border border-[#D4B896] text-[#2C1A0E] px-4 py-2.5 text-sm focus:outline-none focus:border-[#8B2E2E] placeholder-[#C4A882] resize-none" />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 border border-[#D4B896] text-[#8B6347] text-xs tracking-[0.12em] uppercase hover:bg-[#EDE0C4] transition-all">Huỷ</button>
          <button onClick={submit} disabled={!name.trim() || !phone.trim()}
            className="flex-1 py-3 bg-[#8B2E2E] text-[#F5EDD8] text-xs tracking-[0.12em] uppercase disabled:opacity-30 hover:bg-[#7B1C2C] transition-all">
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  )
}

export default function WorkshopPublic({ workshops, registrations, onRegister }: Props) {
  const [selected, setSelected] = useState<Workshop | null>(null)
  return (
    <div className="min-h-screen">
      {selected && <RegisterModal ws={selected} onClose={() => setSelected(null)} onSubmit={reg => { onRegister(reg) }} />}
      <div className="bg-[#F5EDD8] border-b border-[#D4B896] px-6 py-12 text-center">
        <p className="text-xs tracking-[0.3em] uppercase text-[#8B2E2E] mb-2">The Filmer Studio</p>
        <h1 className="text-4xl italic text-[#2C1A0E]" style={{ fontFamily: 'Crimson Pro, serif' }}>Workshops</h1>
        <p className="text-[#8B6347] max-w-md mx-auto text-sm leading-relaxed mt-3">Học hỏi từ những nhiếp ảnh gia chuyên nghiệp. Nâng cao kỹ năng và khám phá nghệ thuật nhiếp ảnh.</p>
      </div>
      <div className="max-w-3xl mx-auto px-6 py-8">
        {workshops.length === 0 ? (
          <p className="text-center text-[#C4A882] py-20">Chưa có workshop nào sắp diễn ra</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {workshops.map(ws => <WorkshopCard key={ws.id} ws={ws} onSelect={() => setSelected(ws)} />)}
          </div>
        )}
      </div>
      <div className="border-t border-[#D4B896] py-6 text-center bg-[#F5EDD8]">
        <p className="text-[#C4A882] text-xs tracking-widest">© THE FILMER STUDIO</p>
      </div>
    </div>
  )
}
