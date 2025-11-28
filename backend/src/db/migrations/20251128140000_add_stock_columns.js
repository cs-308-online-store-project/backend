// src/db/migrations/20251128140000_add_stock_columns.js

exports.up = async function (knex) {
    // 1) stock kolonunu ekle
    await knex.schema.alterTable('products', (t) => {
      t.integer('stock').notNullable().defaultTo(0);
    });
  
    // 2) Eski quantity_in_stock değerlerini yeni stock kolonuna taşı
    await knex('products').update('stock', knex.ref('quantity_in_stock'));
  
    // 3) İstersen eski kolonu düşürebilirsin (confuse olmasın diye tavsiye ederim)
    await knex.schema.alterTable('products', (t) => {
      t.dropColumn('quantity_in_stock');
    });
  
// 4) in_stock computed column (PostgreSQL)
await knex.schema.raw(
    'ALTER TABLE products ADD COLUMN in_stock boolean GENERATED ALWAYS AS (stock > 0) STORED;'
  );  
  };
  
  exports.down = async function (knex) {
    // rollback için: in_stock ve stock’u kaldır, eski quantity_in_stock’u geri ekle
    await knex.schema.raw('ALTER TABLE products DROP COLUMN in_stock;');
  
    await knex.schema.alterTable('products', (t) => {
      t.dropColumn('stock');
      t.integer('quantity_in_stock').defaultTo(0);
    });
  };
  