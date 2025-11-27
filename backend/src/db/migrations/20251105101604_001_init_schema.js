/**
 * Initial migration for Online Store Project (CS308)
 * Defines all 10 core tables: users, categories, products, carts, cart_items,
 * orders, order_items, reviews, wishlists, wishlist_items, refunds.
 */

exports.up = async function (knex) {
  // === USERS ===
  await knex.schema.createTable('users', (t) => {
    t.increments('id').primary();
    t.string('name').notNullable();
    t.string('tax_id');
    t.string('email').unique().notNullable();
    t.string('password').notNullable();
    t.text('address');
    t.string('role').notNullable(); // customer, sales_manager, product_manager, support_agent
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // === CATEGORIES ===
  await knex.schema.createTable('categories', (t) => {
    t.increments('id').primary();
    t.string('name').notNullable();
    t.text('description');
  });

  // === PRODUCTS ===
  await knex.schema.createTable('products', (t) => {
    t.increments('id').primary();
    t.string('name').notNullable();
    t.string('model');
    t.string('serial_number').unique();
    t.text('description');
    t.integer('quantity_in_stock').defaultTo(0);
    t.decimal('price', 10, 2).notNullable();
    t.boolean('warranty_status').defaultTo(false);
    t.string('distributor');
    t
      .string('image_url')
      .notNullable()
      .defaultTo('https://placehold.co/600x800?text=Product');
    t
      .integer('category_id')
      .unsigned()
      .references('id')
      .inTable('categories')
      .onDelete('SET NULL');
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // === CARTS ===
  await knex.schema.createTable('carts', (t) => {
    t.increments('id').primary();
    t
      .integer('user_id')
      .unsigned()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // === CART ITEMS ===
  await knex.schema.createTable('cart_items', (t) => {
    t.increments('id').primary();
    t
      .integer('cart_id')
      .unsigned()
      .references('id')
      .inTable('carts')
      .onDelete('CASCADE');
    t
      .integer('product_id')
      .unsigned()
      .references('id')
      .inTable('products')
      .onDelete('CASCADE');
    t.integer('quantity').defaultTo(1);
    t.unique(['cart_id', 'product_id']);
  });

  // === ORDERS ===
  await knex.schema.createTable('orders', (t) => {
    t.increments('id').primary();
    t
      .integer('user_id')
      .unsigned()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    t.decimal('total_price', 10, 2);
    t
      .enu('status', [
        'processing',
        'in_transit',
        'delivered',
        'cancelled',
        'refunded',
      ])
      .defaultTo('processing');
    t.text('address');
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // === ORDER ITEMS ===
  await knex.schema.createTable('order_items', (t) => {
    t.increments('id').primary();
    t
      .integer('order_id')
      .unsigned()
      .references('id')
      .inTable('orders')
      .onDelete('CASCADE');
    t
      .integer('product_id')
      .unsigned()
      .references('id')
      .inTable('products')
      .onDelete('CASCADE');
    t.integer('quantity').notNullable();
    t.decimal('price', 10, 2).notNullable();
  });

  // === REVIEWS ===
  await knex.schema.createTable('reviews', (t) => {
    t.increments('id').primary();
    t
      .integer('product_id')
      .unsigned()
      .references('id')
      .inTable('products')
      .onDelete('CASCADE');
    t
      .integer('user_id')
      .unsigned()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    t.integer('rating').checkBetween([1, 5]);
    t.text('comment');
    t.boolean('approved').defaultTo(false);
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // === WISHLISTS ===
  await knex.schema.createTable('wishlists', (t) => {
    t.increments('id').primary();
    t
      .integer('user_id')
      .unsigned()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // === WISHLIST ITEMS ===
  await knex.schema.createTable('wishlist_items', (t) => {
    t.increments('id').primary();
    t
      .integer('wishlist_id')
      .unsigned()
      .references('id')
      .inTable('wishlists')
      .onDelete('CASCADE');
    t
      .integer('product_id')
      .unsigned()
      .references('id')
      .inTable('products')
      .onDelete('CASCADE');
    t.unique(['wishlist_id', 'product_id']);
  });

  // === REFUNDS ===
  await knex.schema.createTable('refunds', (t) => {
    t.increments('id').primary();
    t
      .integer('order_id')
      .unsigned()
      .references('id')
      .inTable('orders')
      .onDelete('CASCADE');
    t
      .integer('user_id')
      .unsigned()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    t
      .integer('product_id')
      .unsigned()
      .references('id')
      .inTable('products')
      .onDelete('CASCADE');
    t
      .enu('status', ['pending', 'approved', 'rejected'])
      .defaultTo('pending');
    t.decimal('refunded_amount', 10, 2);
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.timestamp('approved_at');
  });
};

exports.down = async function (knex) {
  await knex.schema
    .dropTableIfExists('refunds')
    .dropTableIfExists('wishlist_items')
    .dropTableIfExists('wishlists')
    .dropTableIfExists('reviews')
    .dropTableIfExists('order_items')
    .dropTableIfExists('orders')
    .dropTableIfExists('cart_items')
    .dropTableIfExists('carts')
    .dropTableIfExists('products')
    .dropTableIfExists('categories')
    .dropTableIfExists('users');
};
