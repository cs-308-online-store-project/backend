export async function up(knex) {
  await knex.schema.createTable('products', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('name').notNullable();
    t.string('model');
    t.string('serial');
    t.text('description');
    t.integer('quantity').notNullable().defaultTo(0);
    t.decimal('price', 12, 2).notNullable();
    t.string('warranty');
    t.string('distributor');
    t
      .uuid('category_id')
      .notNullable()
      .references('id')
      .inTable('categories')
      .onDelete('RESTRICT');
    t.timestamps(true, true);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('products');
}
