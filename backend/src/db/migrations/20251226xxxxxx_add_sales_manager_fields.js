exports.up = async function (knex) {
  await knex.schema.alterTable("products", (t) => {
    t.decimal("list_price", 10, 2).nullable();        // discount öncesi fiyatı saklamak için
    t.integer("discount_rate").notNullable().defaultTo(0); // 0-100
    t.decimal("cost", 10, 2).nullable();              // PM belirlerse; yoksa default %50
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable("products", (t) => {
    t.dropColumn("cost");
    t.dropColumn("discount_rate");
    t.dropColumn("list_price");
  });
};