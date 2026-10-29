const express = require('express')
const router = express.Router()
router.get('/check', (req, res) => {
  res.send('Transaction router is working!')
})
const Transaction = require('../models/Transaction')

// Get all transactions
router.get('/', async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ date: -1 })
    res.json(transactions)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Add a transaction
router.post('/', async (req, res) => {
  try {
    const { title, amount, type, category, date } = req.body

    const transaction = await Transaction.create({
      title,
      amount,
      type,
      category,
      date,
    })

    res.status(201).json(transaction)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
})

module.exports = router