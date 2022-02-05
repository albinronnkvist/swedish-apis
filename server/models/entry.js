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

entrySchema.statics.findAll = function() {
  return this.find({}, { __v: 0 }).sort({ title: 1, description: 1 })
}

entrySchema.statics.findByTitle = function(title) {
  return this.find({ title: { $regex: title, $options: 'i' } }, {__v: 0}).sort({ title: 1, description: 1 })
}

entrySchema.statics.findByDescription = function(description) {
  return this.find({ description: { $regex: description, $options: 'i' } }, {__v: 0}).sort({ title: 1, description: 1 })
}

entrySchema.statics.findByTitleAndDescription = function(title, description) {
  return this.find(
      { 
        title: { $regex: title, $options: 'i' },
        description: { $regex: description, $options: 'i' } 
      }, 
      {__v: 0}
    )
    .sort({ title: 1, description: 1 })
}

module.exports = mongoose.model('Entry', entrySchema)