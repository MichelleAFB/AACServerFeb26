/*
import express from 'express'
import mysql from 'mysql'
import cors from 'cors'
import axios from 'axios'
import cheerio from 'cheerio'
import puppeteer from 'puppeteer'
import fs from 'fs'
import cl from 'cloudinary'
import client from 'https'
import bcrypt from 'bcrypt'

import passport from 'passport'
import download from 'image-downloader'
import denv from 'dotenv'
import session from 'express-session'
*/

const dotenv = require("dotenv");
dotenv.config({ path: "./config/config.env" });
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const router = express.Router();

//const { createProxyMiddleware } = require("http-proxy-middleware");
const passport = require("passport");
const passportSetup = require("./config/passport");
const cors = require("cors");
const { initialize } = require("passport");
const mysql = require("mysql");
const axios = require("axios");
const cheerio = require("cheerio");
const puppeteer = require("puppeteer");
const fs = require("fs");
const client = require("https");
const download = require("image-downloader");
const bcrypt = require("bcrypt");
const session = require("express-session");
const swaggerUI = require("swagger-ui-express");
const swaggerJsDoc = require("swagger-jsdoc");
const bodyParser = require("body-parser");
const User = require("./models/User");

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
const morgan = require("morgan");

const GenerateEventData = require("./GenerateEventData");
app.use("/generate", GenerateEventData);

app.listen(3002, () => console.log("connected " + 3002));

const db = require("./config/db");
db.connect(() => {
  console.log("db connected in index route");
});

/*
if(process.env.NODE_ENV === 'development'){
  app.use(morgan('dev'))
}
*/

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

console.log(process.env.PORT);
console.log(db.state);

//GOOGLE MAILER STUFF
const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;

const OAuth2_client = new OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);
OAuth2_client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });

function send_mail(name, recipient) {
  const accessToken = OAuth2_client.getAccessToken();
  const transport = nodemailer.createTransport({
    service: "gmail",
    suth: {
      type: "Oauth2",
      user: process.env.name,
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      refreshToken: process.env.REFRESH_TOKEN,
      accessToken: accessToken,
      tls: {
        rejectUnauthorized: false,
      },
    },
  });

  const mail_options = {
    from: "AAC SUITE ADMINISTRATION",
    to: recipient,
    subject: "Thank you for your reservation request",
    html: get_html_message,
  };

  transport.sendMail(mail_options, function (error, result) {
    if (error) {
      console.log(error);
    } else {
      console.log("Success: ", result);
    }
    transport.close();
  });
}

function get_html_message(name) {
  return `<h3> ${name}!, THANK YOU FOR YOUR RESERVATION!</h3>`;
}

//send_mail('jOE MAMA','rebowan197@khaxan.com')
/************************************************/

//SWAGGER STUFF
const swaggerOptions = {
  swaggerDefinition: {
    info: {
      title: "AAC Server api",
      description: "Aac customer and event information",
      contact: {
        name: "Michelle badu",
      },
      servers: "http://localhost:3002",
    },
  },
  // ['.routes/*.js']
  apis: ["index.js"],
};
//Routes

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerDocs));

function handleDisconnect() {
  // Recreate the connection, since
  if (db.state == "disconnected") {
    db.connect(function (err) {
      // The server is either down
      if (err) {
        // or restarting (takes a while sometimes).
        console.log("error when connecting to db:", err);
        setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
      } else {
        console.log("connection restablished");
      } // to avoid a hot loop, and to allow our node script to
    }); // process asynchronous requests in the meantime.
    // If you're also serving http, display a 503 error.
    db.on("error", function (err) {
      console.log("db error", err);
      if (err.code === "PROTOCOL_CONNECTION_LOST") {
        // Connection to the MySQL server is usually
        handleDisconnect(); // lost due to either server restart, or a
      } else {
        // connnection idle timeout (the wait_timeout
        throw err; // server variable configures this)
      }
    });
  } // the old one cannot be re
}

