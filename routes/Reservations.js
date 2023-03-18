const express = require("express");
const router = express.Router();
const cookie = require("universal-cookie");
const bcrypt = require("bcrypt");
const db = require("../config/db");
const cors = require("cors");
const swaggerUI = require("swagger-ui-express");
const swaggerJsDoc = require("swagger-jsdoc");


console.log("db from reservation route");

function getToday() {
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
  console.log(today);
  const dateString = today.month + " " + today.day + ", " + today.year;
  console.log(dateString);
  return dateString;
}

function getTime() {
  var date = new Date();
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

  const timeString = date.toLocaleTimeString();
  console.log(timeString);

  return timeString;
}

getTime();
getToday();
router.post("/reservationRequests", (req, res) => {
  console.log(req.body.event);
  console.log(req.body);
  const eventId = req.body.event.id;
  const act = req.body.event.act;

  db.query(
    "INSERT INTO reservationrequests (eventId,dateReserved,timeReserved,clientName,clientPhone,clientEmail,act,actDate,actTime) VALUES (?,?,?,?,?,?,?,?,?)",
    [
      req.body.event.event.id,
      getToday(),
      getTime(),
      req.body.name,
      req.body.phone,
      req.body.email,
      req.body.event.event.act,
      req.body.event.event.date,
      req.body.event.event.time,
    ],
    (results, err) => {
      if (!err) {
        console.log(results);
      }
    }
  );

  res.json("Request recieved");
});

router.get("/reservationRequests", (req, res) => {
  console.log("getting reservations");
  db.query("SELECT * FROM reservationrequests", (err, results) => {
    res.send({ request: results });
  });
});

router.post("/approveRequest", (req, res) => {
  console.log(req.body);
  console.log(req.body.request.request.eventId);

  const shouldApprove = [];
  db.query(
    "SELECT * FROM reservationrequests WHERE eventId = ?",
    req.body.request.request.eventId,
    (err, results) => {
      if (!err) {
        console.log(results);

        shouldApprove[0] = true;
        // console.log(shouldApprove);
        const prom = new Promise((resolve, reject) => {
          if (results.length == 1) {
            console.log(
              "results should match " + req.body.request.request.eventId
            );
            console.log(req.body.request.request);
            console.log("\n\n\n");
            if (results[0].approved == 1) {
              console.log(results);
              shouldApprove[0] = false;
              console.log("shouldApprove: " + shouldApprove[0]);
              console.log("NO CHANGES SHOULD BE MADE");
            }
          }
          if (results.length > 1) {
            results.map((r) => {
              if (r.approved == 1) {
                console.log(req.body.request.request);
                shouldApprove[0] = false;
                console.log("should NOT approve");
                console.log(shouldApprove);
              }
            });
          }
          resolve();
        });

        prom.then(() => {
          console.log;
          //console.log(shouldApprove[0]);
          if (shouldApprove[0] == true) {
            ("APPPPPPPPPPRRRRRRRRRRRRRRRRRRRROVVVVVVVVVVVVVVEE");
            console.log("\n\n\n\n\n\n\n\n");
            console.log("sendoing approval to db");
            const prom = new Promise((resolve, reject) => {
              db.query(
                "UPDATE reservationrequests SET approved = ? WHERE id = ?",
                [1, req.body.request.request.id],
                (err, results) => {
                  if (!err) {
                    console.log(
                      "\n\n\n results from inserting into approvedrequest"
                    );
                    console.log(results);
                    console.log("this indicates successfull op");
                    if (results != null) {
                      const prom2 = new Promise((resolve, reject) => {
                        const today = getToday();
                        const todayTime = getTime();
                        const type = "approve-request";
                        console.log(
                          "!!!!!!!*****RECENT CHANGES*********!!!!!!!!!!!"
                        );
                        db.query(
                          "INSERT INTO recentchanges (aux_id,date,time,message,type) VALUES (?,?,?,?,?)",
                          [
                            req.body.request.request.id,
                            today,
                            todayTime,
                            req.body.message,
                            type,
                          ],
                          (err2, results2) => {
                            console.log("\n\n\n");
                            console.log("results2");
                            console.log(results2);
                            if (!err2) {
                              console.log(
                                "\n\n\n no error for entering into recentchanges V@"
                              );
                            }
                            if (results2 != null) {
                              console.log("results enter into recentchanges");
                              console.log(results2);
                              resolve();
                            }
                            if (!results2 || results2 == null) {
                              reject();
                            }
                          }
                        );
                      });

                      prom2
                        .then(() => {
                          console.log("******PROM 2 THEN*****");
                          res.json({
                            approved: true,
                            message:
                              "SUCCESSFULLY RESERVED \n[" +
                              req.body.request.request.act +
                              "] for [" +
                              req.body.request.request.clientName +
                              "] \n Event DATE/TIME: [" +
                              req.body.request.request.actDate +
                              " " +
                              req.body.request.request.actTime +
                              "]",
                          });
                        })
                        .catch(() => {
                          console.log("*******PROM 2 CATCH********");
                          res.json({
                            approve: false,
                            meesage:
                              req.body.request.request.act +
                              " is already reserved",
                          });
                        });
                    }
                    //add after recentchanges

                    //res.json({results:results, approved:true})
                  }
                }
              );
            });
          } else {
            res.json({
              approved: false,
              message:
                "FAILED APPROVAL\n[" +
                req.body.request.request.act +
                " | " +
                req.body.request.request.actDate +
                " | " +
                req.body.request.request.actDate +
                "] already reserved for another guest",
            });
          }
        });
      }
    }
  );
});

