exports.up = async function (knex) {
  await knex.schema.createTable('notifications', (t) => {
    t.increments('id').primary();
    t.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.string('type').notNullable(); // DISCOUNT
    t.string('title').notNullable();
    t.text('message').notNullable();
    t.jsonb('data').nullable();
    t.boolean('is_read').notNullable().defaultTo(false);
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.alterTable('notifications', (t) => {
    t.index(['user_id']);
    t.index(['type']);
    t.index(['created_at']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('notifications');
};