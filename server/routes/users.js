require('dotenv').config()

const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const User = require('../models/user')

const mongoose = require('mongoose')

// GET api/users
router.get("/", async (req, res) => {
  // Query params: ?username=albin = req.query.username

  try {
    const users = await User.find()
    res.status(200).json(users)
  } 
  catch {
    res.status(500).send()
  }
})

// POST api/users/register
router.post("/register", async (req, res) => {
  // Check if username and email is available
  if(await User.exists({ username: req.body.username.toLowerCase() })) {
    return res.status(409).json({ message: 'Username already exists' })
  }
  if(await User.exists({ email: req.body.email.toLowerCase() })) {
    return res.status(409).json({ message: 'Email already exists' })
  }

  // Create new user
  try {
    const salt = await bcrypt.genSalt()
    const passwordHash = await bcrypt.hash(req.body.password, salt)

    const user = new User({
      username: req.body.username,
      email: req.body.email,
      password: passwordHash
    })

    const newUser = await user.save()

    res.status(201).json({ message: 'User created', newUser })
  }
  catch
  {
    res.status(500).send()
  }
})

// POST api/users/login
router.post("/login", async (req, res) => {
  const user = await User.findOne({ username: req.body.username.toLowerCase() })

  if(user == null) {
    return res.status(404).json({ message: 'User not found' })
  }

  // Verify password
  try {
    if(await bcrypt.compare(req.body.password, user.password)) {
      jwtUser = { 
        username: user.username, 
        email: user.email,
        createdAt: user.createdAt
      }

      const token = jwt.sign(jwtUser, process.env.SECRET_TOKEN)
      res.status(200).json({ jwt: token, message: 'Login successful' })
    } 
    else {
      res.status(401).json({ message: 'Login failed, wrong username or password' })
    }
  }
  catch {
    res.status(500).send()
  }
})


// **************
// DYNAMIC ROUTES
// **************
// GET api/users/:id
// PUT api/users/:id
// DELETE api/users/:id
router
  .route("/:id")
  .get(auth, async (req, res) => {
    if(!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'User not found' })
    }

    const user = await User.findOne({ _id: req.params.id })
    if(user == null) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.status(200).json(user)
  })
  .patch((req, res) => {
    res.send(`Update user with id: ${req.params.id}`)
  })
  .delete((req, res) => {
    res.send(`Delete user with id: ${req.params.id}`)
  })

// Middleware for id parameter
router.param("id", (req, res, next, id) => {
  // Get user from db
  // Check if it exists
  // Return user
  next()
})



function auth(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if(token == null) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  jwt.verify(token, process.env.SECRET_TOKEN, (err, user) => {
    if(err) {
      return res.status(403).json({ message: 'Access denied' })
    }

    req.user = user
    next()
  })
}


module.exports = router