//handleDisconnect();

//force db to keep connection alive
setInterval(function () {
  db.query("SELECT 1");
}, 5000);

/*************************************************
 * ************************************************
 * ************************************
 */

app.get("/", (req, res) => {
  res.json("hello");
});

async function downloadImage(url, filepath) {
  const response = await axios({
    url,
    method: "GET",
    responseType: "stream",
  });
  return new Promise((resolve, reject) => {
    response.data
      .pipe(fs.createWriteStream(filepath))
      .on("error", reject)
      .once("close", () => resolve(filepath));
  });
}

/////////////PROTECT//////////////////////

///////get any new event https responses

//********PROTECT******GOOD (11/23/22)/
//(2) use after "/init"
//gets html from requests then puts into htmlfrom10httpevents table
function getHtmlfromRequests() {
  console.log("****getting html from request**");
  db.query("SELECT * FROM http10events;", (err, results) => {
    if (!err) {
      let count = 0;

      while (count < results.length) {
        const r = results[count].httprequest;
        console.log(r);
        axios.get(r).then((response) => {
          console.log("\n\n\n\n\n");
          console.log(response.data);
          console.log("RESPPONSE");
          const html = response.data;
          console.log("\n\n\n\n\n");
          db.query(
            "SELECT * FROM htmlfrom10httpevents WHERE httprequest = ?",
            r,
            (err, results2) => {
              if (!err) {
                if (results2.length == 0) {
                  console.log("UNIQUE REQ, ADD HTML");
                  let a = r.length;
                  let b = r.length - 2;
                  let suffix = r.substring(a, b);
                  console.log(suffix);
                  db.query(
                    "INSERT INTO htmlfrom10httpevents (id,httprequest,html) VALUES (?,?,?)",
                    [suffix, r, html],
                    (err, results3) => {
                      if (!err) {
                        console.log("\n\n\n\n\n");
                        console.log("success level3 INSERT");
                        console.log(results3);
                        console.log("\n\n\n\n");
                      }
                    }
                  );
                }
              }
            }
          );
        });
        count++;
      }
    }
  });
  console.log("********COMPLETE***********");
}

app.get("/getHtmlfromHttp", (req, res) => {
  getHtmlfromRequests();
});

///////////////////PROTECT///////////////////////////////
//////////////extracts event info////////////////
//use 3rd
//extracts event information using cheerio then stores in eventsinfo
//requires:table htmlfrom10httpevents to exist

function parseEventsFromHtmlFinal() {
  db.query(
    "SELECT * FROM htmlfrom10httpevents ORDER BY id ASC;",
    (err, results) => {
      if (!err) {
        console.log("asc");
        //console.log(results)

        let count = 0;
        let size = results.length;
        while (count < size) {
          //console.log(results[count].id)
          let html = results[count].html;

          const $ = cheerio.load(html);

          $('div[class="info clearfix"]').each(function () {
            if ($(this).text() != "Info" || $(this).text().length === 3) {
              const s = $(this).find('div [class="date"]').text();
              const result = s.trim().split(/\s+/);
              const fields = [];
              let img = $(this).prev().children().html();
              //console.log(img)
              let imglength = img.length - 7;
              let $img = img.substring(14, imglength);
              //console.log($img)
              result.img = $img;

              console.log("\n\n");

              const act = $(this).find("h3").text();
              const obj = {
                date: result[0] + " " + result[1] + " " + result[2],
                time: result[4],
                act: act,
                image: result.img,
              };
              console.log(obj);
              let httpId = results[count].id;
              //console.log(httpId)

              //check that the event doesnt already exist

              db.query(
                "SELECT * from eventsinfo WHERE (act,date,time) = (?,?,?)",
                [obj.act, obj.date, obj.time],
                (err, results2) => {
                  if (!err) {
                    //CASE: add in new event info
                    const dontadd = "FOR KING + COUNTRY ";
                    let add = true;
                    if (act.includes(dontadd)) {
                      add = false;
                    }
                    console.log(
                      "found duplicate: " + obj.data + " date: " + obj.date
                    );
                    if (results2.length == 0 && add) {
                      db.query(
                        "INSERT INTO eventsinfo (act,date,time,image,httpId) VALUES (?,?,?,?,?);",
                        [obj.act, obj.date, obj.time, obj.image, httpId],
                        (err, res) => {
                          if (!err) {
                            //console.log(res)
                            console.log(
                              "obj: " +
                                obj.act +
                                " on date " +
                                obj.date +
                                " inserted!"
                            );
                            // console.log(res)
                          }
                        }
                      );
                    }
                    if (results2.length > 0) {
                      console.log("DONT INSERT");
                    }
                  }
                }
              );
            }
          });
          count++;
        }
      }
    }
  );
}

