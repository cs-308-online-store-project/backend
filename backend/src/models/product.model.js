const knex = require('../db/knex');

class Product {

  static async findAll(page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    return knex('products')
      .select('*')
      .limit(limit)
      .offset(offset);
  }

  static async findById(id) {
    return knex('products')
      .where({ id })
      .first();
  }


  static async create(productData) {
    const [product] = await knex('products')
      .insert(productData)
      .returning('*');
    return product;
  }


  static async update(id, productData) {
    const [product] = await knex('products')
      .where({ id })
      .update(productData)
      .returning('*');
    return product;
  }


  static async delete(id) {
    return knex('products')
      .where({ id })
      .del();
  }
}

module.exports = Product;