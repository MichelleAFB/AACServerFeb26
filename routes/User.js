/*
import express from 'express'
import bcrypt from 'bcrypt'
const router=express.Router()
*/
const express = require("express");
const router = express.Router();
const cookie = require("universal-cookie");
const bcrypt = require("bcrypt");
const db = require("../config/db");
const cors = require("cors");
const swaggerUI = require("swagger-ui-express");
const swaggerJsDoc = require("swagger-jsdoc");

db.connect(() => console.log("db connected in user route"));

//SWAGGER STUFF

router.post("/sign-up", async (req, res) => {
  const first = req.body.first;
  const last = req.body.last;
  const email = req.body.email;
  const password = req.body.password;
  try {
    console.log("CREATING NEW USER WITH PASSWORD " + password);

    db.query(
      "INSERT INTO users (first,last,email,password) VALUES (?,?,?,?);",
      [first, last, email, password],
      (err, results) => {
        console.log(err);
        res.send(results);
      }
    );
  } catch {
    console.log("fail");
  }
});

async function validate(userpassword, dbpass) {
  const match = await bcrypt.compare(userpassword, dbpass);
  if (match) {
    console.log(match);
    console.log("true for match");
  }
  if (match == false) {
    console.log(bcrypt.compare(userpassword, dbpass));
    console.log(match);
    console.log("failureeee!!!");
  }
}

/**
 * @swagger
 * paths:
  /users:
    post:
      summary: Creates a new user.
      consumes:
        - application/json
      parameters:
        - in: body
          name: user
          description: The user to create.
          schema:
            type: object
            required:
              - email
            properties:
              email:
                type: string
              password:
                type: string
      responses:
        201:
          description: Created
 */
console.log("SIGNIN")
router.post("/sign-in", async (req, res) => {
  //const token=req.header(x-auth-token)
  //res.send({loggedIn:true,message:"succcessful login"})
  console.log("NEWCCCC");
  const email = req.body.email;
  const password = req.body.password;
  const admin = req.body.admin;
  console.log("singing in");

  console.log(req.body);
  if (admin == true) {
    db.query(
      "SELECT * FROM users WHERE (email,admin) = (?,?)",
      [email, 1],
      (err, results) => {
        if (err) {
          console.log(err);
        }
        try {
          console.log(results);

          if (results.hasOwnProperty("length")) {
            console.log(results);

            if (results[0].password == password) {
              const name = results[0].first + " " + results[0].last;
              res.send({
                loggedIn: true,
                user: {
                  firstname: results[0].first,
                  lastname: results[0].last,
                  email: email,
                },
              });
            }
            if (results[0].password != password) {
              console.log("user does not exist");
              res.send({ loggedIn: false, message: "User doesn't exist" });
            }
          }
        } catch (err) {
          console.log("error occupied for results.length");
          console.log(err);
        }
        try {
          //console.log(Object.getOwnPropertyNames(results))
          if (results.length > 0) {
            if (results[0].password == password) {
              const name = results.first + " " + results.last;
              res.send({
                loggedIn: true,
                firstname: results[0].first,
                lastname: results[0].last,
                email: email,
              });
            }
          }
          if (results.password != password) {
            console.log("user does not exist");
            res.send({ loggedIn: false, message: "User doesn't exist" });
          }
        } catch (err) {
          console.log("error for results does not have length");
          console.log(err);
        }
      }
    );
  }

  if (!admin) {
    console.log("admin false");
    db.query("SELECT * FROM users WHERE email = ?", email, (err, results) => {
      if (err) {
        consolr.log("error");
        console.log("attempting to log in non admin");
        console.log(err);
        console.log("b1");
        res.send({ loggedIn: false, message: err.message });
      }
      if (results) {
        console.log(results);

        try {
          if (results.hasOwnProperty("length")) {
            if (results[0].password == password) {
              const name = results[0].first + " " + results[0].last;
              res.send({
                loggedIn: true,
                firstname: results[0].first,
                lastname: results[0].last,
                email: email,
              });
            }
            if (results.length >= 1) {
              if (results[0].password == password) {
                res.send({
                  loggedIn: true,
                  firstname: results[0].first,
                  lastname: results[0].last,
                  email: email,
                });
              }
            }
          }
        } catch (err) {
          console.log(err);
        }

        try {
          if (results.length > 1) {
            if (results[0].password == password) {
              const name = results.first + " " + results.last;
              res.send({ loggedIn: true, name: name });
            }
            if (results.length == 1) {
              if (results[0].password == password) {
                const name = results.first + " " + results.last;
                res.send({
                  loggedIn: true,
                  firstname: results[0].first,
                  lastname: results[0].last,
                  email: email,
                });
              }
            }
          }
        } catch (err) {
          console.log(err);
        }
      }
      /* if(results[0].password==password){
          res.status(200).send({loggedIn:true,message:email})
        }else{
          res.json({
            loggedIn: false,
            message: "Wrong password for user "+ email+ " !",
          })
        }
        */
    });
  }
});

router.post("/sign-in-users", (req, res) => {
  const email = req.body.email;
  const password = req.body.email;

  db.query(
    "INSERT INTO signedinusers (email,password) VALUES (?,?);",
    [email, password],
    (err, results) => {
      console.log(err.message);
      res.send(results);
    }
  );
});

router.post("/sign-in/employee", (req, res) => {
  console.log(req.body);
  db.query(
    "SELECT * FROM company_employees WHERE (id,email,password) = (?,?,?)",
    [req.body.id, req.body.email, req.body.password],
    (err, results) => {
      if (!err) {
        if (results) {
          res.json({ employee: results, login: true });
        } else {
          res.json({ employee: null, login: false });
        }
      }
    }
  );
});

module.exports = router;
