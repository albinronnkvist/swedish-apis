const mongoose = require('mongoose')

const categorySchema = new mongoose.Schema({
  title: {
    type: String,
    minlength: [1, "Title too short, minimum 1 character"],
    maxlength: [50, "Title too long, maximum 50 characters"],
    unique: true,
    required: [true, "Title required"]
  }
})

categorySchema.statics.findAll = function() {
  return this.find({}, { __v: 0 }).sort({ title: 1 })
}

categorySchema.statics.findByTitle = function(title) {
  return this.find({ title: { $regex: title, $options: 'i' } }, {__v: 0}).sort({ title: 1 })
}

categorySchema.statics.findOneByTitle = function(title) {
  return this.findOne({ title: { $regex: title, $options: 'i' } })
}

module.exports = mongoose.model('Category', categorySchema)