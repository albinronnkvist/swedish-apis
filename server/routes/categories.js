const express = require('express')
const router = express.Router()
const auth = require('../auth/auth')

const mongoose = require('mongoose')

// ******
// ROUTES
// ******

// GET api/categories
// POST api/categories (auth + admin)



// **************
// DYNAMIC ROUTES
// **************

// GET api/categories/:id
// PATCH api/categories/:id (auth + admin)
// DELETE api/categories/:id (auth + admin)



// **********
// MIDDLEWARE
// **********
// Get category from db when id parameter is used
