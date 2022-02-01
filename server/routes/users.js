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
  try {
    if(req.auth.role === "superadmin" || req.auth.role === "admin") {
      let users
      if(req.query.username || req.query.role) {
        if(!req.query.username) {
          users = await User.find({ role: req.query.role }, {password: 0}).sort({ username: 1 })
        }
        else if(!req.query.role) {
          users = await User.find({ username: { $regex: req.query.username } }, {password: 0}).sort({ username: 1, role: 1 })
        }
        else {
          users = await User.find({ username: { $regex: req.query.username }, role: req.query.role }, {password: 0}).sort({ username: 1, role: 1 })
        }
      }
      else {
        users = await User.find({}, {password: 0}).sort({ username: 1, role: 1 })
      }

      res.status(200).json({ users: users })
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
router.post("/register", auth.token, async (req, res) => {
  if(!req.body.password || (typeof req.body.password !== 'string')) {
    return res.status(400).json({ error: 'Password required' })
  }

  try {
    let role
    if(req.token != null && (req.token.role === "superadmin" || req.token.role === "admin")) {
      if(req.body.role === "superadmin") {
        if(req.token.role === "superadmin") {
          role = req.body.role
        } else {
          return res.status(403).json({ error: 'Access denied. You have to be a super admin to create another super admin.' })
        }
      } else {
        role = req.body.role
      }
    } else {
      role = "user"
    }

    const salt = await bcrypt.genSalt()
    const passwordHash = await bcrypt.hash(req.body.password, salt)

    const user = new User({
      username: req.body.username,
      email: req.body.email,
      password: passwordHash,
      role: role
    })    

    const newUser = await user.save()

    const userDto = {
      username: newUser.username,
      email: newUser.email,
      role: newUser.role
    }

    return res.status(201).json({ message: 'User created', user: userDto })
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
      claims = { 
        _id: user._id,
        username: user.username, 
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }

      const token = jwt.sign(claims, process.env.SECRET_TOKEN, { expiresIn: '30m' })
      return res.status(200).json({ token: token, message: 'Login successful' })
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
      res.status(200).json({ user: req.user })
    }
    else {
      if(req.auth._id === req.user._id.toString()) {
        res.status(200).json({ user: req.user })
      }
      else {
        res.status(403).json({ error: 'Access denied' })
      }
    }
  })
  .patch(auth.auth, (req, res) => {
    if(req.body.username) {
      req.user.username = req.body.username
    }
    if(req.body.email) {
      req.user.email = req.body.email
    }
    if(req.body.role) {
      req.user.role = req.body.role
    }

    try {
      const updatedUser = await req.user.save()
      res.status(204).send({ user: updatedUser })
    } 
    catch (err) {
      return res.status(400).json({ error: err.message })
    }
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



// **********
// MIDDLEWARE
// **********
// When an id parameter is used: get a user from db
router.param("id", async (req, res, next, id) => {
  if(!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: 'User not found' })
  }

  let user
  try {
    user = await User.findById(id, {password: 0})
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