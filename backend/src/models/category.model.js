const knex = require('../db/knex');

class Category {
  static async findAll() {
    return knex('categories').select('*');
  }

  static async findById(id) {
    return knex('categories').where({ id }).first();
  }

  static async create(categoryData) {
    const [category] = await knex('categories')
      .insert(categoryData)
      .returning('*');
    return category;
  }
}

module.exports = Category;