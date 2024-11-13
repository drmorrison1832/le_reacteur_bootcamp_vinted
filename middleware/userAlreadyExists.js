const express = require("express");

// Mongo modules
const User = require("../models/User");

async function userAlreadyExists(req, res, next) {
  console.warn("🔹 userAlreadyExists?");
  try {
    if (
      (await User.exists({ email: req.body.email })) ||
      (await User.exists({ account: { username: req.body.username } }))
    ) {
      console.error("Yes");
      return res
        .status(400)
        .json({ message: "Mail or user already registered" });
    } else {
      console.log("No");
      return next();
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

module.exports = userAlreadyExists;
