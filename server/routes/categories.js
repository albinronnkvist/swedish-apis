const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')

const auth = require('../auth/auth')
const Category = require('../models/category')
const categoryValidation = require('../validations/categoryValidation')

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

// POST api/categories (auth + superadmin/admin)
router.post("/", auth.authRequired, async (req, res) => {
  console.log(req.authUser.role)
  if(req.authUser.role !== "superadmin" && req.authUser.role !== "admin") return res.status(403).json({ error: 'Access denied' })
  
  const { error } = categoryValidation.postValidation(req.body)
  if(error) {
    let errors = error.details.map(e => e.message)
    return res.status(400).json({ error: errors })
  }

  try {
    const titleExist = await Category.findOneByTitle(req.body.title)
    if(titleExist) return res.status(409).json({ error: 'A category with the same title already exists' })

    const category = new Category({
      title: req.body.title
    })

    const newCategory = await category.save()

    return res.status(201).json({ message: 'Category created', category: newCategory })
  }
  catch(err) {
    return res.status(400).json({ error: err.message })
  }
})


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

module.exports = router