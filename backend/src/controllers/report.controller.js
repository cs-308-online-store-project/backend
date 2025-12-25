const knex = require("../db/knex");

exports.salesReport = async (req, res) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) return res.status(400).json({ message: "start & end required" });

    // revenue & cost item bazlı
    const rows = await knex("order_items as oi")
      .join("orders as o", "oi.order_id", "o.id")
      .join("products as p", "oi.product_id", "p.id")
      .whereBetween("o.created_at", [new Date(start), new Date(end)])
      .select(
        "o.created_at",
        "oi.quantity",
        "oi.price",
        "p.cost"
      );

    let revenue = 0;
    let cost = 0;

    const daily = {}; // yyyy-mm-dd => { revenue, profit }

    for (const r of rows) {
      const qty = Number(r.quantity);
      const saleUnit = Number(r.price);
      const day = new Date(r.created_at).toISOString().slice(0, 10);

      const itemRevenue = saleUnit * qty;
      const unitCost = r.cost != null ? Number(r.cost) : saleUnit * 0.5; // default %50
      const itemCost = unitCost * qty;

      revenue += itemRevenue;
      cost += itemCost;

      if (!daily[day]) daily[day] = { revenue: 0, profit: 0 };
      daily[day].revenue += itemRevenue;
      daily[day].profit += (itemRevenue - itemCost);
    }

    const profit = revenue - cost;

    res.json({
      success: true,
      totals: { revenue: Number(revenue.toFixed(2)), cost: Number(cost.toFixed(2)), profit: Number(profit.toFixed(2)) },
      series: Object.entries(daily)
        .sort(([a],[b]) => a.localeCompare(b))
        .map(([date, v]) => ({ date, revenue: Number(v.revenue.toFixed(2)), profit: Number(v.profit.toFixed(2)) })),
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
