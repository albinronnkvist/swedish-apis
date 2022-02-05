const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')

const Entry = require('../models/entry')
const entryValidation = require('../validations/entryValidation')
const auth = require('../auth/auth')



// ******
// ROUTES
// ******
// GET api/entries
router.get("/", (req, res) => {
  return res.status(200).send()
})

// GET api/entries/random
// POST api/entries (auth + superadmin/admin)



// **************
// DYNAMIC ROUTES
// **************

// GET api/entries/:id
// PATCH api/entries/:id (auth + superadmin/admin)
// DELETE api/entries/:id (auth + superadmin/admin)



// **********
// MIDDLEWARE
// **********
// Get entry from db when id parameter is used

// Get category from db

module.exports = router