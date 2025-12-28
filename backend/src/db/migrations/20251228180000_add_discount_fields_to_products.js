exports.up = async function (knex) {
  const hasRate = await knex.schema.hasColumn('products', 'discount_rate');
  const hasDiscPrice = await knex.schema.hasColumn('products', 'discounted_price');
  const hasActive = await knex.schema.hasColumn('products', 'discount_active');

  if (!hasRate) {
    await knex.schema.alterTable('products', (t) => {
      t.integer('discount_rate').notNullable().defaultTo(0);
    });
  }

  if (!hasDiscPrice) {
    await knex.schema.alterTable('products', (t) => {
      t.decimal('discounted_price', 10, 2).nullable();
    });
  }

  if (!hasActive) {
    await knex.schema.alterTable('products', (t) => {
      t.boolean('discount_active').notNullable().defaultTo(false);
    });
  }
};

exports.down = async function (knex) {
  // down'da da kolon varsa drop et
  const hasRate = await knex.schema.hasColumn('products', 'discount_rate');
  const hasDiscPrice = await knex.schema.hasColumn('products', 'discounted_price');
  const hasActive = await knex.schema.hasColumn('products', 'discount_active');

  await knex.schema.alterTable('products', (t) => {
    if (hasRate) t.dropColumn('discount_rate');
    if (hasDiscPrice) t.dropColumn('discounted_price');
    if (hasActive) t.dropColumn('discount_active');
  });
};