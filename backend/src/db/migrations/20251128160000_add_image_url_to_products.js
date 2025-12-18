exports.up = async function (knex) {
  // Kolon var mı kontrol et
  const hasColumn = await knex.schema.hasColumn('products', 'image_url');
  
  if (!hasColumn) {
    await knex.schema.alterTable('products', (t) => {
      t.string('image_url', 255)
        .notNullable()
        .defaultTo('https://placehold.co/600x600?text=No+Image');
    });
  }
};

exports.down = async function (knex) {
  const hasColumn = await knex.schema.hasColumn('products', 'image_url');
  
  if (hasColumn) {
    await knex.schema.alterTable('products', (t) => {
      t.dropColumn('image_url');
    });
  }
};