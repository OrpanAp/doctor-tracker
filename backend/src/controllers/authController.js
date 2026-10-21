const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

function cookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 8 * 60 * 60 * 1000,
    path: "/",
  };
}

async function login(req, res, next) {
  try {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const password = req.body.password;

    if (!email || typeof password !== "string" || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      { sub: user._id.toString(), role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "8h" },
    );

    res.cookie("token", token, cookieOptions());

    return res.json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
}

function logout(req, res) {
  const isProduction = process.env.NODE_ENV === "production";

  res.clearCookie("token", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
  });

  res.json({ success: true, message: "Logged out successfully" });
}

async function getMe(req, res, next) {
  try {
    const user = await User.findById(req.user.sub).select("name email role");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists",
      });
    }

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
}

module.exports = { login, logout, getMe };
