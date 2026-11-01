
const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/User')

const router = express.Router()

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({
        message: 'Please fill in all fields',
      })
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters',
      })
    }

    const existingUser = await User.findOne({
      email: email.toLowerCase().trim(),
    })

    if (existingUser) {
      return res.status(409).json({
        message: 'Email is already registered',
      })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
    })

    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        message: 'Please enter email and password',
      })
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    })

    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password',
      })
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.password
    )

    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Invalid email or password',
      })
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    )

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

module.exports = router
