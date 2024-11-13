// Encoding mudules
/* const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64"); */

// Express modules
const express = require("express");
const router = express.Router();
router.use(express.json());
const User = require("../models/User");
const Offer = require("../models/Offer");

// FileUpload
const fileUpload = require("express-fileupload");

// Cloudinary
const cloudinary = require("cloudinary").v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Mongo modules
const mongoose = require("mongoose");

// Auxiliary functions & middleware
const showReq = require("../middleware/showReq");
const convertToBase64 = require("../utils/convertToBase64");
const isAuthenticated = require("../middleware/isAuthenticated");
const isOwner = require("../middleware/isOwner");
const correctOfferID = require("../middleware/correctOfferID");

// ————————————————————————————————————————————————————————————————————————————

// SEARCH OFFERS ===> IL MANQUE STRUCTURER LA RÉPONSE
router.get("/offers", showReq, async (req, res) => {
  try {
    // Assign quary variables values

    const limit = req.query.results || 5;
    const page = req.query.page || 1;
    const skip = limit * (page - 1);
    const priceMin = req.query.priceMin || 0;
    const priceMax = req.query.priceMax || 99999;

    let sort = undefined;
    switch (req.query.sort) {
      case "price-desc":
        sort = { product_price: -1 };
        break;
      case "price-asc":
        sort = { product_price: 1 };
        break;
      default:
        sort = undefined;
        break;
    }

    let title = new RegExp();
    req.query.title ? (title = new RegExp(req.query.title, "i")) : null;
    const filter = {};
    filter.product_name = title;
    filter.product_price = { $gte: priceMin, $lte: priceMax };
    console.log(filter);

    const searchResult = await Offer.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select("product_name product_price -_id");

    res.status(200).json({ searchResult });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUBLISH OFFER
router.post(
  "/offers/publish",
  fileUpload(),
  isAuthenticated,
  showReq,
  async (req, res) => {
    console.warn("🔸 post:/offer/publish");

    const { title, description, price, condition, city, brand, size, color } =
      req.body;

    let uploadResult = {};

    try {
      const newOffer = new Offer({
        product_name: title,
        product_description: description,
        product_price: price,
        product_details: [
          { brand: brand },
          { size: size },
          { condition: condition },
          { color: color },
          { city: city },
        ],

        owner: req.user.id,
      });

      // Ajout de l'image
      if (req.files) {
        const picture = convertToBase64(req.files.picture);
        uploadResult = await cloudinary.uploader.upload(picture, {
          public_id: `vinted/offers/${newOffer.id}`,
          asset_folder: "vinted_backend/offers",
        });
        newOffer.product_image = {
          url: uploadResult.url,
          public_id: uploadResult.public_id,
        };
      }

      const user = await User.findById(req.user.id);

      const response = {
        _id: newOffer.id,
        product_name: newOffer.product_name,
        product_description: newOffer.product_description,
        product_price: newOffer.product_price,
        product_details: [
          {
            MARQUE: newOffer.product_details[0].brand,
          },
          {
            TAILLE: newOffer.product_details[1].size,
          },
          {
            ÉTAT: newOffer.product_details[2].condition,
          },
          {
            COULEUR: newOffer.product_details[3].color,
          },
          {
            EMPLACEMENT: newOffer.product_details[4].city,
          },
        ],
        owner: {
          account: {
            username: req.user.account.username,
            avatar: req.user.account.avatar,
          },
          id: req.user.id,
        },
        product_image: {
          // ...
          // informations sur l'image du produit
          secure_url:
            "https://res.cloudinary.com/lereacteur-apollo/image/upload/v1602856743/api/vinted/offers/5f89a72435e128e99550837e/preview.jpg",
          // ...
        },
      };

      await newOffer.save();

      res.status(200).json(await response);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
);

// EDIT OFFER
router.put(
  "/offers/update/:id",
  fileUpload(),
  isAuthenticated,
  correctOfferID,
  isOwner,
  showReq,
  async (req, res) => {
    let uploadResult = {};

    try {
      const offerToUpdate = await Offer.findById(req.params.id);

      offerToUpdate.product_name = req.body.title || offerToUpdate.product_name;
      offerToUpdate.product_description =
        req.body.description || offerToUpdate.product_description;
      offerToUpdate.product_price =
        req.body.price || offerToUpdate.product_price;

      req.body.brand
        ? (offerToUpdate.product_details[0] = { brand: req.body.brand })
        : offerToUpdate.product_details[0];

      req.body.size
        ? (offerToUpdate.product_details[1] = { size: req.body.size })
        : offerToUpdate.product_details[1];

      req.body.condition
        ? (offerToUpdate.product_details[2] = { condition: req.body.condition })
        : offerToUpdate.product_details[2];

      req.body.color
        ? (offerToUpdate.product_details[3] = { color: req.body.color })
        : offerToUpdate.product_details[3];

      req.body.city
        ? (offerToUpdate.product_details[4] = { city: req.body.city })
        : offerToUpdate.product_details[4];

      // Image update
      if (req.files) {
        //Destroy previos image
        if (offerToUpdate.product_image) {
          await cloudinary.uploader.destroy(
            offerToUpdate.product_image.public_id
          );
          console.log("Picture deleted.");
        }
        // Upload new image
        const picture = convertToBase64(req.files.picture);
        uploadResult = await cloudinary.uploader.upload(picture, {
          public_id: `vinted/offers/${offerToUpdate.id}`,
          asset_folder: "vinted_backend/offers",
        });
        offerToUpdate.product_image = {
          url: uploadResult.url,
          public_id: uploadResult.public_id,
        };
        console.log("Picture uploaded.");
      }

      await offerToUpdate.save();

      res.status(200).json(offerToUpdate);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
);

// DELETE OFFER ===> IL MANQUE STRUCTURER LA RÉPONSE
router.delete(
  "/offers/delete/:id",
  fileUpload(),
  isAuthenticated,
  correctOfferID,
  isOwner,
  showReq,
  async (req, res) => {
    try {
      const offerToDelete = await Offer.findOneAndDelete({
        _id: req.params.id,
      });

      //Destroy image
      if (offerToDelete.product_image) {
        await cloudinary.uploader.destroy(
          offerToDelete.product_image.public_id
        );
        console.log("Picture deleted.");
      }

      res
        .status(200)
        .json({ message: `${offerToDelete.product_name} deleted.` });
    } catch (error) {
      res.status(500).json({ meessage: error.message });
    }
  }
);

// See offer by ID
router.get("/offers/:id", showReq, correctOfferID, async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    return res.status(200).json(offer);
  } catch (error) {
    return res.status(500).json({ message: "error.message" });
  }
});

module.exports = router;
