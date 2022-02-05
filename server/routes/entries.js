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

        if(current == null) {
          ent.categoryName = "Other"
        }
        else {
          ent.categoryName = current.title
        }
      }
    }
    else {
      ent.categoryName = "Other"
    }
  }
}

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
router.get("/random", async (req, res) => {
  try {
    const entries = await Entry.findRandom()
    await addCategoryNames(entries)

    return res.status(200).json({ entry: entries })
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
      category: req.body.category
    })

    const savedEntry = await newEntry.save()

    const entry = savedEntry.toObject()

    await addCategoryNameSingleObj(entry)

    return res.status(201).json({ message: 'Entry created', entry: entry })
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