
require('dotenv').config()
const mongoose = require('mongoose')
const Transaction = require('./models/Transaction')

const userId = new mongoose.Types.ObjectId(
  '6ae71b240326af1249b64bb2'
)

async function migrateTransactions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)

    const result = await Transaction.updateMany(
      { userId: { $exists: false } },
      { $set: { userId } }
    )

    console.log('Migration completed!')
    console.log('Transactions updated:', result.modifiedCount)
  } catch (error) {
    console.error('Migration failed:', error.message)
  } finally {
    await mongoose.disconnect()
  }
}

migrateTransactions()
