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
    required: [true, "Password required"]
  },
  role: {
    type: String,
    enum: {
      values: ['superadmin', 'admin', 'user'],
      message: '{VALUE} is not supported'
    },
    lowercase: true,
    required: [true, "Role required"]
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now
  }
})

module.exports = mongoose.model('User', userSchema)