
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
require('dotenv').config()

const authRoutes = require('./routes/authRoutes')
const Transaction = require('./models/Transaction')
const Budget = require('./models/Budget')
const authMiddleware = require('./middleware/authMiddleware')

const app = express()

app.use(cors())
app.use(express.json())

// Authentication routes
app.use('/api/auth', authRoutes)

// Home route
app.get('/', (req, res) => {
  res.send('Personal Finance Tracker API is running!')
})

// Transaction test route
app.get('/api/transactions/check', (req, res) => {
  res.send('Transactions endpoint is working!')
})

// Get all transactions for the logged-in user
app.get('/api/transactions', authMiddleware, async (req, res) => {
  try {
    const transactions = await Transaction.find({
      userId: req.userId,
    }).sort({ date: -1 })

    res.status(200).json(transactions)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch transactions.' })
  }
})

// Add a transaction
app.post('/api/transactions', authMiddleware, async (req, res) => {
  try {
    const { title, amount, type, category, date } = req.body

    const transaction = await Transaction.create({
      title,
      amount,
      type,
      category,
      date,
      userId: req.userId,
    })

    res.status(201).json(transaction)
  } catch (error) {
    res.status(400).json({
      message: error.message || 'Failed to add transaction.',
    })
  }
})

// Delete a transaction
app.delete('/api/transactions/:id', authMiddleware, async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    })

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found.' })
    }

    res.status(200).json({ message: 'Transaction deleted successfully.' })
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete transaction.' })
  }
})

// Update an existing transaction
app.put('/api/transactions/:id', authMiddleware, async (req, res) => {
  try {
    const { title, amount, type, category, date } = req.body

    if (
      !title?.trim() ||
      !Number.isFinite(Number(amount)) ||
      Number(amount) <= 0 ||
      !['Income', 'Expense'].includes(type) ||
      !category ||
      !date
    ) {
      return res.status(400).json({
        message: 'Please provide valid transaction details.',
      })
    }

    const transaction = await Transaction.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.userId,
      },
      {
        title: title.trim(),
        amount: Number(amount),
        type,
        category,
        date,
      },
      {
        new: true,
        runValidators: true,
      }
    )

    if (!transaction) {
      return res.status(404).json({
        message: 'Transaction not found.',
      })
    }

    res.status(200).json(transaction)
  } catch (error) {
    console.error('Update transaction error:', error)

    res.status(500).json({
      message: 'Failed to update transaction.',
    })
  }
})

// Get all budgets for the logged-in user
app.get('/api/budgets', authMiddleware, async (req, res) => {
  try {
    const budgets = await Budget.find({
      userId: req.userId,
    }).sort({ category: 1 })

    res.status(200).json(budgets)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch budgets.' })
  }
})

// Add a new budget
app.post('/api/budgets', authMiddleware, async (req, res) => {
  try {
    const { category, limit } = req.body

    if (!category || !limit || Number(limit) <= 0) {
      return res.status(400).json({
        message: 'Please provide a valid category and budget limit.',
      })
    }

    const budget = await Budget.create({
      category,
      limit: Number(limit),
      userId: req.userId,
    })

    res.status(201).json(budget)
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'A budget for this category already exists.',
      })
    }

    res.status(400).json({
      message: error.message || 'Failed to create budget.',
    })
  }
})

// Delete a budget
app.delete('/api/budgets/:id', authMiddleware, async (req, res) => {
  try {
    const budget = await Budget.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    })

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found.' })
    }

    res.status(200).json({ message: 'Budget deleted successfully.' })
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete budget.' })
  }
})

// Start server
const PORT = process.env.PORT || 5000

const startServer = async () => {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is missing from the .env file.')
    }

    await mongoose.connect(process.env.MONGODB_URI)

    console.log('MongoDB connected successfully!')

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`)
    })
  } catch (error) {
    console.error('Server startup error:', error.message)
  }
}

startServer()
