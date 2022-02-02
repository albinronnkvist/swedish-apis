require('dotenv').config()

const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const User = require('../models/user')
const auth = require('../auth/auth')

const mongoose = require('mongoose')
const userValidation = require('../validations/userValidations')



// **************
// COMMON METHODS
// **************
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
          users = await User.findByRole(req.query.role)
        }
        else if(!req.query.role) {
          users = await User.findByUsername(req.query.username)
        }
        else {
          users = await User.findByUsernameAndRole(req.query.username, req.query.role)
        }
      }
      else {
        users = await User.findAll()
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
  const { error } = userValidation.registerValidation(req.body)
  if(error) return res.status(400).json({ error: error.details[0].message })

  const usernameExist = await User.findOneByUsername(req.body.username)
  if(usernameExist) return res.status(409).json({ error: 'Username already exists' })

  const emailExist = await User.findOneByEmail(req.body.email)
  if(emailExist) return res.status(409).json({ error: 'Email already exists' })

  const role = await userValidation.registerRoleValidation(req)
  if(role === "deny") return res.status(403).json({ error: 'Access denied' })

  try {
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
    return res.status(400).json({ error: err.message })
  }
})

// POST api/users/login
router.post("/login", async (req, res) => {
  const { error } = userValidation.loginValidation(req.body)
  if(error) return res.status(400).json({ error: error.details[0].message })

  try {
    let user = await User.findOneByUsername(req.body.username)
    if(user == null) return res.status(404).json({ error: 'Login failed, wrong username or password' })

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
      return res.status(200).json({ user: req.user })
    }
    else {
      if(req.auth._id === req.user._id.toString()) {
        return res.status(200).json({ user: req.user })
      }
      else {
        return res.status(403).json({ error: 'Access denied' })
      }
    }
  })
  .patch(auth.auth, async (req, res) => {
    const { error } = userValidation.patchValidation(req.body)
    if(error) return res.status(400).json({ error: error.details[0].message })

    if(req.body.username) {
      if(req.body.username !== req.user.username) {
        const usernameExist = await User.findOneByUsername(req.body.username)
        if(usernameExist) {
          return res.status(409).json({ error: 'Username already exists' })
        }
        else {
          req.user.username = req.body.username
        }
      }
      else {
        req.user.username = req.body.username
      }
    }
    if(req.body.email) {
      if(req.body.email !== req.user.email) {
        const emailExist = await User.findOneByEmail(req.body.email)
        if(emailExist) {
          return res.status(409).json({ error: 'Email already exists' })
        }
        else {
          req.user.email = req.body.email
        }
      }
      else {
        req.user.email = req.body.email
      } 
    }

    let preRole = req.user.role
    if(req.body.role) {
      req.user.role = req.body.role
    }

    try {
      // If superadmin: edit yourself, other admins and other users. But not other superusers.
      if(req.auth.role === "superadmin") {
        if((preRole === "superadmin") && (req.auth._id !== req.user._id.toString())) {
          return res.status(403).json({ error: 'Access denied' })
        }
        else {
          req.user.updatedAt = Date.now()
          await req.user.save()
          return res.status(204).send()
        }
      }
      // If admin: edit yourself and others users
      else if(req.auth.role === "admin") {
        if(req.user.role === "superadmin") {
          return res.status(403).json({ error: 'Access denied' })
        }
        else if(preRole === "admin" && (req.auth._id !== req.user._id.toString())) {
          return res.status(403).json({ error: 'Access denied' })
        }
        else {
          req.user.updatedAt = Date.now()
          await req.user.save()
          return res.status(204).send()
        }
      }
      // If user: edit only yourself
      else {
        if((req.user.role === "superadmin") || (req.user.role === "admin") || (req.auth._id !== req.user._id.toString())) {
          return res.status(403).json({ error: 'Access denied' })
        }
        else {
          req.user.updatedAt = Date.now()
          await req.user.save()
          return res.status(204).send()
        }
      }
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
  .delete(auth.auth, async (req, res) => {
    // If superadmin: delete any admin or user, but not other superadmins.
    if(req.auth.role === "superadmin") {
      if(req.user.role === "superadmin" && (req.auth._id !== req.user._id.toString())) {
        return res.status(403).json({ error: 'Access denied' })
      }
      else {
        await removeUser(req, res)
      }
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
          return res.status(403).json({ error: 'Access denied' })
        }
      }
    }
    // If user: delete your own account only
    else {
      if(req.auth._id === req.user._id.toString()) {
        await removeUser(req, res)
      }
      else {
        return res.status(403).json({ error: 'Access denied' })
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