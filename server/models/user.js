const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    set: toLower
  },
  email: {
    type: String,
    required: true,
    set: toLower
  },
  password: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now
  }
})

function toLower (str) {
  return str.toLowerCase();
}

module.exports = mongoose.model('User', userSchema)