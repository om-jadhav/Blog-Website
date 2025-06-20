const { Router } = require('express');
const User = require('../models/user');
const router = Router();

// GET: Signin page
router.get('/signin', (req, res) => {
    return res.render("signin", { error: null });  // ✅ Always pass error
});

// GET: Signup page
router.get('/signup', (req, res) => {
    return res.render("signup", { error: null });  // ✅ Always pass error
});

// POST: Signin logic
router.post("/signin", async (req, res) => {
    const { email, Password } = req.body;
    try {
        const token = await User.matchPasswordAndGenerateToken(email, Password);
        return res.cookie("token", token).redirect("/");
    } catch (error) {
        console.error("Signin Error:", error.message);
        return res.render("signin", {
            error: "Incorrect Email or Password"  // ✅ Friendly error
        });
    }
});

// POST: Signup logic
router.post('/signup', async (req, res) => {
    const { fullName, email, Password } = req.body;

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.render("signup", {
                error: "Email already in use"  // ✅ Prevent duplicate
            });
        }

        // Create new user
        await User.create({ fullName, email, Password });

        return res.redirect("/user/signin"); // Redirect to login after signup
    } catch (error) {
        console.error("Signup Error:", error.message);

        // Handle duplicate key error just in case
        if (error.code === 11000) {
            return res.render("signup", {
                error: "Email already exists"
            });
        }

        return res.render("signup", {
            error: "Something went wrong. Please try again."
        });
    }
});

// GET: Logout
router.get('/logout', (req, res) => {
    res.clearCookie('token').redirect("/");
});

module.exports = router;
