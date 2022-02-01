const mongoose = require('mongoose')
const validator = require('validator')

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    minLength: [1, "Username too short, minimum 1 character"],
    maxLength: [30, "Username too long, maximum 30 characters"],
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
    minLength: [8, "Password too short, minimum 1 character"],
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

module.exports = mongoose.model('User', userSchema)