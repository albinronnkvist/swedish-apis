require('dotenv').config()

const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const User = require('../models/user')
const auth = require('../auth/auth')

const mongoose = require('mongoose')

// GET api/users (auth)
router.get("/", async (req, res) => {
  // Query params: ?username=albin = req.query.username

  try {
    const users = await User.find({}, {password: 0})
    res.status(200).json(users)
  } 
  catch {
    res.status(500).send()
  }
})

// POST api/users/register (auth role)
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
      password: passwordHash,
      role: req.body.role
    })

    try {
      const newUser = await user.save()

      const data = {
        username: newUser.username,
        email: newUser.email,
        role: newUser.role
      }

      res.status(201).json({ message: 'User created', data })
    }
    catch (err)
    {
      res.status(400).json({ message: err.message })
    }
    
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
    return res.status(404).json({ message: 'Login failed, wrong username or password' })
  }

  // Verify password
  try {
    if(await bcrypt.compare(req.body.password, user.password)) {
      jwtUser = { 
        _id: user._id,
        username: user.username, 
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }

      const token = jwt.sign(jwtUser, process.env.SECRET_TOKEN, { expiresIn: '30m' })
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
// PUT api/users/:id (auth + role)
// DELETE api/users/:id (auth + role)
router
  .route("/:id")
  .get((req, res) => {
    res.status(200).json(req.user)
  })
  .patch(auth.auth, (req, res) => {
    res.send(`Update user with id: ${req.params.id}`)
  })
  .delete(auth.auth, async (req, res) => {
    // If superadmin: delete any admin or user
    if(req.auth.role === "superadmin") {
      await removeUser(req, res)
    }
    // If admin: delete users only
    else if(req.auth.role === "admin") {
      if(req.auth._id === req.user._id.toString()) {
        await removeUser(req, res)
      }
      else {
        if(req.user.role === "user") {
          await removeUser(req, res)
        }
        else {
          res.status(403).json({ message: 'Access denied' })
        }
      }
    }
    // If user: delete your own account only
    else {
      if(req.auth._id === req.user._id.toString()) {
        await removeUser(req, res)
      }
      else {
        res.status(403).json({ message: 'Access denied' })
      }
    }
  })

// When id parameter is used: get a user from db
router.param("id", async (req, res, next, id) => {
  if(!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ message: 'User not found' })
  }

  let user
  try {
    user = await User.findById(req.params.id, {password: 0})
    if(user == null) {
      return res.status(404).json({ message: 'User not found' })
    }
  }
  catch (err) {
    return res.status(500).json({ message: err.message })
  }

  req.user = user
  next()
})

async function removeUser(req, res) {
  try {
    await req.user.remove()
    res.status(204).send()
  }
  catch (err) {
    return res.status(500).json({ message: err.message })
  }
}

module.exports = router