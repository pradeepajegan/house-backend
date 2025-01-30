const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const app = express();
app.use(express.json());
app.use(cors());
const MONGO_URI = "mongodb+srv://pradeepa-1204:pradeepa1204@cluster0.c1hoy.mongodb.net/houseRentDB?retryWrites=true&w=majority";
const JWT_SECRET = "secret_key";
const PORT = process.env.PORT || 5000;
mongoose
  .connect(MONGO_URI, { useUnifiedTopology: true })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB connection error:", err));
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});
const User = mongoose.model("User", userSchema);
const propertySchema = new mongoose.Schema({
  owner: { type: String, required: true },
  price: { type: Number, required: true },
  contact: { type: String, required: true },
  status: { type: String, enum: ["Sale", "Rent", "Sold"], required: true },
  image: { type: String, required: true },
});
const Property = mongoose.model("Property", propertySchema);
const scheduleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  houseName: { type: String, required: true },
  contact: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  location: { type: String, required: true },
});
const Schedule = mongoose.model("Schedule", scheduleSchema);
const authMiddleware = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided" });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
app.post("/api/signup", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and Password are required" });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ username, password: hashedPassword });

    res.status(201).json({ message: "Signup successful", user: newUser });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and Password are required" });
    }

    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid Credentials" });
    }

    const token = jwt.sign({ userId: user._id, username: user.username }, JWT_SECRET, { expiresIn: "1h" });

    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});
app.post("/api/properties", authMiddleware, async (req, res) => {
  try {
    const { owner, price, contact, status, image } = req.body;
    if (!owner || !price || !contact || !status || !image) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const newProperty = await Property.create({ owner, price, contact, status, image });
    res.status(201).json({ message: "Property added successfully", property: newProperty });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});
app.get("/api/properties", async (req, res) => {
  try {
    const properties = await Property.find();
    res.status(200).json(properties);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});
app.post("/api/schedules", async (req, res) => {
  try {
    const { name, houseName, contact, date, time, location } = req.body;
    if (!name || !houseName || !contact || !date || !time || !location) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const newSchedule = await Schedule.create({ name, houseName, contact, date, time, location });
    res.status(201).json({ message: "Visit scheduled successfully", schedule: newSchedule });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});
app.get("/api/schedules", async (req, res) => {
  try {
    const schedules = await Schedule.find();
    res.status(200).json(schedules);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
