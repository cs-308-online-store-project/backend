const knex = require('../db/knex');

class Review {
  static async findAll() {
    return knex('reviews').select('*').orderBy('created_at', 'desc');
  }

  static async findById(id) {
    return knex('reviews').where({ id }).first();
  }

  static async findByProductId(productId, options = {}) {
    const { approvedOnly = false } = options;
    let query = knex('reviews')
      .where({ product_id: productId })
      .orderBy('created_at', 'desc');

    if (approvedOnly) {
      query = query.andWhere({ approved: true });
    }

    return query;
  }

  static async create(reviewData) {
    const [review] = await knex('reviews').insert(reviewData).returning('*');
    return review;
  }

  static async update(id, reviewData) {
    const [review] = await knex('reviews')
      .where({ id })
      .update(reviewData)
      .returning('*');
    return review;
  }

  static async delete(id) {
    return knex('reviews').where({ id }).del();
  }
}

module.exports = Review;