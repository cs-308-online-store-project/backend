exports.up = async function (knex) {
    // Tablo var mı kontrol et
    const hasTable = await knex.schema.hasTable('wishlists');
    
    if (!hasTable) {
      await knex.schema.createTable('wishlists', (t) => {
        t.increments('id').primary();
        t.integer('user_id').unsigned().notNullable();
        t.integer('product_id').unsigned().notNullable();
        t.timestamp('created_at').defaultTo(knex.fn.now());
        
        // Foreign keys
        t.foreign('user_id').references('users.id').onDelete('CASCADE');
        t.foreign('product_id').references('products.id').onDelete('CASCADE');
        
        // Unique constraint
        t.unique(['user_id', 'product_id']);
      });
    }
  };
  
  exports.down = async function (knex) {
    const hasTable = await knex.schema.hasTable('wishlists');
    
    if (hasTable) {
      await knex.schema.dropTableIfExists('wishlists');
    }
  };