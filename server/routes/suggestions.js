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
// GET api/suggestions (auth)
router.get("/", auth.authRequired, async (req, res) => {
  try {
    let suggestions = await Entry.findAllSuggestions()

    let suggestionsWithCategory = await categoryNames.addCategoryNames(suggestions)

    return res.status(200).json({ suggestions: suggestionsWithCategory })
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

    const newEntry = new Entry({
      title: req.body.title,
      description: req.body.description,
      link: req.body.link,
      categoryId: req.body.categoryId,
      userId: req.authUser._id,
      suggestion: true
    })

    const savedEntry = await newEntry.save()

    const suggestion = savedEntry.toObject()

    let suggestionWithCategory = await categoryNames.addCategoryNameSingleObj(suggestion)

    return res.status(201).json({ message: 'Suggestion created', suggestion: suggestionWithCategory })
  }
  catch (err) {
    return res.status(400).json({ error: err.message })
  }
})

router
  .route("/:id")
  .get(auth.authRequired, async (req, res) => {
    let suggestion = req.suggestion.toObject()
    let suggestionWithCategory = await addCategoryNameSingleObj(suggestion)

    return res.status(200).json({ suggestion: suggestionWithCategory })
  })
  .patch(auth.authRequired, async (req, res) => {
    if(req.authUser._id !== req.suggestion.userId.toString()) return res.status(403).json({ error: 'Access denied' })

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
      if(req.authUser.role !== "superadmin" && req.authUser.role !== "admin") return res.status(403).json({ error: 'Access denied' })

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