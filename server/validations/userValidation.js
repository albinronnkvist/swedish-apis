const joi = require('@hapi/joi')

const registerValidation = (data) => {
  const schema = joi.object({
    username: joi.string()
      .min(1)
      .max(30)
      .required(),
    email: joi.string()
      .email()
      .required(),
    password: joi.string()
      .min(8)
      .required(),
    role: joi.string()
      .valid('superadmin', 'admin', 'user')
  })

  return schema.validate(data, {abortEarly: false})
}

const registerRoleValidation = (req) => {
  if(req.authUser != null && (req.authUser.role === "superadmin" || req.authUser.role === "admin")) {
    if(req.body.role === "superadmin") {
      if(req.authUser.role === "superadmin") {
        return req.body.role
      } else {
        return "deny"
      }
    } else {
      return req.body.role
    }
  } else {
    return "user"
  }
}

const loginValidation = (data) => {
  const schema = joi.object({
    username: joi.string()
      .min(1)
      .max(30)
      .required(),
    password: joi.string()
      // .min(8)
      .required()
  })

  return schema.validate(data, {abortEarly: false})
}

const patchValidation = (data) => {
  const schema = joi.object({
    username: joi.string()
      .min(1)
      .max(30),
    email: joi.string()
      .email(),
    role: joi.string()
      .valid('superadmin', 'admin', 'user')
  })

  return schema.validate(data, {abortEarly: false})
}

module.exports.registerValidation = registerValidation
module.exports.registerRoleValidation = registerRoleValidation
module.exports.loginValidation = loginValidation
module.exports.patchValidation = patchValidation