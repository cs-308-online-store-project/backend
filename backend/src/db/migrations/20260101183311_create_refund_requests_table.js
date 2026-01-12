exports.up = function (knex) {
  return knex.schema.createTable("refund_requests", (table) => {
    table.increments("id").primary();

    table.integer("user_id").notNullable();
    table.integer("order_id").notNullable();
    table.integer("order_item_id").notNullable();

    table.integer("quantity"); // optional
    table.text("reason").notNullable();

    table.enu("status", ["pending", "approved", "rejected"])
      .notNullable()
      .defaultTo("pending");
    table.decimal("refund_amount", 10, 2).notNullable();

    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());

    table.foreign("user_id").references("id").inTable("users").onDelete("CASCADE");
    table.foreign("order_id").references("id").inTable("orders").onDelete("CASCADE");
    table.foreign("order_item_id").references("id").inTable("order_items").onDelete("CASCADE");
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("refund_requests");
};