//parseEventsFromHtmlFinal()

app.get("/getHtmlfromRequests", (req, res) => {
  getHtmlfromRequests();
});

app.get("/sendEventstoDB", (req, res) => {
  parseEventsFromHtmlFinal();
});

const responseArray = [];

app.get("/getEvents", (req, res) => {
  db.query("SELECT * FROM eventsinfo;", (err, results) => {
    if (!err) {
      //console.log(results)
      res.json(results);
    }
  });
});

function checkUpdate(eventDate, today, months) {
  let dayMatch;

  if (eventDate[2] == "-") {
    eventDate[2] = "2022";
    dayMatch = eventDate[1].substring(0, eventDate[1].length) >= today.day;
  } else {
    dayMatch = eventDate[1].substring(0, eventDate[1].length - 1) >= today.day;
  }
  //console.log(eventDate)

  // console.log("event:"+ eventDate[0] + " " + eventDate[1].substring(0,eventDate[1].length-1))
  //console.log("today:"+ today.month + " " + today.day)

  const monthMatch = eventDate[0] == today.month;
  const yearCurrent = eventDate[2] >= today.year;
  console.log(yearCurrent);
  console.log(eventDate[2]);
  //console.log("day not current:"+dayMatch)
  //console.log("monthMatch:"+monthMatch)
  //console.log("year current:"+ yearCurrent)

  switch (monthMatch) {
    case false:
      switch (yearCurrent) {
        case true:
          //console.log("date is current")
          return true;
          break;
        case false:
          //console.log("date is not current")
          return false;
          break;
      }

      break;
    case true:
      switch (dayMatch) {
        case true:
          //console.log("date is current.day is current")
          return true;
          break;
        case false:
          //console.log("date is not current.day is not current")
          return false;
          break;
      }
  }

  // code block
}

function checkToday(eventDate, today, months) {
  if (eventDate[2] == "-") {
    eventDate[2] = "2022";
  }
  if (
    eventDate.month == today.month &&
    today.day == eventDate[1] &&
    today.year == eventDate[2]
  ) {
    return true;
  } else {
    return false;
  }
}
//end point to send events to db
/**
 * @swagger
 * /sendEventstoFront:
 *  get:
 *    description: Use to request all customers
 *    responses:
 *      '200':
 *        description: A successful response..
 */
app.get("/sendEventstoFront", (req, res) => {
  db.query("SELECT * FROM eventsinfo", (err, result) => {
    //console.log(result)
    res.send(result);
  });
});

/**
 * @swagger
 * /sendOccupiedtoFront:
 *  get:
 *    description: Use to request all customers
 *    responses:
 *      '200':
 *        description: A successful response..
 */
app.get("/sendOccupiedtoFront", (req, res) => {
  //console.log("*********SENDING OCCUPIED SEATS TO THE FRONT***")

  db.query("SELECT * FROM occupied;", (err, results) => {
    if (!err) {
      //console.log(results)
      res.send(results);
    }
  });
});
/*************************************************** */

