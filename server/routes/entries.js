const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')

const Entry = require('../models/entry')
const entryValidation = require('../validations/entryValidation')
const auth = require('../auth/auth')
const User = require('../models/user')
const Category = require('../models/category')
const categoryNames = require('../other/categoryNames')



// ******
// ROUTES
// ******
// GET api/entries
router.get("/", async (req, res) => {
  try {
    let limit
    if(req.query.limit) {
      limit = req.query.limit
    }
    else {
      limit = 20
    }

    let entries
    if(req.query.title) {
      entries = await Entry.findByTitle(req.query.title, limit)
    }
    else if(req.query.description) {
      entries = await Entry.findByDescription(req.query.description, limit)
    }
    else if(req.query.title && req.query.description) {
      entries = await Entry.findByTitleAndDescription(req.query.title, req.query.description, limit)
    }
    else {
      entries = await Entry.findAll(limit)
    }

    // Add categoryName property to objects
    let entriesWithCategory = await categoryNames.addCategoryNames(entries)

    // Filter by category
    if(req.query.category) {
      entriesWithCategory = entriesWithCategory.filter(ent => {
        return ent.categoryName.toLowerCase().includes(req.query.category.toLowerCase())
      })
    }

    return res.status(200).json({ entries: entriesWithCategory })
  }
  catch(err) {
    return res.status(500).send({ error: err })
  }
})

// GET api/entries/random
router.get("/random", async (req, res) => {
  try {
    const entry = await Entry.findRandom()
    let entryWithCategory = await categoryNames.addCategoryNames(entry)

    return res.status(200).json({ entry: entryWithCategory })
  }
  catch(err) {
    return res.status(500).send({ error: err })
  }
})

// POST api/entries (auth + superadmin/admin)
router.post("/", auth.authRequired, async (req, res) => {
  if(req.authUser.role !== "superadmin" && req.authUser.role !== "admin") return res.status(403).json({ error: 'Access denied' })

  const { error } = entryValidation.postValidation(req.body)
  if(error) {
    let errors = error.details.map(e => e.message)
    return res.status(400).json({ error: errors })
  }

  try {
    if(req.body.categoryId) {
      const category = await Category.findById(req.body.categoryId)
      if(category == null) {
        return res.status(400).json({ error: 'Category does not exist' })
      }
    }

    const user = await User.findById(req.authUser._id)
    if(user == null) {
      return res.status(400).json({ error: 'User does not exist' })
    }

    let suggestionValue
    if(req.body.suggestion) {
      suggestionValue = req.body.suggestion
    } else {
      suggestionValue = false
    }

    const newEntry = new Entry({
      title: req.body.title,
      description: req.body.description,
      link: req.body.link,
      categoryId: req.body.categoryId,
      userId: req.authUser._id,
      suggestion: suggestionValue
    })

    const savedEntry = await newEntry.save()

    const entry = savedEntry.toObject()

    let entryWithCategory = await categoryNames.addCategoryNameSingleObj(entry)

    return res.status(201).json({ message: 'Entry created', entry: entryWithCategory })
  }
  catch (err) {
    return res.status(400).json({ error: err.message })
  }
})



// **************
// DYNAMIC ROUTES
// **************

// GET api/entries/:id
// PATCH api/entries/:id (auth + superadmin/admin)
// DELETE api/entries/:id (auth + superadmin/admin)
router
  .route("/:id")
  .get(async (req, res) => {
    let entry = req.entry.toObject()
    let entryWithCategory = await categoryNames.addCategoryNameSingleObj(entry)

    return res.status(200).json({ entry: entryWithCategory })
  })
  .patch(auth.authRequired, async (req, res) => {
    if(req.authUser.role !== "superadmin" && req.authUser.role !== "admin") return res.status(403).json({ error: 'Access denied' })

    const { error } = entryValidation.patchValidation(req.body)
    if(error) {
      let errors = error.details.map(e => e.message)
      return res.status(400).json({ error: errors })
    }

    if(req.body.title) {
      req.entry.title = req.body.title
    }

    if(req.body.description) {
      req.entry.description = req.body.description
    }

    if(req.body.link) {
      req.entry.link = req.body.link
    }

    if(req.body.categoryId) {
      const category = await Category.findById(req.body.categoryId)
      if(category == null) {
        return res.status(400).json({ error: 'Category does not exist' })
      }
      req.entry.categoryId = req.body.categoryId
    }

    if(req.body.suggestion) {
      req.entry.suggestion = req.body.suggestion
    }

    try {
      req.entry.updatedAt = Date.now()
      await req.entry.save()
      return res.status(204).send()
    }
    catch(err) {
      return res.status(400).json({ error: err.message })
    }
  })
  .delete(auth.authRequired, async (req, res) => {
    if(req.authUser.role !== "superadmin" && req.authUser.role !== "admin") return res.status(403).json({ error: 'Access denied' })

    try {
      await req.entry.remove()
      res.status(204).send()
    }
    catch (err) {
      return res.status(500).json({ error: err.message })
    }
  })



// **********
// MIDDLEWARE
// **********
// Get entry from db when id parameter is used
router.param("id", async (req, res, next, id) => {
  if(!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: 'Entry not found' })
  }

  let entry
  try {
    entry = await Entry.findById(id, {__v: 0})
    if(entry == null) {
      return res.status(404).json({ error: 'Entry not found' })
    }
  }
  catch (err) {
    return res.status(500).json({ error: err.message })
  }

  req.entry = entry
  next()
})

module.exports = router