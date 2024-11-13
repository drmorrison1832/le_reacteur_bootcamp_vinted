// const express = require("express");

// Express modules
const express = require("express");
const router = express.Router();
// router.use(express.json());
const User = require("../models/User");

// const showReq = require("../utils/showReq");

const isAuthenticated = async (req, res, next) => {
  console.warn("🔹 isAuthenticated?");
  if (!req.headers.authorization) {
    console.log("Niet");
    return res.status(401).json({ message: "Missing identification" });
  }
  const user = await User.findOne({
    token: req.headers.authorization.replace("Bearer ", ""),
  }).select("id email account");
  if (user) {
    console.log("User is", user.email);
    req.user = user;

    return next();
  } else {
    return res.status(401).json({ message: "User unknown" });
  }
};

module.exports = isAuthenticated;
