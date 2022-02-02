const mongoose = require('mongoose')

const categorySchema = new mongoose.Schema({
  title: {
    type: String,
    minlength: [1, "Title too short, minimum 1 character"],
    maxlength: [100, "Title too long, maximum 100 characters"],
    required: [true, "Title required"]
  }
})

module.exports = mongoose.model('Category', categorySchema)