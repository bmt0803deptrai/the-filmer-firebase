import * as functions from 'firebase-functions/v1'
import * as admin from 'firebase-admin'

admin.initializeApp()
const db = admin.database()

// ─── Daily reset at 0h05 Vietnam time (UTC+7 = 17h05 UTC) ─────
export const dailyReset = functions
  .region('asia-southeast1')
  .pubsub
  .schedule('5 17 * * *')   // 0h05 ICT = 17h05 UTC
  .timeZone('Asia/Ho_Chi_Minh')
  .onRun(async () => {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' })
    // e.g. "2026-04-09"

    try {
      // 1. Read current queue
      const queueSnap = await db.ref('queue').get()
      const queueVal = queueSnap.val()

      if (queueVal) {
        // 2. Archive to history/YYYY-MM-DD
        await db.ref(`history/${today}`).set(queueVal)
        console.log(`Archived ${Object.keys(queueVal).length} entries to history/${today}`)
      }

      // 3. Delete current queue
      await db.ref('queue').remove()

      // 4. Reset next numbers to 1 for all services
      const numsSnap = await db.ref('nextNumbers').get()
      const nums = numsSnap.val() ?? {}
      const resetNums: Record<string, number> = {}
      Object.keys(nums).forEach(k => { resetNums[k] = 1 })
      await db.ref('nextNumbers').set(resetNums)

      // 5. Reset roomNumbers to 0
      const roomNumsSnap = await db.ref('roomNumbers').get()
      const roomNums = roomNumsSnap.val() ?? {}
      const resetRoomNums: Record<string, number> = {}
      Object.keys(roomNums).forEach(k => { resetRoomNums[k] = 0 })
      await db.ref('roomNumbers').set(resetRoomNums)

      console.log(`Daily reset complete for ${today}`)
    } catch (err) {
      console.error('Daily reset failed:', err)
      throw err
    }
  })

// ─── Manual reset endpoint (for testing) ─────────────────────
export const manualReset = functions
  .region('asia-southeast1')
  .https.onRequest(async (req, res) => {
    // Simple auth check
    const secret = req.headers['x-reset-secret']
    if (secret !== process.env.RESET_SECRET) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' })
    const queueSnap = await db.ref('queue').get()
    const queueVal = queueSnap.val()
    if (queueVal) await db.ref(`history/${today}`).set(queueVal)
    await db.ref('queue').remove()

    const numsSnap = await db.ref('nextNumbers').get()
    const nums = numsSnap.val() ?? {}
    const resetNums: Record<string, number> = {}
    Object.keys(nums).forEach(k => { resetNums[k] = 1 })
    await db.ref('nextNumbers').set(resetNums)
    await db.ref('roomNumbers').set({})

    res.json({ success: true, archivedDate: today })
  })
