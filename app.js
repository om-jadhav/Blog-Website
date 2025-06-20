require('dotenv').config();
const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");

const Blog = require('./models/blog');
const userRoute = require('./routes/user');
const blogRoute = require('./routes/blog');
const { checkForAuthenticationCookie } = require("./middlewares/authentication");

const app = express();
const PORT = process.env.PORT || 7000;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB connected"))
.catch(err => {
  console.error("❌ MongoDB connection error:", err.message);
  process.exit(1); // Optional: exit if DB fails
});

// View engine setup
app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(checkForAuthenticationCookie('token'));

// Routes
app.get('/', async (req, res) => {
  try {
    const allBlogs = await Blog.find({});
    res.render("home.ejs", {
      user: req.user,
      blogs: allBlogs,
    });
  } catch (err) {
    console.error("Failed to fetch blogs:", err);
    res.status(500).send("Server Error");
  }
});

app.use("/user", userRoute);
app.use("/blog", blogRoute);

// Start server (only once, after everything is set up)
app.listen(PORT, () => {
  console.log(`🚀 Server started on port ${PORT}`);
});
