const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const refundController = require("../controllers/refund.controller");

// Customer → refund request oluşturur
router.post("/", requireAuth, refundController.createRefundRequest);

// ✅ Customer → kendi refundlarını görür
router.get("/my", requireAuth, refundController.getMyRefundRequests);

// Sales Manager → tüm refund request'leri görür
router.get("/", requireAuth, refundController.getAllRefundRequests);

// Sales Manager → approve / reject
router.patch("/:id", requireAuth, refundController.updateRefundStatus);


module.exports = router;
