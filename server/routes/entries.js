const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')

const Entry = require('../models/entry')
const entryValidation = require('../validations/entryValidation')
const auth = require('../auth/auth')
const Category = require('../models/category')



// **************
// COMMON METHODS
// **************
async function addCategoryNames(entries) {
  for (let ent of entries) {
    if(ent.category !== undefined) {
      if(!mongoose.Types.ObjectId.isValid(ent.category)) {
        ent.categoryName = "Other"
      }
      else {
        let current = await Category.findById(ent.category)
        ent.categoryName = current.title
      }
    }
    else {
      ent.categoryName = "Other"
    }
  }
}



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
    await addCategoryNames(entries)

    // Filter by category
    if(req.query.category) {
      entries = entries.filter(ent => {
        return ent.categoryName.toLowerCase().includes(req.query.category.toLowerCase())
      })
    }

    return res.status(200).json({ entries: entries })
  }
  catch(err) {
    return res.status(500).send({ error: err })
  }
})

// GET api/entries/random

// POST api/entries (auth + superadmin/admin)
router.post("/", auth.authRequired, async (req, res) => {
  if(req.authUser.role !== "superadmin" && req.authUser.role !== "admin") return res.status(403).json({ error: 'Access denied' })

  const { error } = entryValidation.postValidation(req.body)
  if(error) {
    let errors = error.details.map(e => e.message)
    return res.status(400).json({ error: errors })
  }

  try {
    const entry = new Entry({
      title: req.body.title,
      description: req.body.description,
      link: req.body.link,
      category: req.body.category
    })

    const newEntry = await entry.save()

    return res.status(201).json({ message: 'entry created', entry: newEntry })
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



// **********
// MIDDLEWARE
// **********
// Get entry from db when id parameter is used

module.exports = router