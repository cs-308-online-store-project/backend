exports.up = async function (knex) {
    await knex.schema.alterTable('products', (t) => {
      t.string('image_url')
        .notNullable()
        .defaultTo('https://placehold.co/600x600?text=No+Image');
    });
  };
  
  exports.down = async function (knex) {
    await knex.schema.alterTable('products', (t) => {
      t.dropColumn('image_url');
    });
  };