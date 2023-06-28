const mongoose=require("mongoose")

const UserSchema= mongoose.Schema({
 
  firstname:{
    type:String,
    required:true
  },
  lastname:{
    type:String,
   required:true
  },
  email:{
    type:String,
   required:true
  },
  salt:{
    type:String,
    required:true
  },
  admin:{
    type:Number,
    default:0
  }

})

module.exports=mongoose.model("User",UserSchema)