const request = require('supertest');
const app = require('../server');
const knex = require('../src/db/knex');

describe('Product API Tests', () => {
  let testProductId;
  let testCategoryId;

  // Test başlamadan önce - test verisi hazırla
  beforeAll(async () => {
    // Test kategorisi oluştur
    const [category] = await knex('categories')
      .insert({
        name: 'Test Category',
        description: 'Category for testing'
      })
      .returning('*');
    testCategoryId = category.id;
  });

  // Testler bittikten sonra - temizlik yap
  afterAll(async () => {
    // Test verilerini temizle
    if (testProductId) {
      await knex('products').where('id', testProductId).del();
    }
    if (testCategoryId) {
      await knex('categories').where('id', testCategoryId).del();
    }
    
    await knex.destroy();
  });

  // TEST 1: List all the products
  test('GET /api/products - should return all products with pagination', async () => {
    const res = await request(app).get('/api/products?page=1&limit=10');
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  // TEST 2: Create new product
  test('POST /api/products - should create a new product', async () => {
    const newProduct = {
      name: 'Test Product',
      model: 'TP-2024',
      serial_number: 'TEST123456',
      description: 'This is a test product',
      stock: 50,
      price: 199.99,
      warranty_status: true,
      distributor: 'Test Distributor',
      category_id: testCategoryId
    };

    const res = await request(app)
      .post('/api/products')
      .send(newProduct);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.name).toBe('Test Product');
    expect(res.body.data.price).toBe('199.99');
    
    
    testProductId = res.body.data.id;
  });

  // TEST 3: Return single product by ID
  test('GET /api/products/:id - should return a single product by ID', async () => {
    // Önce bir ürün oluştur (eğer test 2 çalışmadıysa)
    if (!testProductId) {
      const [product] = await knex('products')
        .insert({
          name: 'Test Product',
          price: 99.99,
          stock: 10,
          category_id: testCategoryId
        })
        .returning('*');
      testProductId = product.id;
    }

    const res = await request(app).get(`/api/products/${testProductId}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id', testProductId);
    expect(res.body.data).toHaveProperty('name');
    expect(res.body.data).toHaveProperty('price');
  });

  // TEST 4: 404 should be returned for the product that does not exist.
  test('GET /api/products/:id - should return 404 for non-existent product', async () => {
    const nonExistentId = 999999;
    const res = await request(app).get(`/api/products/${nonExistentId}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Product not found');
  });

  // TEST 5: Product update
  test('PUT /api/products/:id - should update an existing product', async () => {
    // Önce bir ürün oluştur
    if (!testProductId) {
      const [product] = await knex('products')
        .insert({
          name: 'Test Product',
          price: 99.99,
          stock: 10,
          category_id: testCategoryId
        })
        .returning('*');
      testProductId = product.id;
    }

    const updateData = {
      name: 'Updated Product Name',
      price: 299.99,
      stock: 100
    };

    const res = await request(app)
      .put(`/api/products/${testProductId}`)
      .send(updateData);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Updated Product Name');
    expect(res.body.data.price).toBe('299.99');
    expect(res.body.data.stock).toBe(100);
  });

  // TEST 6: Remove a product
  test('DELETE /api/products/:id - should delete a product', async () => {
    // Silinecek geçici bir ürün oluştur
    const [productToDelete] = await knex('products')
      .insert({
        name: 'Product to Delete',
        price: 49.99,
        stock: 5,
        category_id: testCategoryId
      })
      .returning('*');

    const res = await request(app).delete(`/api/products/${productToDelete.id}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Product deleted');

    
    const deletedProduct = await knex('products')
      .where('id', productToDelete.id)
      .first();
    expect(deletedProduct).toBeUndefined();
  });

  // TEST 7: Attempting to create a product with invalid data
  test('POST /api/products - should fail with invalid data (missing required fields)', async () => {
    const invalidProduct = {
      // name eksik (gerekli alan)
      price: 'invalid_price', // string olmamalı
      stock: -5 // negatif olmamalı
    };

    const res = await request(app)
      .post('/api/products')
      .send(invalidProduct);

    expect(res.statusCode).toBe(500); // veya 400 validation eklerseniz
    expect(res.body.success).toBe(false);
  });
});