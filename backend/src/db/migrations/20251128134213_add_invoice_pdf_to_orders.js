exports.up = function(knex) {
  return knex.schema.table('orders', (table) => {
    table.string('invoice_pdf').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.table('orders', (table) => {
    table.dropColumn('invoice_pdf');
  });
};