/**
 * @swagger
 * /recentChanges:
 *  get:
 *    description: Use to request all customers
 *    responses:
 *      '200':
 *        description: A successful response..
 */
app.get("/recentChanges", (req, res) => {
  db.query("SELECT * FROM recentchanges", (err, results) => {
    res.json(results);
  });
});

/**
 * @swagger
 * /setAccessType:
 *   post:
 *     summary: Create a new book
 *     tags: [Books]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Book'
 *     responses:
 *       200:
 *         description: The book was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/'
 *       500:
 *         description: Some server error
 */
app.patch("/setAccessType", (req, res) => {
  console.log("***********************8");
  const event = req.body.event;
  const access = req.body.access;
  //event.access=access
  console.log("\n\n");
  console.log(access);
  console.log(event);
  console.log("\n\n\n\n\n");

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const date = new Date();

  let day = date.getDate();
  let year = date.getFullYear();
  let monthIndex = date.getMonth();
  const month = months[monthIndex];
  console.log(event.act);

  const dayChanged = month + " " + day + ", " + year;
  var now = new Date(),
    ampm = "am",
    h = now.getHours(),
    m = now.getMinutes(),
    s = now.getSeconds();
  if (h >= 12) {
    if (h > 12) h -= 12;
    ampm = "pm";
  }

  if (m < 10) m = "0" + m;
  if (s < 10) s = "0" + s;
  console.log(
    now.toLocaleDateString() + " " + h + ":" + m + ":" + s + " " + ampm
  );

  const dateString = month + " " + day + "," + year;
  const timeString = date.toLocaleTimeString();
  const message =
    "Changed access event:[" +
    event.act.toUpperCase() +
    "] on [" +
    event.date.toUpperCase() +
    "] at [" +
    event.time +
    "] from " +
    event.access +
    " to " +
    access;
  console.log("HELLLLOOO");
  console.log(timeString + "?");
  console.log("access\n\n\n\n\n");
  console.log(event.access);
  console.log(access);
  if (event.access != access) {
    const type = "access-type";
    db.query(
      "INSERT INTO recentchanges (date,time,message,type,aux_id) VALUES (?,?,?,?,?)",
      [dateString, timeString, message, type, req.body.event.id],
      (err, results) => {
        if (!err) {
          if (results != null) {
            console.log("/ACCESS_TYPES:RECENT CHANGEES RESULT");
            console.log("NEWE");
            console.log(req.body);
            console.log(results);
          }
        }
      }
    );
  }
  console.log("same access?");
  console.log(access);
  console.log(event.access);

  if (event.access != access) {
    db.query(
      "UPDATE eventsinfo SET access = ? WHERE id = ?",
      [access, event.id],
      (err, results2) => {
        if (!err) {
          if (results2.affectedRows > 0) {
            console.log("ACCESS_TYPE:ACCESSS TYPE RESULT");
            console.log(results2);
            console.log("\n\n");
            res.json({ changed: true });
          } else {
            res.json({ changed: false });
          }
        }
        console.log("jdskgnksngja" + "\n\n");
        console.log(event.access);

        console.log("result");
        console.log(results2);
      }
    );
  }
});

/************************************************************* */
/**
 * @swagger
 * /todaysEvent:
 *  get:
 *    description: check and grab today's event if it exists
 *    responses:
 *      '200':
 *        description: A successful response..
 */
