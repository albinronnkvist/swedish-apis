require('dotenv').config()

const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const User = require('../models/user')
const auth = require('../auth/auth')

const mongoose = require('mongoose')

async function removeUser(req, res) {
  try {
    await req.user.remove()
    res.status(204).send()
  }
  catch (err) {
    return res.status(500).json({ error: err.message })
  }
}



// ******
// ROUTES
// ******

// GET api/users
router.get("/", auth.auth, async (req, res) => {
  // Query params: ?username=albin = req.query.username

  try {
    if(req.auth.role === "superadmin" || req.auth.role === "admin") {
      const users = await User.find({}, {password: 0})
      res.status(200).json({ data: users })
    }
    else {
      res.status(403).json({ error: 'Access denied' })
    }
  } 
  catch {
    res.status(500).send()
  }
})

// POST api/users/register
router.post("/register", async (req, res) => {
  try {
    if(!req.body.password || (typeof req.body.password !== 'string')) {
      return res.status(400).json({ error: 'Password required' })
    }
    const salt = await bcrypt.genSalt()
    const passwordHash = await bcrypt.hash(req.body.password, salt)

    const user = new User({
      username: req.body.username,
      email: req.body.email,
      password: passwordHash,
      role: req.body.role
    })    

    const newUser = await user.save()

    const data = {
      username: newUser.username,
      email: newUser.email,
      role: newUser.role
    }

    return res.status(201).json({ message: 'User created', data: data })
  }
  catch (err) {
    if(err.code === 11000) {
      return res.status(400).json({ error: 'Username or Email already exists' })
    }
    else {
      return res.status(400).json({ error: err.message })
    }
  }
})

// POST api/users/login
router.post("/login", async (req, res) => {
  try {
    if(!req.body.username || (typeof req.body.username !== 'string')) {
      return res.status(400).json({ error: 'Username required' })
    }
    if(!req.body.password || (typeof req.body.password !== 'string')) {
      return res.status(400).json({ error: 'Password required' })
    }

    let user = await User.findOne({ username: req.body.username.toLowerCase() })
    if(user == null) {
      return res.status(404).json({ error: 'Login failed, wrong username or password' })
    }

    // Verify password, create and send token
    if(await bcrypt.compare(req.body.password, user.password)) {
      jwtUser = { 
        _id: user._id,
        username: user.username, 
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }

      const token = jwt.sign(jwtUser, process.env.SECRET_TOKEN, { expiresIn: '30m' })
      return res.status(200).json({ jwt: token, message: 'Login successful' })
    } 
    else {
      return res.status(401).json({ error: 'Login failed, wrong username or password' })
    }
  }
  catch (err) {
    return res.status(400).json({ error: err.message })
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
  .get(auth.auth, (req, res) => {
    if(req.auth.role === "superadmin" || req.auth.role === "admin") {
      res.status(200).json({ data: req.user })
    }
    else {
      if(req.auth._id === req.user._id.toString()) {
        res.status(200).json({ data: req.user })
      }
      else {
        res.status(403).json({ error: 'Access denied' })
      }
    }
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
          res.status(403).json({ error: 'Access denied' })
        }
      }
    }
    // If user: delete your own account only
    else {
      if(req.auth._id === req.user._id.toString()) {
        await removeUser(req, res)
      }
      else {
        res.status(403).json({ error: 'Access denied' })
      }
    }
  })

// When id parameter is used: get a user from db
router.param("id", async (req, res, next, id) => {
  if(!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ error: 'User not found' })
  }

  let user
  try {
    user = await User.findById(req.params.id, {password: 0})
    if(user == null) {
      return res.status(404).json({ error: 'User not found' })
    }
  }
  catch (err) {
    return res.status(500).json({ error: err.message })
  }

  req.user = user
  next()
})

module.exports = router