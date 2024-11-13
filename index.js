require("dotenv").config();

const cors = require("cors");

// Mongoose
const mongoose = require("mongoose");
mongoose.connect(process.env.MONGODB_URI);

// Middleware
const showReq = require("./middleware/showReq");

// Express
const express = require("express");
const app = express();
app.use(cors());
app.use(express.json());
const userRoutes = require("./routes/userRoutes");
app.use(userRoutes);
const offerRoutes = require("./routes/offerRoutes");
app.use(offerRoutes);

app.get("/", showReq, async (req, res) => {
  res.status(200).json({ message: "All good." });
});

app.get("*", showReq, (req, res) => {
  // console.warn('🔸 GET "*"');
  try {
    res
      .status(404)
      .sendFile(
        "/Users/fmorri/Developpeur/Le-Reacteur/Backend/vinted/images/peugeot_404.jpg"
      );
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.listen(process.env.PORT, () => {
  console.warn("🔶 Server «Vinted» started");
});
