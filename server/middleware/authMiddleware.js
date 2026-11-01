const jwt = require('jsonwebtoken')

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Access denied. Please login.',
      })
    }

    const token = authHeader.split(' ')[1]

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    req.userId = decoded.userId || decoded.id

    if (!req.userId) {
      return res.status(401).json({
        message: 'Invalid token.',
      })
    }

    next()
  } catch (error) {
    return res.status(401).json({
      message: 'Invalid or expired token.',
    })
  }
}

module.exports = authMiddleware