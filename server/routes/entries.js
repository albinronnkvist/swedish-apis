const express = require('express')
const router = express.Router()
const auth = require('../auth/auth')

const mongoose = require('mongoose')

// ******
// ROUTES
// ******

// GET api/entries
// GET api/entries/random
// POST api/entries (auth + admin)



// **************
// DYNAMIC ROUTES
// **************

// GET api/entries/:id
// PATCH api/entries/:id (auth + admin)
// DELETE api/entries/:id (auth + admin)



// **********
// MIDDLEWARE
// **********
// Get entry from db when id parameter is used
