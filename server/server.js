const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
require('dotenv').config()

const Transaction = require('./models/Transaction')

const app = express()

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.send('Personal Finance Tracker API is running!')
})

app.get('/api/transactions/check', (req, res) => {
  res.send('Transactions endpoint is working!')
})

app.get('/api/transactions', async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ date: -1 })
    res.json(transactions)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

app.post('/api/transactions', async (req, res) => {
  try {
    const transaction = await Transaction.create(req.body)
    res.status(201).json(transaction)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
})
app.delete('/api/transactions/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findByIdAndDelete(
      req.params.id
    )

    if (!transaction) {
      return res.status(404).json({
        message: 'Transaction not found',
      })
    }

    res.json({ message: 'Transaction deleted successfully' })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
})
async function startServer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('MongoDB connected successfully!')

    const PORT = process.env.PORT || 5000

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`)
    })
  } catch (error) {
    console.error('MongoDB connection failed:', error.message)
    process.exit(1)
  }
}

startServer()