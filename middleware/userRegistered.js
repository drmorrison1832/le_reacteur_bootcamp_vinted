const express = require("express");

// Mongo modules
const User = require("../models/User");

async function userRegistered(req, res, next) {
  console.warn("🔹 userRegistered?");
  try {
    if (
      (await User.exists({ email: req.body.email })) ||
      (await User.exists({ account: { username: req.body.username } }))
    ) {
      console.log("Yes");
      return next();
    } else {
      console.error("No");
      return res.status(400).json({
        message:
          "Wrong email or password (well, actually it's wrong email, but — shush).",
      });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

module.exports = userRegistered;
