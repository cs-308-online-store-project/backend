// backend/tests/order.test.js
// Integration tests for creating orders from cart (SCRUM-21).
// Assumes DB schema from init_schema migration (users, carts, cart_items, orders, order_items, products).

const request = require('supertest');
const app = require('../server');
const knex = require('../src/db/knex');

describe('Order API Tests (SCRUM-21)', () => {
  const TEST_USER_ID = 777777; // explicit to satisfy FK (users.id)

  let testCategoryId;
  let testProduct;      // { id, quantity_in_stock, price, ... }
  let createdOrderId;

  // Helper: ensure a test user exists to satisfy carts.user_id FK
  const ensureTestUser = async (id) => {
    const exists = await knex('users').where({ id }).first();
    if (!exists) {
      await knex('users').insert({
        id, // explicit set is fine for tests on PG
        name: 'Test User',
        tax_id: 'TST-000',
        email: `test${id}@example.com`,
        password: 'dummy-hash',
        address: 'Test Address',
        role: 'customer',
      });
    }
  };

  beforeAll(async () => {
    // Clean related tables in safe FK order
    await knex('order_items').del();
    await knex('orders').del();
    await knex('cart_items').del();
    await knex('carts').where({ user_id: TEST_USER_ID }).del();

    // Ensure the FK parent exists (users.id)
    await ensureTestUser(TEST_USER_ID);

    // Seed a category
    const [category] = await knex('categories')
      .insert({ name: 'Order Test Category', description: 'For order tests' })
      .returning('*');
    testCategoryId = category.id;

    // Seed a product (stock: 10, price: 50.00)
    const [product] = await knex('products')
      .insert({
        name: 'Order Test Product',
        model: 'OTP-1',
        serial_number: 'OTP-123456',
        description: 'Order test product',
        quantity_in_stock: 10,
        price: 50.00,
        warranty_status: false,
        distributor: 'Test Dist',
        category_id: testCategoryId,
      })
      .returning('*');

    testProduct = product;
  });

  afterAll(async () => {
    try {
      // Remove created order + items (if any)
      if (createdOrderId) {
        await knex('order_items').where({ order_id: createdOrderId }).del();
        await knex('orders').where({ id: createdOrderId }).del();
      }

      // Clear cart data for the test user
      const userCart = await knex('carts').where({ user_id: TEST_USER_ID }).first();
      if (userCart) await knex('cart_items').where({ cart_id: userCart.id }).del();
      await knex('carts').where({ user_id: TEST_USER_ID }).del();

      // Remove seeded product & category
      if (testProduct?.id) await knex('products').where('id', testProduct.id).del();
      if (testCategoryId) await knex('categories').where('id', testCategoryId).del();

      // Finally, remove the test user (FKs already cleared)
      await knex('users').where({ id: TEST_USER_ID }).del();
    } finally {
      await knex.destroy();
    }
  });

  // TEST 1: Empty cart should return 400
  test('POST /api/orders - empty cart -> 400 + {success:false}', async () => {
    // Ensure the user exists, but clear only cart data
    const userCart = await knex('carts').where({ user_id: TEST_USER_ID }).first();
    if (userCart) await knex('cart_items').where({ cart_id: userCart.id }).del();
    await knex('carts').where({ user_id: TEST_USER_ID }).del();

    const res = await request(app)
      .post('/api/orders')
      .send({ userId: TEST_USER_ID, address: 'Test Address' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(typeof res.body.error).toBe('string');
  });

  // TEST 2: Create order from cart (2 items -> total=100, status=processing)
  test('POST /api/orders - creates order from cart -> 201 + {success:true}', async () => {
    // Create a cart for the user if not exists
    let cart = await knex('carts').where({ user_id: TEST_USER_ID }).first();
    if (!cart) {
      [cart] = await knex('carts').insert({ user_id: TEST_USER_ID }).returning('*');
    }

    // Add item to cart_items (quantity 2)
    await knex('cart_items').insert({
      cart_id: cart.id,
      product_id: testProduct.id,
      quantity: 2,
    });

    const res = await request(app)
      .post('/api/orders')
      .send({ userId: TEST_USER_ID, address: 'Test Address' });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    createdOrderId = res.body.data.id;

    if (res.body.data.status) {
      expect(res.body.data.status).toBe('processing');
    }
  });

  // TEST 3: Stock should decrease (10 -> 8)
  test('Stock should decrease after creating order', async () => {
    const p = await knex('products').where('id', testProduct.id).first();
    // Some drivers return numeric as string; cast to Number before compare
    expect(Number(p.quantity_in_stock)).toBe(8);
  });

  // TEST 4: Cart must be cleared after the order is created
  test('Cart should be cleared after order', async () => {
    const userCart = await knex('carts').where({ user_id: TEST_USER_ID }).first();
    if (!userCart) {
      // If controller deleted the cart entirely, that still counts as cleared
      expect(true).toBe(true);
      return;
    }
    const items = await knex('cart_items').where({ cart_id: userCart.id });
    expect(items.length).toBe(0);
  });

  // TEST 5 (optional): Order items must be persisted
  test('Order items should be persisted (optional)', async () => {
    const items = await knex('order_items').where({ order_id: createdOrderId });
    expect(items.length).toBeGreaterThan(0);
    expect(Number(items[0].quantity)).toBe(2);
    expect(items[0].product_id).toBe(testProduct.id);
  });
});
