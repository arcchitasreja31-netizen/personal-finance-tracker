
const mongoose = require('mongoose')

const transactionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },

    type: {
      type: String,
      enum: ['Income', 'Expense'],
      required: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    date: {
      type: Date,
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model('Transaction', transactionSchema)
