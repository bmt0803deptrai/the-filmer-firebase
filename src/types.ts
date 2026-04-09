export interface Room {
  id: string
  name: string
  theme: string
  type: 'selfbooth' | 'photobooth'
  price: number
  currentNumber: number
  totalServed: number
}

export interface Workshop {
  id: string
  title: string
  date: string
  time: string
  duration: number
  capacity: number
  registered: number
  price: number
  description: string
  instructor: string
}

// One QueueEntry = one service slot (one room OR one workshop)
// A guest booking 2 rooms + 1 workshop = 3 separate entries, same guestId
export interface QueueEntry {
  id: string
  guestId: string          // groups all entries from same booking
  number: number           // per-service sequential number
  name: string
  phone: string
  serviceType: 'room' | 'workshop'
  serviceId: string        // roomId or workshopId
  paymentMethod: 'cash' | 'transfer'
  status: 'pending' | 'waiting' | 'serving' | 'done' | 'cancelled'
  joinedAt: Date
  servedAt?: Date
  approvedAt?: Date
  cancelledAt?: Date
  totalAmount: number      // price for this service slot only
}
