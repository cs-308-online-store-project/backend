const express = require("express");
const router = express.Router();
const reportController = require("../controllers/report.controller");
const { requireAuth, requireRole } = require("../middleware/auth");

router.get(
  "/sales",
  requireAuth,
  requireRole("sales_manager"),
  reportController.salesReport
);

module.exports = router;