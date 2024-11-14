// Encoding mudules
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");

// Express modules
const express = require("express");
const router = express.Router();
// router.use(express.json());

// FileUpload
const fileUpload = require("express-fileupload");

// Cloudinary
const cloudinary = require("cloudinary").v2; // On n'oublie pas le `.v2` à la fin
cloudinary.config({
  cloud_name: "dig08y2ym",
  api_key: "177837747951112",
  api_secret: "AIYd-mYtfK7dyKdUr7B-K6D0R9Q",
});

// Mongo modules
const User = require("../models/User");

// Auxiliary functions & middleware
const showReq = require("../middleware/showReq");
const convertToBase64 = require("../utils/convertToBase64");

// router.use(showReq);
const checkLoginFields = require("../middleware/checkLoginFields");

const userAlreadyExists = require("../middleware/userAlreadyExists");
const userRegistered = require("../middleware/userRegistered");

// SIGN UP
router.post(
  "/user/signup",
  fileUpload(),
  showReq,
  checkLoginFields,
  userAlreadyExists,
  async (req, res) => {
    console.warn("🔸 post:/user/signup");

    let uploadResult = {};

    try {
      const newSalt = uid2(16);
      const newUser = new User({
        email: req.body.email,
        account: {
          username: req.body.username,
          avatar: uploadResult.url,
        },
        newsletter: req.body.newsletter,
        token: uid2(16),
        hash: SHA256(req.body.password + newSalt).toString(encBase64),
        salt: newSalt,
      });

      // Add avatar

      if (req.files) {
        const avatar = convertToBase64(req.files.avatar);
        uploadResult = await cloudinary.uploader.upload(avatar, {
          public_id: `vinted/users/${newUser.id}`,
          asset_folder: "vinted_backend/users",
        });
        console.log("uploadResult is ", uploadResult);
        newUser.account.avatar = {
          url: uploadResult.url,
          public_id: uploadResult.public_id,
        };
      } else {
        uploadResult.url = "No avatar";
        console.error("Avatar not saved.");
      }

      newUser.save();

      return res.status(201).json({
        _id: newUser.id,
        token: newUser.token,
        account: {
          username: newUser.account.username,
        },
      });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
);

// LOGIN
router.post("/user/login", userRegistered, async (req, res) => {
  console.warn("🔸 post:/user/login");
  try {
    const user = await User.findOne({ email: req.body.email });
    const hash = user.hash;
    if (SHA256(req.body.password + user.salt).toString(encBase64) === hash) {
      res.status(200).json({
        _id: user.id,
        token: user.token,
        account: {
          username: user.account.username,
        },
      });
    } else {
      return res.status(400).json({
        message: "Wrong email or password (wrong password, but shush",
      });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