app.get("/todaysEvent", (req, res) => {
  db.query("SELECT * FROM eventsinfo ", (err, response) => {
    if (response.length > 0) {
      const events = response;
      // console.log(response)

      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const date = new Date();

      let day = date.getDate();
      let year = date.getFullYear();
      let monthIndex = date.getMonth();
      const month = months[monthIndex];
      // console.log(day + " " + month + " " + year)
      const today = {
        month: month,
        day: day,
        year: year,
      };

      const currentEvents = [];

      const prom = new Promise((resolve, reject) => {
        events.map((e) => {
          const eventdate = e.date.split(" ");
          const eventday = eventdate[1].replace(",", "");
          if (e.access == "public") {
            console.log("PUBLIC******************");
            console.log("hello");
          }
          const eventDate = {
            month: eventdate[0],
            day: eventday,
            year: parseInt(eventdate[2]),
          };

          console.log(checkToday(eventdate, today, months));
          if (checkToday(eventDate, today, months) != false) {
            res.json({ todayssEvent: e, exist: true });
            //console.log(currentEvents)
          }
        });
        resolve();
      });

      prom.then(() => {
        res.json({ exist: false });
        console.log("FINISHE");
        // res.json(currentEvents)
      });
    }
  });
});

//get updated event info
app.post("/getEventInfo/:id", (req, res) => {
  const id = req.params.id;

  console.log("GETTTING EVE");
  db.query("SELECT * FROM eventsinfo WHERE id = ?", id, (err, results) => {
    console.log(results);
    console.log("\n\n\n");
    res.send(results);
  });
});

app.post("/getEventRequestInfo/:id", (req, res) => {
  const id = req.params.id;

  console.log("GETTTING EVE");
  db.query(
    "SELECT * FROM reservationrequests WHERE eventId = ?",
    id,
    (err, results) => {
      console.log(results);
      console.log("\n\n\n");
      if (results) {
        res.json({ noRequests: false, requests: results });
      } else {
        res.json({ noRequests: true });
      }
    }
  );
});

/**
 * @swagger
 * /currentEvents:
 *  get:
 *    description: Use to request all customers
 *    responses:
 *      '200':
 *        description: A successful response..
 */
app.get("/currentEvents", async (req, res) => {
  db.query("SELECT * FROM eventsinfo ", (err, response) => {
    if (response) {
      const events = response;
      //console.log(response)

      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const date = new Date();

      let day = date.getDate();
      let year = date.getFullYear();
      let monthIndex = date.getMonth();
      const month = months[monthIndex];
      // console.log(day + " " + month + " " + year)
      const today = {
        month: month,
        day: day,
        year: year,
      };
      const dateString = today.month + " " + today.day + ", " + today.year;
      console.log(dateString);

      const currentEvents = [];

      const prom = new Promise((resolve, reject) => {
        events.map((e) => {
          const eventdate = e.date.split(" ");
          const eventday = eventdate[1].replace(",", "");
          if (e.access == "public") {
            console.log("PUBLIC******************");
            // console.log(e)
          }
          //console.log("eventday")
          //console.log(eventday)

          const eventDate = {
            month: eventdate[0],
            day: eventday,
            year: parseInt(eventdate[2]),
          };

          // console.log("check:"  + checkUpdate(eventDate,today,months))

          if (checkUpdate(eventdate, today, months) != false) {
            console.log(e);
            currentEvents.push(e);
            //console.log(currentEvents)
          }
        });
        resolve();
      });

      prom.then(() => {
        //console.log(currentEvents)
        console.log("FINISH");
        res.status(200).send(currentEvents);
      });
    }
  });
});

app.get("/companyEvents", (req, res) => {
  db.query("SELECT * FROM eventsinfo ", (err, response) => {
    if (response) {
      const events = response;
      //console.log(response)

      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const date = new Date();

      let day = date.getDate();
      let year = date.getFullYear();
      let monthIndex = date.getMonth();
      const month = months[monthIndex];
      // console.log(day + " " + month + " " + year)
      const today = {
        month: month,
        day: day,
        year: year,
      };
      const dateString = today.month + " " + today.day + ", " + today.year;
      console.log(dateString);

      const companyEvents = [];

      const prom = new Promise((resolve, reject) => {
        events.map((e) => {
          const eventdate = e.date.split(" ");
          const eventday = eventdate[1].replace(",", "");
          if (e.access == "company") {
            console.log("PUBLIC******************");
            // console.log(e)
          }
          //console.log("eventday")
          //console.log(eventday)

          const eventDate = {
            month: eventdate[0],
            day: eventday,
            year: parseInt(eventdate[2]),
          };

          // console.log("check:"  + checkUpdate(eventDate,today,months))

          if (checkUpdate(eventdate, today, months) != false) {
            if (e.access == "company") {
              companyEvents.push(e);
            }

            //console.log(currentEvents)
          }
        });
        resolve();
      });

      prom.then(() => {
        //console.log(currentEvents)
        console.log("FINISH");
        res.status(200).send(companyEvents);
      });
    }
  });
});

