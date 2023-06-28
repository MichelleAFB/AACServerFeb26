const mongoose=require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

const Event = new mongoose.Schema({
 
  act:{
    type:String,
    //required:true
  },
  date:{
    type:String,
    unique:true
   // required:true
  },
  time:{
    type:String,
   // required:true
  },
  httpId:{
    type:String,
    required:false
  },
  image:{
    type:String,
    default:""
  },
  occupied:{
    type:Number,
    default:0
  },
  access:{
    type:String,
    default:"private"
  }
})


//console.log(EventModel)

Event.plugin(uniqueValidator)

module.exports= mongoose.model('events',Event)