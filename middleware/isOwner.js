// Express modules
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Offer = require("../models/Offer");

const isOwner = async (req, res, next) => {
  console.warn("🔹 isOwner?");
  try {
    const offerToVerify = await Offer.findById(req.params.id).populate("owner");
    if (offerToVerify.owner.id === req.user.id) {
      console.log("Is owner");
      next();
    } else {
      console.log("Is not owner");
      return res.status(401).json({ message: "Unauthorized: not owner" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = isOwner;
