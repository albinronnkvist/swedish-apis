const joi = require('@hapi/joi')

const postValidation = (data) => {
  const schema = joi.object({
    title: joi.string()
      .min(1)
      .max(50)
      .required()
  })

  return schema.validate(data, {abortEarly: false})
}

module.exports.postValidation = postValidation