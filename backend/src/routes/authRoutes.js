const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

/* ------------ REGISTER ------------ */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, tax_id, address, role } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email ve password zorunlu" });
    }

    const { rows: exist } = await pool.query(
      "SELECT id FROM users WHERE email=$1 LIMIT 1",
      [email]
    );
    if (exist.length) return res.status(409).json({ message: "Email already exists" });

    const hash = await bcrypt.hash(String(password), 10);

    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password, tax_id, address, role)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6,'user'))
       RETURNING id, name, email, role`,
      [name, email, hash, tax_id || null, address || null, role || null]
    );

    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error("REGISTER ERR:", err);
    if (err.code === "23505") return res.status(409).json({ message: "Email already exists" });
    return res.status(500).json({ message: "Register failed" });
  }
});

/* -------------- LOGIN ------------- */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const { rows } = await pool.query(
      `SELECT id, name, email, role, password FROM users WHERE email=$1 LIMIT 1`,
      [email]
    );
    const user = rows[0];
    if (!user || !user.password) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(String(password), String(user.password));
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role || "user" },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES || "24h" }
    );

    return res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role || "user" }
    });
  } catch (err) {
    console.error("LOGIN ERR:", err);
    return res.status(500).json({ message: "Login failed" });
  }
});

/* --------------- ME --------------- */
router.get("/me", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id || req.user.sub;
    const { rows } = await pool.query(
      "SELECT id, name, email, role FROM users WHERE id=$1",
      [userId]
    );
    if (!rows[0]) return res.status(404).json({ message: "User not found" });
    return res.json(rows[0]);
  } catch (err) {
    console.error("ME ERR:", err);
    return res.status(500).json({ message: "Profile fetch failed" });
  }
});

module.exports = router;