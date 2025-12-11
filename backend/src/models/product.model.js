const knex = require('../db/knex');

class Product {

  /**
   * Find all products with optional filtering, searching and sorting
   */
  static async findAll(options = {}) {
    const { 
      page = 1, 
      limit = 100, 
      search = '', 
      sort = '', 
      category_id = null 
    } = options;

    const offset = (page - 1) * limit;
    let query = knex('products').select('*');

    // 🔍 Search
    if (search) {
      query = query.where(function() {
        this.where('name', 'ilike', `%${search}%`)
            .orWhere('description', 'ilike', `%${search}%`);
      });
    }

    // 🔍 Category
    if (category_id) {
      query = query.where('category_id', category_id);
    }

    // 🔥 Sorting
    switch (sort) {

      case 'price_asc':
        query = query.orderBy('price', 'asc');
        break;

      case 'price_desc':
        query = query.orderBy('price', 'desc');
        break;

      case 'name_asc':
        query = query.orderBy('name', 'asc');
        break;

      case 'name_desc':
        query = query.orderBy('name', 'desc');
        break;

      case 'newest':
        query = query.orderBy('created_at', 'desc');
        break;

      /**
       * ⭐ SORT BY RATING (avg_rating DESC)
       * LEFT JOIN keeps products without reviews
       */
      case 'rating':
        return knex('products as p')
          .leftJoin('reviews as r', 'r.product_id', 'p.id')
          .groupBy('p.id')
          .select(
            'p.*',
            knex.raw('COALESCE(AVG(CASE WHEN r.approved = true THEN r.rating END), 0) AS avg_rating'),
            knex.raw('COUNT(CASE WHEN r.approved = true THEN r.id END) AS review_count')
          )
          .orderBy('avg_rating', 'desc')
          .limit(limit)
          .offset(offset);

      /**
       * ⭐ SORT BY POPULARITY (review_count DESC, avg_rating DESC)
       */
      case 'popular':
        return knex('products as p')
          .leftJoin('reviews as r', 'r.product_id', 'p.id')
          .groupBy('p.id')
          .select(
            'p.*',
            knex.raw('COALESCE(AVG(CASE WHEN r.approved = true THEN r.rating END), 0) AS avg_rating'),
            knex.raw('COUNT(CASE WHEN r.approved = true THEN r.id END) AS review_count')
          )
          .orderBy([
            { column: 'review_count', order: 'desc' },
            { column: 'avg_rating', order: 'desc' }
          ])
          .limit(limit)
          .offset(offset);

      default:
        query = query.orderBy('id', 'asc');
    }

    // 📌 Pagination
    return query.limit(limit).offset(offset);
  }


  /**
   * Find product by ID (with rating + review_count)
   */
  static async findById(id) {
    return knex('products as p')
      .leftJoin('reviews as r', 'r.product_id', 'p.id')
      .where('p.id', id)
      .groupBy('p.id')
      .select(
        'p.*',
        knex.raw('COALESCE(AVG(CASE WHEN r.approved = true THEN r.rating END), 0) AS avg_rating'),
        knex.raw('COUNT(CASE WHEN r.approved = true THEN r.id END) AS review_count')
      )
      .first();
  }


  /**
   * Create a product
   */
  static async create(productData) {
    const [product] = await knex('products')
      .insert(productData)
      .returning('*');
    return product;
  }

  /**
   * Update a product
   */
  static async update(id, productData) {
    const [product] = await knex('products')
      .where({ id })
      .update(productData)
      .returning('*');
    return product;
  }

  /**
   * Delete a product
   */
  static async delete(id) {
    return knex('products')
      .where({ id })
      .del();
  }
}

module.exports = Product;
