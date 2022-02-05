const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')

const auth = require('../auth/auth')
const Category = require('../models/category')

// ******
// ROUTES
// ******

// GET api/categories
router.get("/", async(req, res) => {
  try {
    const categories = await Category.findAll()
    return res.status(200).json({ categories: categories })
  }
  catch(err) {
    return res.status(500).send({ error: err })
  }
})
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
