const mongoose=require("mongoose")
const uniqueValidator = require('mongoose-unique-validator')

const HttpSchema= mongoose.Schema({
 
request:{
  type:String,
  required:true,
  unique:true
}

})
HttpSchema.plugin(uniqueValidator)
module.exports=mongoose.model("Http",HttpSchema)