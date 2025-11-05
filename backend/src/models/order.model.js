module.exports = (knex) => {
  return {
    createOrder(order) {
      return knex('orders').insert(order).returning('*');
    },
    getOrderById(id) {
      return knex('orders').where({ id }).first();
    }
  };
};