app.get("/privateEvents", (req, res) => {
  db.query("SELECT * FROM eventsinfo ", (err, response) => {
    if (response) {
      const events = response;

      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const date = new Date();

      let day = date.getDate();
      let year = date.getFullYear();
      let monthIndex = date.getMonth();
      const month = months[monthIndex];

      const today = {
        month: month,
        day: day,
        year: year,
      };
      const dateString = today.month + " " + today.day + ", " + today.year;
      console.log(dateString);

      const privateEvents = [];

      const prom = new Promise((resolve, reject) => {
        events.map((e) => {
          const eventdate = e.date.split(" ");
          const eventday = eventdate[1].replace(",", "");

          const eventDate = {
            month: eventdate[0],
            day: eventday,
            year: parseInt(eventdate[2]),
          };

          if (checkUpdate(eventdate, today, months) != false) {
            if (e.access == "private") {
              privateEvents.push(e);
            }
          }
        });
        resolve();
      });

      prom.then(() => {
        console.log("FINISH");
        res.status(200).send(privateEvents);
      });
    }
  });
});

/**
 * @swagger
 * /publicEvents:
 *  get:
 *    description:get Events open to the public
 *    responses:
 *      '200':
 *        description: A successful response..
 */
app.get("/publicEvents", (req, res) => {
  db.query("SELECT * FROM eventsinfo ", (err, response) => {
    if (response) {
      const events = response;
      //console.log(response)

      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const date = new Date();

      let day = date.getDate();
      let year = date.getFullYear();
      let monthIndex = date.getMonth();
      const month = months[monthIndex];
      // console.log(day + " " + month + " " + year)
      const today = {
        month: month,
        day: day,
        year: year,
      };

      const currentEvents = [];
      const publicEvents = [];

      const prom = new Promise((resolve, reject) => {
        events.map((e) => {
          const eventdate = e.date.split(" ");
          const eventday = eventdate[1].replace(",", "");

          const eventDate = {
            month: eventdate[0],
            day: eventday,
            year: parseInt(eventdate[2]),
          };

          // console.log(checkUpdate(eventdate,today,months))
          if (checkUpdate(eventdate, today, months) != false) {
            currentEvents.push(e);
            if (e.access == "public") {
              //console.log("PUBLIC******************")
              publicEvents.push(e);
              // console.log(e)
            }

            //console.log(currentEvents)
          }
        });
        resolve();
      });

      prom.then(() => {
        //console.log(currentEvents)
        console.log("FINISH");
        res.json(publicEvents);
      });
    }
  });
});

//////////////////////DATA FROM CLIENT///////////////////////////////////

/**
 * @swagger
 * paths:
  /setOccupied:
    post:
      summary: seats a new occupied seat for an event with individual seat bookings.
      consumes:
        - application/json
      parameters:
        - in: body
          name: occupied
          description: The user to create.
          schema:
            properties:
              seats:
                type: array
              event:
                type: object
      responses:
        201:
          description: Created
      */
