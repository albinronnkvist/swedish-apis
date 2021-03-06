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
  categoryId: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Category",
    required: false
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User",
    required: [true, "User ID required"]
  },
  suggestion: {
    type: Boolean,
    required: false,
    default: true
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

entrySchema.statics.findAll = function(limit) {
  return this.find({ suggestion: {$ne: true} }, { __v: 0 }).lean().sort({ title: 1, description: 1 }).limit(limit)
}

entrySchema.statics.findAllSuggestions = function() {
  return this.find({ suggestion: true }, { __v: 0 }).lean().sort({ createdAt: 1, title: 1 })
}

entrySchema.statics.findByTitle = function(title, limit) {
  return this.find({ title: { $regex: title, $options: 'i' } }, {__v: 0})
    .lean()
    .sort({ title: 1, description: 1 })
    .limit(limit)
}

entrySchema.statics.findByDescription = function(description, limit) {
  return this.find({ description: { $regex: description, $options: 'i' } }, {__v: 0})
  .lean()
  .sort({ title: 1, description: 1 })
  .limit(limit)
}

entrySchema.statics.findByTitleAndDescription = function(title, description, limit) {
  return this.find(
      { 
        title: { $regex: title, $options: 'i' },
        description: { $regex: description, $options: 'i' } 
      }, 
      {__v: 0}
    )
    .lean()
    .sort({ title: 1, description: 1 })
    .limit(limit)
}

entrySchema.statics.findRandom = function() {
  return this.aggregate([{ $sample: { size: 1 } }])
};

module.exports = mongoose.model('Entry', entrySchema)