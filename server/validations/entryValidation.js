const joi = require('@hapi/joi')

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
      .required()
  })

  return schema.validate(data, {abortEarly: false})
}

module.exports.postValidation = postValidation