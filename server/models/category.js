const mongoose = require('mongoose')

const categorySchema = new mongoose.Schema({
  title: {
    type: String,
    minlength: [1, "Title too short, minimum 1 character"],
    maxlength: [50, "Title too long, maximum 50 characters"],
    required: [true, "Title required"]
  }
})

categorySchema.statics.findAll = function() {
  return this.find().sort({ title: 1 })
}

module.exports = mongoose.model('Category', categorySchema)