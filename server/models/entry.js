const mongoose = require('mongoose')

const entrySchema = new mongoose.Schema({
  title: {
    type: String,
    minlength: [1, "Title too short, minimum 1 character"],
    maxlength: [100, "Title too long, maximum 100 characters"],
    required: [true, "Title required"]
  },
  description: {
    type: String,
    minlength: [1, "Description too short, minimum 1 character"],
    maxlength: [500, "Description too long, maximum 500 characters"],
    required: [true, "Description required"]
  },
  link: {
    type: String,
    required: [true, "Link required"]
  },
  category: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Category",
    required: false
  },
  createdAt: {
    type: Date,
    immutable: true,
    required: true,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    required: true,
    default: Date.now
  }
})

module.exports = mongoose.model('Entry', entrySchema)