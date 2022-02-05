const joi = require('@hapi/joi')
joi.objectId = require('joi-objectid')(joi)

const postValidation = (data) => {
  const schema = joi.object({
    title: joi.string()
      .min(1)
      .max(100)
      .required(),
    description: joi.string()
      .min(1)
      .max(500)
      .required(),
    link: joi.string()
      .required(),
    category: joi.objectId()
  })

  return schema.validate(data, {abortEarly: false})
}

const patchValidation = (data) => {
  const schema = joi.object({
    title: joi.string()
      .min(1)
      .max(100),
    description: joi.string()
      .min(1)
      .max(500),
    link: joi.string(),
    category: joi.objectId()
  })

  return schema.validate(data, {abortEarly: false})
}

module.exports.postValidation = postValidation
module.exports.patchValidation = patchValidation