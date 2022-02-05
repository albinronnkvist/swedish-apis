require('dotenv').config()
const jwt = require('jsonwebtoken')

module.exports.authRequired = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if(token == null) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  jwt.verify(token, process.env.SECRET_TOKEN, (err, user) => {
    if(err) {
      return res.status(403).json({ message: 'Access denied' })
    }

    req.authUser = user
    next()
  })
}

module.exports.authPrivilege = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if(token == null) {
    req.authUser = null
  }

  jwt.verify(token, process.env.SECRET_TOKEN, (err, user) => {
    if(err) {
      req.authUser = null
    }

    req.authUser = user
  })

  next()
}

module.exports.createToken = (claims) => {
  return jwt.sign(claims, process.env.SECRET_TOKEN, { expiresIn: '30m' })
}