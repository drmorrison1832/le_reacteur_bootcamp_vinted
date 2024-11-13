const express = require("express");

// Mongo modules
const mongoose = require("mongoose");
const Offer = require("../models/Offer");

async function correctOfferID(req, res, next) {
  console.warn("🔹 offerExists?");
  try {
    if (!req.params.id) {
      console.error("Error: missing ID");
      return res.status(400).json({ message: "Missing ID" });
    } else if (mongoose.isValidObjectId(req.params.id) === false) {
      console.error("Error: invalid ID");
      return res.status(400).json({ message: "Invalid ID format" });
    } else if (!(await Offer.findById(req.params.id))) {
      console.error("Error: offer not found");
      return res.status(400).json({ message: "Offer not found" });
    } else {
      console.log("Yes");
      next();
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

module.exports = correctOfferID;
