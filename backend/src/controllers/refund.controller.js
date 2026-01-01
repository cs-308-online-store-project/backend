const knex = require("../db/knex");
const { sendRefundApprovedEmail } = require("../services/refundMail.service");

/**
 * ===============================
 * CUSTOMER: CREATE REFUND REQUEST
 * ===============================
 * POST /api/refunds
 */
exports.createRefundRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId, orderItemId, reason, quantity } = req.body;

    if (!orderId || !orderItemId || !reason) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // 1️⃣ Order user'a ait mi + delivered mı?
    const order = await knex("orders")
      .where({ id: orderId, user_id: userId })
      .first();

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.status !== "delivered") {
      return res.status(400).json({ error: "Order not delivered" });
    }

    // 2️⃣ 30 gün kontrolü
    const createdAt = order.created_at;
    const diffDays =
      (Date.now() - new Date(createdAt).getTime()) /
      (1000 * 60 * 60 * 24);

    if (diffDays > 30) {
      return res.status(400).json({ error: "Refund window expired" });
    }

    // 3️⃣ Order item bu order'a ait mi?
    const item = await knex("order_items")
      .where({ id: orderItemId, order_id: orderId })
      .first();

    if (!item) {
      return res.status(404).json({ error: "Order item not found" });
    }

    if (quantity && quantity > item.quantity) {
      return res.status(400).json({ error: "Invalid quantity" });
    }
// 4️⃣ Refund amount hesapla (price × quantity)
const refundQty = quantity ?? item.quantity;
const refundAmount = Number(item.price) * Number(refundQty);

// 5️⃣ Refund kaydı oluştur
const [refund] = await knex("refund_requests")
  .insert({
    user_id: userId,
    order_id: orderId,
    order_item_id: orderItemId,
    quantity: refundQty,
    reason,
    refund_amount: refundAmount,
    status: "pending",
  })
  .returning("*");


    return res.json({ success: true, data: refund });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};

/**
 * ===================================
 * CUSTOMER: VIEW MY REFUND REQUESTS
 * ===================================
 * GET /api/refunds/my
 */
exports.getMyRefundRequests = async (req, res) => {
  try {
    const userId = req.user.id;

    const refunds = await knex("refund_requests")
      .where({ user_id: userId })
      .select(
        "id",
        "order_id",
        "order_item_id",
        "status",
        "reason",
        "quantity",
        "refund_amount",
        "created_at"
      )
      .orderBy("created_at", "desc");

    return res.json({ data: refunds });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};

/**
 * ===================================
 * SALES MANAGER: VIEW ALL REFUND REQUESTS
 * ===================================
 * GET /api/refunds
 */
exports.getAllRefundRequests = async (req, res) => {
  try {
    if (req.user.role !== "sales_manager") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const refunds = await knex("refund_requests")
      .join("users", "refund_requests.user_id", "users.id")
      .join("order_items", "refund_requests.order_item_id", "order_items.id")
      .select(
        "refund_requests.id",
        "refund_requests.reason",
        "refund_requests.status",
        "refund_requests.created_at",
        "users.email as customer_email",
        "order_items.product_id",
        "refund_requests.quantity",
        "refund_requests.refund_amount"
      )
      .orderBy("refund_requests.created_at", "desc");

    return res.json({ data: refunds });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};

/**
 * ===================================
 * SALES MANAGER: APPROVE / REJECT REFUND
 * ===================================
 * PATCH /api/refunds/:id
 */
exports.updateRefundStatus = async (req, res) => {
  try {
    if (req.user.role !== "sales_manager") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const refund = await knex("refund_requests")
      .where({ id })
      .first();

    if (!refund) {
      return res.status(404).json({ error: "Refund not found" });
    }

    // Status update
    await knex("refund_requests")
      .where({ id })
      .update({ status });

    // ======================
    // APPROVED FLOW
    // ======================
    if (status === "approved") {
      const orderItem = await knex("order_items")
        .where({ id: refund.order_item_id })
        .first();

      if (orderItem) {
        const refundQty = refund.quantity || 1;
        const refundAmount = refundQty * orderItem.price;


        // ➕ stock geri ekle
        await knex("products")
          .where({ id: orderItem.product_id })
          .increment("stock", refundQty);

        // ➕ refund amount kaydet
        await knex("refund_requests")
          .where({ id })
          .update({ refund_amount: refundAmount });

       await knex("notifications").insert({
  user_id: refund.user_id,
  type: "refund", // 🔥 ZORUNLU
  title: "Refund Approved",
  message: `Your refund of $${refundAmount.toFixed(2)} has been approved and returned to your account.`
});


        // 📧 email
        const user = await knex("users")
          .where({ id: refund.user_id })
          .first();

        if (user?.email) {
          await sendRefundApprovedEmail({
            to: user.email,
            amount: refundAmount,
          });
        }
      }
    }

    // ======================
    // REJECTED FLOW
    // ======================
    if (status === "rejected") {
     await knex("notifications").insert({
  user_id: refund.user_id,
  type: "refund",
  title: "Refund Rejected",
  message: "Your refund request has been rejected by the sales manager."
});

    }

    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};
