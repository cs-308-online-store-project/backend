const knex = require('../src/db/knex');

const asNumber = (value) => Number(value);

describe('Migrations and seed data integrity', () => {
  beforeAll(async () => {
    await knex.migrate.latest();
    await knex.seed.run();
  });

  afterAll(async () => {
    await knex.destroy();
  });

  test('core tables contain demo data', async () => {
    const [{ count: userCount }] = await knex('users').count();
    const [{ count: productCount }] = await knex('products').count();
    const [{ count: orderCount }] = await knex('orders').count();
    const [{ count: reviewCount }] = await knex('reviews').count();
    const [{ count: refundCount }] = await knex('refunds').count();

    expect(asNumber(userCount)).toBe(4);
    expect(asNumber(productCount)).toBeGreaterThanOrEqual(30);
    expect(asNumber(orderCount)).toBe(6);
    expect(asNumber(reviewCount)).toBeGreaterThanOrEqual(5);
    expect(asNumber(refundCount)).toBeGreaterThanOrEqual(1);
  });

  test('order totals align with order_items sums', async () => {
    const orders = await knex('orders').select('id', 'total_price');

    for (const order of orders) {
      const items = await knex('order_items')
        .where({ order_id: order.id })
        .select('quantity', 'price');
      const itemTotal = items.reduce(
        (sum, item) => sum + asNumber(item.price) * asNumber(item.quantity),
        0
      );

      expect(itemTotal).toBeCloseTo(asNumber(order.total_price));
    }
  });

  test('products include placeholder image URLs', async () => {
    const products = await knex('products').select('image_url');

    expect(products.length).toBeGreaterThan(0);
    products.forEach(({ image_url: imageUrl }) => {
      expect(imageUrl).toBeTruthy();
      expect(imageUrl).toMatch(/^https:\/\/picsum\.photos\/seed\//);
    });
  });
});