app.post("/setOccupied", async (req, res) => {
  try {
    console.log("HELLO");
    let levels = await req.body;
    const seats = req.body.response;
    const event = req.body.event;
    //console.log(req.body)
    //console.log(seats)
    //console.log(event)
    //console.log(typeof(seats))

    seats.map((s) => {
      console.log(s.seat);
      db.query(
        "SELECT * FROM occupied WHERE (actID,seat) = (?,?)",
        [event.id, s.seat],
        (err, results2) => {
          console.log("HHHHHH");
          console.log("results from occupied table");

          if (results2.length == 0) {
            console.log("UNIQUE");

            db.query(
              "INSERT INTO occupied (actID,seat,act) VALUES (?,?,?)",
              [event.id, s.seat, event.act],
              (err, res) => {
                console.log(res);
              }
            );
          }
        }
      );
    });

    console.log(event.id);

    db.query(
      "SELECT * FROM occupied WHERE (actID,act,seat) = (?,?,?) ",
      [event.id, event.act, seat],
      (err, ress) => {
        console.log("+++++matches++++++");
        console.log(ress);
        console.log("\n\n\n");
        if (ress != null) {
          /*seats.forEach((s)=> {
              db.query(`INSERT INTO occupied (actID,act,seat) VALUES (?,?,?)`,[event.id,event.act,s.seat], (err,results2) => {
                if(!err){
                  console.log(results2)
                }
              })
            })
            */
        }
      }
    );
    //res.sendStatus(200).json(levels)
    //console.log(levels)
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});
/*****ENDPOINTS********* */

/***********GOOD***************/
/****/
/**
 * @swagger
 * /getHttpEventsFinal:
 *  get:
 *    description: Use to request all customers
 *    responses:
 *      '200':
 *        description: A successful response..
 */
app.get("/getHttpEventsFinal", (req, res) => {
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

            db.query(
              "SELECT * FROM http10events WHERE (id,httprequest) = (?,?)",
              [id, mid],
              (res, err) => {
                console.log(res);
                console.log("GEting http events");

                if (res == null) {
                  db.query(
                    "INSERT INTO http10events (id,httprequest) VALUES (?,?)",
                    [id, mid],
                    (res, err) => {
                      console.log("INSERTED INTO DB");
                      console.log(res);
                    }
                  );
                }
              }
            );

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

    console.log("reponsearray");
    if (count == 19) {
      res.json(responseArray);
    }
  })();
});

///**********ADMIN SPECIFIC*************** */

/********ROUTES***********/

const userRoute = require("./routes/User");
app.use("/user", userRoute);

const reservationRoute = require("./routes/Reservations");

app.use("/reservations", reservationRoute);

/**************************** */
const UserModel = require("./models/UserModel");
GoogleStrategy = require("passport-google-oauth").OAuth2Strategy;

/***PASSPORT******************/

passport.serializeUser(function (user, done) {
  // done(null, user.id);

  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3002/auth/google/callback",
      //passReqToCallback:true
    },
    function (accessToken, refreshToken, profile, done) {
      console.log(profile.id);
      const userd = profile._json;
      const userData = {
        googleId: profile.id,
        firstName: userd.given_name,
        lastName: userd.family_name,
        email: userd.email,
      };
      console.log(userData);
      insertGoogleUserInDB(userData);
      return done(null, profile);
      console.log("*****SHOOTING FROM PASSPOR******");
    }
  )
);

app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

/***********AUTH ROUTES****************/

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["openid email profile"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/",
    successRedirect: "/protected",
  }),
  (req, res) => {
    res.send("succes from auth auth");
  }
);

app.get("/protected", (req, res) => {
  res.redirect("http://localhost:3000/client-prehome");
});

app.get("/auth/logout", (req, res, next) => {
  console.log("logging out");
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("https://localhost:3000/sign-in");
  });
});

/**************Google Login Helper functions******************* */

