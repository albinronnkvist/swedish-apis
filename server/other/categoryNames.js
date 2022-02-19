const mongoose = require('mongoose')
const Category = require('../models/category')

const addCategoryNames = async function(entries) {
  let entriesWithCategory = entries

  for (let ent of entriesWithCategory) {
    if(ent.categoryId !== undefined) {
      if(!mongoose.Types.ObjectId.isValid(ent.categoryId)) {
        ent.categoryName = "Other"
      }
      else {
        let current = await Category.findById(ent.categoryId)

        if(current == null) {
          ent.categoryName = "Other"
        }
        else {
          ent.categoryName = current.title
        }
      }
    }
    else {
      ent.categoryName = "Other"
    }
  }

  return entriesWithCategory
}

const addCategoryNameSingleObj = async (entry) => {
  let entryWithCategory = entry

  if(entryWithCategory.categoryId !== undefined) {
    if(!mongoose.Types.ObjectId.isValid(entryWithCategory.categoryId)) {
      entryWithCategory.categoryName = "Other"
    }
    else {
      let current = await Category.findById(entryWithCategory.categoryId)

      if(current == null) {
        entryWithCategory.categoryName = "Other"
      }
      else {
        entryWithCategory.categoryName = current.title
      }
    }
  }
  else {
    entryWithCategory.categoryName = "Other"
  }

  return entryWithCategory
}

module.exports.addCategoryNames = addCategoryNames
module.exports.addCategoryNameSingleObj = addCategoryNameSingleObj