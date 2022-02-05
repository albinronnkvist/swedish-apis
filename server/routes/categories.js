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
    let categories
    if(req.query.title) {
      categories = await Category.findByTitle(req.query.title)
    }
    else {
      categories = await Category.findAll()
    }

    return res.status(200).json({ categories: categories })
  }
  catch(err) {
    return res.status(500).send({ error: err })
  }
})

// POST api/categories (auth + superadmin/admin)
router.post("/", auth.authRequired, async (req, res) => {
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
    if(err.code === 11000) {
      return res.status(409).json({ error: 'A category with the same title already exists' })
    }
    return res.status(400).json({ error: err.message })
  }
})


// **************
// DYNAMIC ROUTES
// **************

// GET api/categories/:id
// PATCH api/categories/:id (auth + admin)
// DELETE api/categories/:id (auth + admin)
router
  .route("/:id")
  .get((req, res) => {
    return res.status(200).json({ category: req.category })
  })
  .patch(auth.authRequired, async (req, res) => {
    if(req.authUser.role !== "superadmin" && req.authUser.role !== "admin") return res.status(403).json({ error: 'Access denied' })

    const { error } = categoryValidation.patchValidation(req.body)
    if(error) {
      let errors = error.details.map(e => e.message)
      return res.status(400).json({ error: errors })
    }

    if(req.body.title) {
      if(req.body.title !== req.category.title) {
        const titleExist = await Category.findOneByTitle(req.body.title)
        if(titleExist) {
          return res.status(409).json({ error: 'A category with the same title already exists' })
        }
        else {
          req.category.title = req.body.title
        }
      }
      else {
        req.category.title = req.body.title
      }
    }

    try {
      await req.category.save()
      return res.status(204).send()
    }
    catch(err) {
      if(err.code === 11000) {
        return res.status(409).json({ error: 'A category with the same title already exists' })
      }
      return res.status(400).json({ error: err.message })
    }
  })
  .delete(auth.authRequired, async (req, res) => {
    if(req.authUser.role !== "superadmin" && req.authUser.role !== "admin") return res.status(403).json({ error: 'Access denied' })

    try {
      await req.category.remove()
      res.status(204).send()
    }
    catch (err) {
      return res.status(500).json({ error: err.message })
    }
  })



// **********
// MIDDLEWARE
// **********
// Get category from db when id parameter is used
router.param("id", async (req, res, next, id) => {
  if(!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: 'Category not found' })
  }

  let category
  try {
    category = await Category.findById(id, {__v: 0})
    if(category == null) {
      return res.status(404).json({ error: 'Category not found' })
    }
  }
  catch (err) {
    return res.status(500).json({ error: err.message })
  }

  req.category = category
  next()
})

module.exports = router