router.post("/revokeReservation", (req, res) => {
  console.log(req.body.reservation);
  const reservation = req.body.reservation;
  //console.log();

  db.query(
    "SELECT * from reservationrequests WHERE (id,approved) = (?,?) ",
    [reservation.id, reservation.approved],
    (err, result) => {
      console.log("RESULT");
      console.log(result);

      if (result != null) {
        console.log(result[0].approved);
        if (result[0].approved == 1) {
          console.log("results from reservation requests");
          console.log(result);

          const prom1 = new Promise((resolve, reject) => {
            db.query(
              "UPDATE reservationrequests SET approved = -1 WHERE id = ?",
              reservation.id,
              (err, result1) => {
                if (err) {
                  console.log(err);
                  //TODO:add reject case
                  //reject()
                }
                if (!err) {
                  if (result1 != null) {
                    console.log("updated events info");
                    console.log(result1);
                    resolve();
                  }
                }
              }
            );
          });

          prom1.then(() => {
          

            const changeMessage =
              "Revoked reservation:[" +
              reservation.act.toUpperCase() +
              "] on [" +
              reservation.actDate +
              "] at [" +
              reservation.actTime +
              "] from client [" +
              reservation.clientName +
              " | " +
              reservation.clientEmail +
              "]";
            const type = "reservation-revoke";
            console.log(changeMessage);
            db.query(
              "INSERT INTO recentchanges (date,time,message,type,aux_id) VALUES (?,?,?,?,?)",
              [getToday(), getTime(), changeMessage, type, reservation.id],
              (err2, result2) => {
                if (err2) {
                  console.log(err2);
                }
                if (!err2) {
                  if (result2 != null) {
                    
                    res.json({
                      revoked: true,
                      message:
                        "SUCCESSFULLY REVOKED RESERVATION FOR " +
                        reservation.act +
                        " from client [" +
                        reservation.clientName +
                        "]",
                    });
                  } else {
                    console.log(err2);
                    res.json({
                      revoked: false,
                      message:
                        "COULD NOT REVOKE RESERVATION FOR " +
                        reservation.act +
                        " from client [" +
                        reservation.clientName +
                        "]",
                    });
                  }
                }
              }
            );
          });
        }
      }
    }
  );

  const shouldApprove = [];
  /*
  db.query(
    "SELECT * FROM reservationrequests WHERE eventId = ?",
    req.body.request.request.eventId,
    (err, results) => {
      if (!err) {
        console.log(results);

        shouldApprove[0] = true;
        // console.log(shouldApprove);
        const prom = new Promise((resolve, reject) => {
          if (results.length == 1) {
            console.log(
              "results should match " + req.body.request.request.eventId
            );
            console.log(req.body.request.request);
            console.log("\n\n\n");
            if (results[0].approved == 1) {
              console.log(results);
              shouldApprove[0] = false;
              console.log("shouldApprove: " + shouldApprove[0]);
              console.log("NO CHANGES SHOULD BE MADE");
            }
          }
          if (results.length > 1) {
            results.map((r) => {
              if (r.approved == 1) {
                console.log(req.body.request.request);
                shouldApprove[0] = false;
                console.log("should NOT approve");
                console.log(shouldApprove);
              }
            });
          }
          resolve();
        });

        prom.then(() => {
          console.log;
          //console.log(shouldApprove[0]);
          if (shouldApprove[0] == true) {
            ("APPPPPPPPPPRRRRRRRRRRRRRRRRRRRROVVVVVVVVVVVVVVEE");
            console.log("\n\n\n\n\n\n\n\n");
            console.log("sendoing approval to db");
            const prom = new Promise((resolve, reject) => {
              db.query(
                "UPDATE reservationrequests SET approved = ? WHERE id = ?",
                [1, req.body.request.request.id],
                (err, results) => {
                  if (!err) {
                    console.log(
                      "\n\n\n results from inserting into approvedrequest"
                    );
                    console.log(results);
                    console.log("this indicates successfull op");
                    if (results != null) {
                      const prom2 = new Promise((resolve, reject) => {
                        const today = getToday();
                        const todayTime = getTime();
                        const type = "approve-request";
                        console.log(
                          "!!!!!!!*****RECENT CHANGES*********!!!!!!!!!!!"
                        );
                        db.query(
                          "INSERT INTO recentchanges (aux_id,date,time,message,type) VALUES (?,?,?,?,?)",
                          [req.body.request.request.id,today, todayTime, req.body.message, type],
                          (err2, results2) => {
                            console.log("\n\n\n");
                            console.log("results2");
                            console.log(results2);
                            if (!err2) {
                              console.log(
                                "\n\n\n no error for entering into recentchanges V@"
                              );
                            }
                            if (results2 != null) {
                              console.log("results enter into recentchanges");
                              console.log(results2);
                              resolve();
                            }
                            if (!results2 || results2 == null) {
                              reject();
                            }
                          }
                        );
                      });

                      prom2
                        .then(() => {
                          console.log("******PROM 2 THEN*****");
                          res.json({
                            approved: true,
                            message:
                              "SUCCESSFULLY RESERVED \n[" +
                              req.body.request.request.act +
                              "] for [" +
                              req.body.request.request.clientName +
                              "] \n Event DATE/TIME: [" +
                              req.body.request.request.actDate +
                              " " +
                              req.body.request.request.actTime+"]",
                          });
                        })
                        .catch(() => {
                          console.log("*******PROM 2 CATCH********");
                          res.json({
                            approve: false,
                            meesage:
                              req.body.request.request.act +
                              " is already reserved",
                          });
                        });
                    }
                    //add after recentchanges

                    //res.json({results:results, approved:true})
                  }
                }
              );
            });
          } else {
            res.json({
              approved: false,
              message: "FAILED APPROVAL\n["+ req.body.request.request.act +" | "+ req.body.request.request.actDate+ " | "+ req.body.request.request.actDate+ "] already reserved for another guest",
            });
          }
        });
      }
    }
  );
  */
});

/**
 * @swagger
 * /approvedReservations:
 *  get:
 *    description:get all confirmed Reservations
 *    responses:
 *      '200':
 *        description: A successful response..
 */
router.get("/approvedReservations", (req, res) => {
  //console.log(req.body.request);
  db.query(
    "SELECT * FROM reservationrequests WHERE approved = (?)",
    1,
    (err, results) => {
      if (!err) {
        if (results) {
          results.map((r) => {
            db.query(
              "SELECT * FROM eventsinfo WHERE id = ?",
              r.id,
              (err, result) => {
                console.log("results");
                console.log(result);
              }
            );
          });
          console.log("results");
          console.log(results);
          res.json(results);
        }
      }
    }
  );
});

module.exports = router;
