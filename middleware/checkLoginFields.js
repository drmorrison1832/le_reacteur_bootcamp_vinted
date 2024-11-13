const express = require("express");

function checkLoginFields(req, res, next) {
  console.warn("🔹 checkLoginFields...");
  try {
    if (!req.body.email || !req.body.username || !req.body.password) {
      console.error("Missing email, username or password");
      return res
        .status(400)
        .json({ message: "Missing email, username or password" });
    } else {
      console.log("Everything is there");
    }
    next();
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}
module.exports = checkLoginFields;
