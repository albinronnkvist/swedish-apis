const mongoose = require('mongoose')
const validator = require('validator')

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    minlength: [1, "Username too short, minimum 1 character"],
    maxlength: [30, "Username too long, maximum 30 characters"],
    trim: true,
    lowercase: true,
    unique: true,
    required: [true, "Username required"]
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    unique: true,
    validate: [ validator.isEmail, 'Invalid email' ],
    required: [true, "Email required"]
  },
  password: {
    type: String,
    minlength: [8, "Password too short, minimum 1 character"],
    required: [true, "Password required"]
  },
  role: {
    type: String,
    enum: {
      values: ['superadmin', 'admin', 'user'],
      message: '{VALUE} is not supported'
    },
    lowercase: true,
    required: false,
    default: "user"
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

userSchema.statics.findAll = function() {
  return this.find({}, {password: 0}).sort({ username: 1, role: 1 })
}

userSchema.statics.findOneByUsername = function(username) {
  return this.findOne({ username: username.toLowerCase() })
}

userSchema.statics.findOneByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() })
}

userSchema.statics.findByUsername = function(username) {
  return this.find({ username: { $regex: username } }, {password: 0}).sort({ username: 1, role: 1 })
}

userSchema.statics.findByRole = function(role) {
  return this.find({ role: role }, {password: 0}).sort({ username: 1 })
}

userSchema.statics.findByUsernameAndRole = function(username, role) {
  return this.find({ username: { $regex: username }, role: role }, {password: 0}).sort({ username: 1, role: 1 })
}

module.exports = mongoose.model('User', userSchema)