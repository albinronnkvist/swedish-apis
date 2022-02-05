require('dotenv').config()

const bcrypt = require('bcrypt')

module.exports.saltAndHash = async (password) => {
  const salt = await bcrypt.genSalt()
  const passwordHash = await bcrypt.hash(password, salt)

  return passwordHash
}

module.exports.verifyPassword = async (inputPassword, databasePassword) => {
  return await bcrypt.compare(inputPassword, databasePassword)
}