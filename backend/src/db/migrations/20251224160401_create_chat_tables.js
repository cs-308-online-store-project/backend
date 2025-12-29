/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // 1. Chat conversations tablosu
  await knex.schema.createTable('chat_conversations', (table) => {
    table.increments('id').primary();
    table.integer('customer_id').unsigned().nullable();
    table.foreign('customer_id').references('users.id').onDelete('SET NULL');
    table.integer('agent_id').unsigned().nullable();
    table.foreign('agent_id').references('users.id').onDelete('SET NULL');
    table.string('guest_name').nullable();
    table.string('guest_email').nullable();
    table.enum('status', ['waiting', 'active', 'closed']).defaultTo('waiting');
    table.timestamp('started_at').defaultTo(knex.fn.now());
    table.timestamp('closed_at').nullable();
    table.timestamps(true, true);
  });

  // 2. Chat messages tablosu
  await knex.schema.createTable('chat_messages', (table) => {
    table.increments('id').primary();
    table.integer('conversation_id').unsigned().notNullable();
    table.foreign('conversation_id').references('chat_conversations.id').onDelete('CASCADE');
    table.integer('sender_id').unsigned().nullable();
    table.foreign('sender_id').references('users.id').onDelete('SET NULL');
    table.enum('sender_type', ['customer', 'agent', 'guest']).notNullable();
    table.text('message').notNullable();
    table.boolean('is_read').defaultTo(false);
    table.timestamp('read_at').nullable();
    table.timestamps(true, true);
  });

  // 3. Chat attachments tablosu
  await knex.schema.createTable('chat_attachments', (table) => {
    table.increments('id').primary();
    table.integer('message_id').unsigned().notNullable();
    table.foreign('message_id').references('chat_messages.id').onDelete('CASCADE');
    table.string('file_name').notNullable();
    table.string('file_url').notNullable();
    table.string('file_type').notNullable(); // 'image', 'pdf', 'video'
    table.integer('file_size').unsigned();
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('chat_attachments');
  await knex.schema.dropTableIfExists('chat_messages');
  await knex.schema.dropTableIfExists('chat_conversations');
};