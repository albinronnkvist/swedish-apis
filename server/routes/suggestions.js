const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')

const Entry = require('../models/entry')
const entryValidation = require('../validations/entryValidation')
const auth = require('../auth/auth')
const Category = require('../models/category')

async function addCategoryNameSingleObj(entry) {
  if(entry.category !== undefined) {
    if(!mongoose.Types.ObjectId.isValid(entry.category)) {
      entry.categoryName = "Other"
    }
    else {
      let current = await Category.findById(entry.category)

      if(current == null) {
        entry.categoryName = "Other"
      }
      else {
        entry.categoryName = current.title
      }
    }
  }
  else {
    entry.categoryName = "Other"
  }
}

// GET api/suggestions
router.get("/", async (req, res) => {
  try {
    let entries = await Entry.findAllSuggestions()

    return res.status(200).json({ suggestions: entries })
  }
  catch(err) {
    return res.status(500).send({ error: err })
  }
})

// POST api/suggestions (auth)
router.post("/", auth.authRequired, async (req, res) => {

  const { error } = entryValidation.postValidation(req.body)
  if(error) {
    let errors = error.details.map(e => e.message)
    return res.status(400).json({ error: errors })
  }

  try {
    if(req.body.category) {
      const category = await Category.findById(req.body.category)
      if(category == null) {
        return res.status(400).json({ error: 'Category does not exist' })
      }
    }

    const newEntry = new Entry({
      title: req.body.title,
      description: req.body.description,
      link: req.body.link,
      category: req.body.category,
      suggestion: true
    })

    const savedEntry = await newEntry.save()

    const entry = savedEntry.toObject()

    await addCategoryNameSingleObj(entry)

    return res.status(201).json({ message: 'Suggestion created', suggestion: entry })
  }
  catch (err) {
    return res.status(400).json({ error: err.message })
  }
})

router
  .route("/:id")
  .get(async (req, res) => {
    let entry = req.entry.toObject()
    await addCategoryNameSingleObj(entry)

    return res.status(200).json({ entry: entry })
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

    if(req.body.category) {
      const category = await Category.findById(req.body.category)
      if(category == null) {
        return res.status(400).json({ error: 'Category does not exist' })
      }
      req.entry.category = req.body.category
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
    return res.status(404).json({ error: 'Suggestion not found' })
  }

  let suggestion
  try {
    suggestion = await Entry.findById(id, {__v: 0})
    if(suggestion == null) {
      return res.status(404).json({ error: 'Suggestion not found' })
    }
  }
  catch (err) {
    return res.status(500).json({ error: err.message })
  }

  req.suggestion = suggestion
  next()
})

module.exports = router