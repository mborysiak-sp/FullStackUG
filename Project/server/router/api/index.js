require("dotenv").config();

const express = require("express");
const model = require("../../model");
const passport = require("../../passport");
const bcrypt = require("../../bcrypt");
const router = express.Router();
const User = model.User;
const Auction = model.Auction;
const processErrors = model.processErrors;

const rejectMethod = (_req, res, _next) => {
  res.sendStatus(405);
};

router
  .route("/register")
  .post(async (req, res) => {
    try {
      const passwordHash = bcrypt.hash(req.body.password);
      const user = new User({
        username: req.body.username,
        password: passwordHash
      });
      const doc = await user.save();
      res.json(doc);
    } catch (err) {
      if (!req.body.password) {
        // Unprocessable Entity
        res.status(422).json({
          password: "Error – password must not be empty!"
        });
      } else if (err !== undefined) {
        res.status(422).json(processErrors(err));
      }
    }
  })
  .all(rejectMethod);

// function isLoggedIn (req, res, next) {
//   if (req.isAuthenticated()) {
//     return next();
//   }

//   res.redirect("/");

//   console.log("Authentication failed");
// }

router
  .route("/user-status")
  .get((req, res) => {
    if (req.isAuthenticated()) {
      res.json({
        isAuthenticated: true,
        user: req.user
      });
    } else {
      res.json({
        isAuthenticated: false,
        user: {}
      });
    }
  })
  .all(rejectMethod);

router
  .route("/login")
  .post(passport.authenticate("local"), async (req, res) => {
    res.status(200).send({ isAuthenticated: true, user: req.user });
  })
  .all(rejectMethod);

router
  .route("/logout")
  .get((req, res) => {
    console.log("beforeauth");
    if (req.isAuthenticated()) {
      req.logout();
      console.log("authenticated");
      res.send();
    }
  })
  .all(rejectMethod);

router
  .route("/auction")
  .post((req, res) => {
    Auction.findOne({ _id: req.body.index }, (err, doc) => {
      if (err) {
        res.json(err);
      } else {
        res.json({ auction: doc });
      }
    });
  })
  .all(rejectMethod);

router
  .route("/buy")
  .post((req, res) => {
    Auction.findOne({ _id: req.body.index }, (err, doc) => {
      if (err) {
        res.json(err);
      } else {
        doc.highest_bidder = req.user.username;
        doc.status = "SOLD";
        doc.save();
      }
    });
  })
  .all(rejectMethod);

router
  .route("/start")
  .post((req, res) => {
    Auction.findOne({ _id: req.body.index }, (err, doc) => {
      if (err) {
        res.json(err);
      } else {
        doc.status = "BID";
        doc.save();
      }
    });
  })
  .all(rejectMethod);

router
  .route("/edit")
  .post((req, res) => {
    Auction.findOne({ _id: req.body._id }, (err, doc) => {
      if (err) {
        res.json(err);
      } else {
        doc.name = req.body.name;
        doc.price = req.body.price;
        doc.type = req.body.type;
        doc.save();
      }
    });
  })
  .all(rejectMethod);

router
  .route("/")
  .get((req, res) => {
    if (req.isAuthenticated()) { res.send("Home page"); } else { res.redirect("/login"); }
  })
  .all(rejectMethod);

router
  .route("/create")
  .get((req, res) => {
    if (req.isAuthenticated()) {
      Auction.find({}, (err, doc) => {
        if (err) {
          res.json(err);
        } else {
          res.json(doc);
        }
      });
    } else {
      res.redirect("/login");
    }
  })
  .post((req, res) => {
    if (req.isAuthenticated()) {
      const auctionName = req.body.name;
      const auctionPrice = req.body.price;

      const auction = new Auction({
        username: req.user.username,
        status: req.body.status,
        type: req.body.type,
        name: auctionName,
        price: auctionPrice,
        bidders: []
      });

      try {
        auction.save();
      } catch {
        res.json("Couldn't save auction");
      }
      res.redirect("/auction/myauctions");
    } else {
      res.json("Must be authenticated");
    }
  })
  .all(rejectMethod);

router
  .route("/userauctions")
  .get((req, res) => {
    if (req.isAuthenticated()) {
      Auction.find({
        $or: [{ username: req.user.username, status: "NEW" },
          { username: req.user.username, status: "BID" }]
      }, (err, doc) => {
        if (err) {
          res.json(err);
        } else {
          res.json(doc);
        }
      });
    } else {
      res.redirect("/");
    }
  })
  .all(rejectMethod);

router
  .route("/userhistory")
  .get((req, res) => {
    if (req.isAuthenticated()) {
      Auction.find({
        $or: [{ username: req.user.username, status: "SOLD" },
          { bidders: req.user.username, status: "SOLD" }]
      }, (err, doc) => {
        if (err) {
          res.json(err);
        } else {
          res.json(doc);
        }
      });
    } else {
      res.redirect("/");
    }
  });

module.exports = router;
