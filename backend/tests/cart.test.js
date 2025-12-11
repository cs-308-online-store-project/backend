// backend/tests/cart.test.js
// Integration tests verifying JWT-protected cart operations.

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../server');
const knex = require('../src/db/knex');

describe('Cart API (JWT protected)', () => {
  const USER_A = 901001;
  const USER_B = 901002;

  let productA;
  let tokenA;
  let tokenB;

  const makeToken = (userId) =>
    jwt.sign({ id: userId, email: `user${userId}@example.com` }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

  const ensureUser = async (id) => {
    const existing = await knex('users').where({ id }).first();
    if (!existing) {
      await knex('users').insert({
        id,
        name: `User ${id}`,
        email: `user${id}@example.com`,
        password: 'hashed',
        role: 'customer',
      });
    }
  };

  beforeAll(async () => {
    await knex('order_items').del();
    await knex('orders').del();
    await knex('cart_items').del();
    await knex('carts').del();
    await knex('products').del();
    await knex('categories').del();
    await knex('users').whereIn('id', [USER_A, USER_B]).del();

    await ensureUser(USER_A);
    await ensureUser(USER_B);

    const [category] = await knex('categories')
      .insert({ name: 'Cart Category', description: 'For cart tests' })
      .returning('*');

    const [product] = await knex('products')
      .insert({
        name: 'Cart Product',
        price: 20.5,
        stock: 100,
        category_id: category.id,
      })
      .returning('*');
    productA = product;

    tokenA = makeToken(USER_A);
    tokenB = makeToken(USER_B);
  });

  afterAll(async () => {
    try {
      await knex('order_items').del();
      await knex('orders').del();
      await knex('cart_items').del();
      await knex('carts').del();
      await knex('products').del();
      await knex('categories').del();
      await knex('users').whereIn('id', [USER_A, USER_B]).del();
    } finally {
      await knex.destroy();
    }
  });

  test('POST /api/cart/add requires auth', async () => {
    const res = await request(app).post('/api/cart/add').send({
      productId: productA.id,
      quantity: 1,
    });
    expect(res.statusCode).toBe(401);
  });

  test('POST /api/cart/add adds item and returns enriched payload', async () => {
    const res = await request(app)
      .post('/api/cart/add')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        productId: productA.id,
        quantity: 2,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toMatchObject({
      productId: productA.id,
      name: productA.name,
      quantity: 2,
      unitPrice: 20.5,
      totalPrice: 41,
    });
  });

  test('GET /api/cart returns current user cart with totals', async () => {
    const res = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items[0]).toMatchObject({
      productId: productA.id,
      quantity: 2,
      unitPrice: 20.5,
      totalPrice: 41,
    });
    expect(res.body.total_price).toBe(41);
  });

  test('PUT /api/cart/items/:id updates quantity when owned by user', async () => {
    const { body: cart } = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${tokenA}`);

    const itemId = cart.items[0].id;

    const res = await request(app)
      .put(`/api/cart/items/${itemId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ quantity: 5 });

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      id: itemId,
      quantity: 5,
      totalPrice: 102.5,
    });
  });

  test('PUT /api/cart/items/:id forbids other users', async () => {
    const { body: cart } = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${tokenA}`);

    const itemId = cart.items[0].id;

    const res = await request(app)
      .put(`/api/cart/items/${itemId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ quantity: 3 });

    expect(res.statusCode).toBe(403);
  });

  test('DELETE /api/cart/items/:id removes owned item', async () => {
    const { body: cartBefore } = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${tokenA}`);
    const itemId = cartBefore.items[0].id;

    const res = await request(app)
      .delete(`/api/cart/items/${itemId}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ message: 'Item removed' });

    const { body: cartAfter } = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(cartAfter.items.length).toBe(0);
    expect(cartAfter.total_price).toBe(0);
  });
});
