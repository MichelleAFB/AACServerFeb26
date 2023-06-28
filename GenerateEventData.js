const express = require("express");
const router = express.Router();
const cookie = require("universal-cookie");
const bcrypt = require("bcrypt");
const db = require("./config/db");
const cors = require("cors");
const swaggerUI = require("swagger-ui-express");
const swaggerJsDoc = require("swagger-jsdoc");
const puppeteer = require("puppeteer");
const mongoose = require("mongoose");
const cheerio = require("cheerio");
const axios = require("axios");
//models
const Http = require("./models/Http");
const Html = require("./models/Html");
const Event = require("./models/Event");

const connectdb = async () => {
  try {
    console.log("hello");
    const conn = await mongoose.connect(
      "mongodb+srv://MAB190011:Mirchoella22@atlascluster.xdodz.mongodb.net/aacdb?retryWrites=true&w=majority",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    return conn;
    console.log(`MONGO DB connected: ${conn.connection.host}`);
  } catch (err) {
    //console.log(err.stack);
    // process.exit(1)
  }
};
var dbmongo;
connectdb().then((conn) => {
  //console.log(conn)
  dbmongo = conn.connection;
});

router.get("/", (req, res) => {
  res.json({ success: "Welcome to AAC Suite" });

});

router.get("/getHtmlfromHttp", async(req, res) => {
  const pop=await getHtmlfromRequests()
});

router.get("/parseEventsFromHtmlFinal", (req, res) => {
  parseEventsFromHtmlFinal();
});



router.post("/create-event",async(req,res)=>{

  const event=req.body.event

  const prom=new Promise(async(resolve,reject)=>{
    try{
      const eventnew =new Event({
        act:event.act,
        date:event.date,
        time:event.time,
        httpId:event.httpId
    
      })
    
      const saved=await eventnew.save()
      res.json(saved)
      return saved
    }catch(err){
      console.log(err)
      reject()
      return err
    }

  })
  prom.then((saved)=>{
    console.log("success")
    console.log(saved)
    
  }).catch((err)=>{
    console.log("fail")
    console.log(err)

  })


})



/*************************************************************************************************** */
router.get("/getHttpEventsFinal", (req, res) => {
  (async () => {
    const browser = await puppeteer.launch({
      headless: true,
      defaultViewport: false,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    console.log("grabbing all httprequest from browser");
    const page = await browser.newPage();
    await page.goto("https://www.americanairlinescenter.com/events");
    // await page.click("#loadMoreEvents")

    let count = 0;
    const responseArray = [];
    try {
      while (count < 20) {
        const button = await page.waitForSelector(
          "button#loadMoreEvents:not([disabled])"
        );
        if (button) {
          console.log("button exist");
          await page.click("#loadMoreEvents");
          page.on("response", async (response) => {
            await response.url();
            if (
              response
                .url()
                .includes(
                  "https://www.americanairlinescenter.com/events/events_ajax/"
                ) &&
              !responseArray.includes(response.url())
            ) {
              console.log(!responseArray.includes(response.url()));
              console.log(response.url());
              let responseUrl = response.url();
              let mid = response.url().toString();
              const url = mid;
              console.log(mid);
              console.log("h");
              console.log(url.replace(/[^0-9]/g, ""));
              const id = parseInt(url.replace(/[^0-9]/g, ""));

              const http = new Http({
                request: mid,
              });
              try{
              const saved = await http.save();
              console.log(saved);
              }catch(err){
                console.log(err)
              }

              responseArray[count] = response.url();
              if (count == 14) {
                res.json(responseArray);
              }
            }
          });
        }
        count++;
        console.log(responseArray);
      }
    } catch (err) {
      console.log(err);
    }

    console.log("reponsearray");
    if (count == 19) {
      res.json(responseArray);
    }
  })();
});

router.get("/getHttpEventsById/:id",async(req,res)=>{
  if(req.params.id!=null){
  axios.get("https://www.americanairlinescenter.com/events/events_ajax/"+req.params.id).then(async(response)=>{
   

   console.log(response.data)
    const http=new Http({
      request:"https://www.americanairlinescenter.com/events/events_ajax/"+req.params.id
    })
    const add=await http.save()
    console.log(add)
    res.json(response.data)
    
  })
}else{
  axios.get("https://www.americanairlinescenter.com/events/events_ajax/").then(async(response)=>{
   

  console.log(response.data)
   const http=new Http({
     request:"https://www.americanairlinescenter.com/events/events_ajax/"
   })
   const add=await http.save()
   console.log(add)
   
 })

}
})





async function getHtmlfromRequests() {
  console.log("****getting html from request**");
  const prom=new Promise(async(resolve,reject)=>{
    try{
      const https = await Http.find({});
    
      let count = 0;
    
      while (count < https.length) {
        const r = https[count].request;
        console.log(r);
        axios.get(r.toString()).then(async (response) => {
          if(response!=null){
          console.log("\n\n\n\n\n");
         
          console.log("RESPPONSE");
          console.log(typeof(response.data))
          const html = response.data;
          console.log("\n\n\n\n\n");
          if(html!=null){
          try {
            const htmlstring = new Html({
              request: r.toString(),
              html: html.toString(),
            });
    
           const saved = await htmlstring.save();
          
           console.log(saved)
          }catch (err){
            console.log(err);
          }
        }
        }
        }).catch((err)=>{
          console.log(err)
        })
        count++;
     
      }
    }catch(err){
      console.log(err)
      reject()
    }

  })

  prom.then(()=>{
    console.log("resolve")
  }).catch((err)=>{
    console.log(err)
  })



  console.log("********COMPLETE***********");
}

router.get("/event",async(req,res)=>{
  const events=await Event.find({})
  res.json({no_events:events.length,events:events})
})
router.get("/remove",async(req,res)=>{
  const del=await Html.remove({})
  console.log(del)
})


router.get("/parse-differently",(req,res)=>{
  const prom=new Promise(async(resolve,reject)=>{

    const htmls = await Html.find({});
    console.log("asc");
    //console.log(results)
  
    let count = 0;
    let size = htmls.length;
    while (count < size) {
      //console.log(results[count].id)
      let html = htmls[count].html;
  
      const $ = cheerio.load(html);
  
      $('div[class="info clearfix"]').each(async function (count) {
        if ($(this).text() != "Info" || $(this).text().length === 3) {
          const s = $(this).find('div [class="date"]').text();
          const date=s
          const result = s.trim().split(/\s+/);
          const fields = [];
          let img = $(this).prev().children().html();
          //console.log(img)
          let imglength = img.length - 7;
          let $img = img.substring(14, imglength);
          //console.log($img)
          result.img = $img;
  
          const act = $(this).find("h3").text();
          var obj = {
            date: result[0] + ' ' + result[1] + ' ' + result[2],
            time: result[4],
            act: act,
            image: result.img,
          };
          time=result[4]
         
          var end=obj.date.substring(obj.date.length-1,obj.date.length)
          
          if(end=='-'){
            //console.log(date)
            var last=date.split("-")
            var first=last[0]
            first=first.split(" ")
           
            first=first[1]
            var year=last[1]
         
            year=year.split(",")
            year=year[1]
            year=year.replace(/\s/g,"")
           
          
            last=last[1]
            console.log("year:"+last)
            last= last.split(",")
            last=last[0]
            console.log("first:"+first)
            console.log("last:"+last)
           
            first=first.replace(/\s/g,'')
            last=last.replace(/\s/g,'')

            var start=parseInt(first)
            var end=parseInt(last)
            

            while(start<=end){
               obj = {
                date: result[0] + ' ' + start + ', ' + year,
                time: time,
                act: act,
                image: result.img,
              };
              
              //console.log("here:"+result[0]+' '+start+', '+year )
              const event=new Event({
                act:obj.act,
                time:obj.time,
                date:obj.date
              })
              console.log(obj)
              const saved=await event.save()
              start++
             
            }
          }else{
  
          //let httpId = htmls[count].id;
          //console.log(httpId)
          var events = await Event.find({});
         
          //check that the event doesnt already exist
        
        
         
         
            var request=htmls[count]
          if(request!=null){
         
          request=request.request
         const prom1=new Promise(async(resolve1,reject1)=>{
            try{
          const event=new Event({
            act:obj.act,
            date:obj.date,
            time:obj.time,
            
          })
  
         // const saved=await event.save()
         // console.log(saved)
        }catch(err){
          reject()
        }

         })

         prom1.then(()=>{

         }).catch((err)=>{
          console.log(err)
         })
        
         
          }
        }
        
       


  
        }
      });
      count++;
    }
  

  })

  prom.then(()=>{

  }).catch((err)=>{
    console.log(err)
  })
})
async function parseEventsFromHtmlFinal() {

  const prom=new Promise(async(resolve,reject)=>{

    const htmls = await Html.find({});
    console.log("asc");
    //console.log(results)
  
    let count = 0;
    let size = htmls.length;
    while (count < size) {
      //console.log(results[count].id)
      let html = htmls[count].html;
  
      const $ = cheerio.load(html);
  
      $('div[class="info clearfix"]').each(async function (count) {
        if ($(this).text() != "Info" || $(this).text().length === 3) {
          const s = $(this).find('div [class="date"]').text();
          const date=s
          const result = s.trim().split(/\s+/);
          const fields = [];
          let img = $(this).prev().children().html();
          //console.log(img)
          let imglength = img.length - 7;
          let $img = img.substring(14, imglength);
          //console.log($img)
          result.img = $img;
  
          const act = $(this).find("h3").text();
          var obj = {
            date: result[0] + ' ' + result[1] + ' ' + result[2],
            time: result[4],
            act: act,
            image: result.img,
          };
          time=result[4]
         
          var end=obj.date.substring(obj.date.length-1,obj.date.length)
          
          if(end=='-'){
            //console.log(date)
            var last=date.split("-")
            var first=last[0]
            first=first.split(" ")
           
            first=first[1]
            var year=last[1]
         
            year=year.split(",")
            year=year[1]
            year=year.replace(/\s/g,"")
           
          
            last=last[1]
            console.log("year:"+last)
            last= last.split(",")
            last=last[0]
            console.log("first:"+first)
            console.log("last:"+last)
           
            first=first.replace(/\s/g,'')
            last=last.replace(/\s/g,'')

            var start=parseInt(first)
            var end=parseInt(last)
            

            while(start<=end){
               obj = {
                date: result[0] + ' ' + start + ', ' + year,
                time: time,
                act: act,
                image: result.img,
              };
              
              //console.log("here:"+result[0]+' '+start+', '+year )
              const event=new Event({
                act:obj.act,
                time:obj.time,
                date:obj.date
              })
              console.log(obj)
              const prom1=new Promise(async(resolve1,reject1)=>{
                try{
                  const saved=await event.save()
                  console.log(saved)
                  resolve1()
                }catch(err2){
                  reject1()
                }
              })

              prom1.then(()=>{
                  console.log("success")
              }).catch(()=>{
                console.log("fail")
              })
             

              
             
              start++
             
            }
          }else{
  
          //let httpId = htmls[count].id;
          //console.log(httpId)
          var events = await Event.find({});
         
          //check that the event doesnt already exist
        
        
         
         
            var request=htmls[count]
          if(request!=null){
         
          request=request.request
         const prom1=new Promise(async(resolve1,reject1)=>{
            try{
          const event=new Event({
            act:obj.act,
            date:obj.date,
            time:obj.time,
            
          })
  
         // const saved=await event.save()
         // console.log(saved)
        }catch(err){
          reject()
        }

         })

         prom1.then(()=>{

         }).catch((err)=>{
          console.log(err)
         })
        
         
          }
        }
        
       


  
        }
      });
      count++;
    }
  

  })

  prom.then(()=>{

  }).catch((err)=>{
    console.log(err)
  })
  
}

module.exports = router;
