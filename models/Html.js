const mongoose=require("mongoose")
const uniqueValidator = require('mongoose-unique-validator')

const HtmlSchema=mongoose.Schema({
  request:{
    type:String,
    required:true
  }
,
html:{
  type:String,
  required:true,
  unique:true
}
})

HtmlSchema.plugin(uniqueValidator)

module.exports=mongoose.model("Html",HtmlSchema)