function insertGoogleUserInDB(user) {
  console.log("inside db");
  console.log(user.googleId);
  db.query(
    "SELECT * FROM googleusers WHERE  (googleId,firstName,lastName) = (?,?,?) ",
    [user.googleId, user.firstName, user.lastName],
    (err, results) => {
      if (results.length > 0) {
        console.log("google user already exists");
        console.log("****ALREADY EXIST");
        console.log(results[0]);
      } else {
        db.query(
          "INSERT INTO googleUsers (googleId,firstName,lastName,email) VALUES (?,?,?,?)",
          [user.googleId, user.firstName, user.lastName, user.email],
          (err2, results2) => {
            if (!err2) {
              console.log("****GOOGLE USER INSERTED*****");
              console.log(results2);
            }
          }
        );
      }
    }
  );
}

/**************************** */

const mongo = require("mongodb");
const connectdb = async () => {
  try {
    console.log("hello");
    const conn = await mongoose.connect(
      "mongodb+srv://MAB190011:MAB190011@atlascluster.xdodz.mongodb.net/?retryWrites=true&w=majority",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log(`MONGO DB connected: ${conn.connection.host}`);
  } catch (err) {
    //console.log(err.stack);
    // process.exit(1)
  }
};

//connectdb()

//console.log(connectdb)

const EventModel = require("./models/Event");
const { Console } = require("console");

app.post("/test", (req, res) => {
  //const message= req.body.data
  console.log("TEST\n\n\n");
  res.send("WORKD");
});

/*

mongoose.connect("mongodb+srv://MAB190011:MAB190011@atlascluster.xdodz.mongodb.net/aacdb?retryWrites=true&w=majority")
//sendToMongoDB()
//console.log("DB")
//console.log(connectdb)

const schema = new mongoose.Schema({ name: 'string', size: 'string' });
const Tank = mongoose.model('Tank', schema);

/*

const small = new Tank({ size: 'small' });
small.save(function (err) {
  if (err) return handleError(err);
  // saved!
});

// or

Tank.create({ size: 'small' }, function (err, small) {
  if (err) {return handleError(err)}else{ console.log('SUCCESS')};
  // saved!
});

// or, for inserting large batches of documents
/*
Tank.insertMany([{ size: 'small' }], function(err) {
  if(err){
    console.log("ERR")
  }

});


//const EventModel = require('./models/EventModel')


const event = new EventModel({
  id:'number',
  act:'string',
  date:'string',
  time:'string',
  httpId:'number',
  image:'string'
 });

 function handleError(err){
  console.log(err)
 }

event.save(function (err) {
  if (err) return handleError(err);
  // saved!
});

function sendtoMongo(){

  axios.get("http://localhost:3002/sendEventstoFront").then((resp) => {
    const res=resp.data

     // console.log(res);
   
    res.map((r) => {

      mongoose.connect("mongodb+srv://MAB190011:MAB190011@atlascluster.xdodz.mongodb.net/aacdb?retryWrites=true&w=majority")

      const event = new EventModel({
        id: r.id,
        act: r.act,
        date: r.date,
        time: r.time,
        httpId: r.httpId,
        image: r.image
       });

       const query = EventModel.find();
       query instanceof mongoose.Query;

       const duplicate=EventModel.find({
        id: r.id,
        act: r.act,
        date: r.date,
        time: r.time,
        httpId:r.httpId,
        image:r.image
      })

      console.log("\n\n\n")
      const dup = duplicate._conditions




    console.log(typeof(dup))
    if(dup.act == " "){
      console.log("original")
      event.save(function (err) {
        if (err){
          console.log(err)
        };
        // saved!
      });
    }else{
      console.log("duplicate")
    }
      
      EventModel.create({ 
        id: r.id,
        act: r.act,
        date: r.date,
        time: r.time,
        httpId: r.httpId,
        image: r.image
       }, function (err, small) {
        if (err) {
          console.log(err.message)
        }else{ 
          //console.log('SUCCESS')
        };
        // saved!
      });
      

    })
  })
}
*/

//sendtoMongo()
