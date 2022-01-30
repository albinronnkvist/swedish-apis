require('dotenv').config()
const jwt = require('jsonwebtoken')

module.exports.auth = function(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if(token == null) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  jwt.verify(token, process.env.SECRET_TOKEN, (err, user) => {
    if(err) {
      return res.status(403).json({ message: 'Access denied' })
    }

    req.auth = user
    next()
  })
}