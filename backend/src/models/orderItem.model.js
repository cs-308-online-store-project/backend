module.exports = (knex) => {
  return {
    createItems(items) {
      return knex('order_items').insert(items);
    }
  };
};
