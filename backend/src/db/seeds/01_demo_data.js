const truncateAll = async (trx) => {
  await trx.raw(
    'TRUNCATE refunds, wishlist_items, wishlists, reviews, order_items, orders, cart_items, carts, products, categories, users RESTART IDENTITY CASCADE'
  );
};

exports.seed = async function (knex) {
  await knex.transaction(async (trx) => {
    await truncateAll(trx);

    const [ayseId, baranId, miraId, kaanId] = await trx('users')
      .insert(
        [
          {
            name: 'Ayşe Yildiz',
            tax_id: 'TR-9001',
            email: 'ayse@urbanthreads.com',
            password: 'hashed-password',
            address: 'Moda, Istanbul',
            role: 'customer',
          },
          {
            name: 'Baran Gunes',
            tax_id: 'TR-9002',
            email: 'baran@urbanthreads.com',
            password: 'hashed-password',
            address: 'Alsancak, Izmir',
            role: 'customer',
          },
          {
            name: 'Mira Arslan',
            tax_id: 'TR-9003',
            email: 'mira@urbanthreads.com',
            password: 'hashed-password',
            address: 'Beyoğlu, Istanbul',
            role: 'product_manager',
          },
          {
            name: 'Kaan Yalçin',
            tax_id: 'TR-9004',
            email: 'kaan@urbanthreads.com',
            password: 'hashed-password',
            address: 'Kadıköy, Istanbul',
            role: 'support_agent',
          },
        ],
        ['id']
      )
      .then((rows) => rows.map((row) => row.id));

    const categoryRows = await trx('categories')
      .insert(
        [
          { name: 'Hoodies & Sweatshirts', description: 'Oversized fits and heavyweight fleece' },
          { name: 'Graphic Tees', description: 'Bold street graphics and artist collabs' },
          { name: 'Sneakers', description: 'Lifestyle sneakers and skate shoes' },
          { name: 'Denim', description: 'Washed denim and distressed jackets' },
          { name: 'Accessories', description: 'Caps, beanies, and everyday carry' },
        ],
        ['id', 'name']
      );

    const categoryByName = Object.fromEntries(
      categoryRows.map((row) => [row.name, row.id])
    );

    const imageUrlFor = (serial, index) => {
      const seed = serial || `product-${index + 1}`;
      return `https://picsum.photos/seed/${seed}/800/800`;
    };

    const baseProducts = [
      // Hoodies & Sweatshirts
      {
        name: 'Shadowline Oversized Hoodie',
        model: 'SDW-001',
        serial_number: 'SHDW-HOOD-001',
        description: 'Heavyweight charcoal hoodie with dropped shoulders and tonal embroidery.',
        quantity_in_stock: 18,
        price: 79.9,
        warranty_status: false,
        distributor: 'UrbanThreads',
        category_id: categoryByName['Hoodies & Sweatshirts'],
      },
      {
        name: 'Night Shift Zip Hoodie',
        model: 'NSZ-210',
        serial_number: 'NSZ-HOOD-210',
        description: 'Full-zip hoodie with matte black hardware and scuba hood.',
        quantity_in_stock: 22,
        price: 84.0,
        warranty_status: false,
        distributor: 'UrbanThreads',
        category_id: categoryByName['Hoodies & Sweatshirts'],
      },
      {
        name: 'Static Fade Pullover',
        model: 'STF-144',
        serial_number: 'STF-HOOD-144',
        description: 'Gradient dye fleece with ribbed side panels and hidden pocket.',
        quantity_in_stock: 30,
        price: 76.5,
        warranty_status: false,
        distributor: 'Signal Works',
        category_id: categoryByName['Hoodies & Sweatshirts'],
      },
      {
        name: 'Metro Grid Tech Hoodie',
        model: 'MGT-440',
        serial_number: 'MGT-HOOD-440',
        description: 'Tech fleece hoodie with reflective grid print and media pocket.',
        quantity_in_stock: 16,
        price: 92.0,
        warranty_status: true,
        distributor: 'Rooftop Supply',
        category_id: categoryByName['Hoodies & Sweatshirts'],
      },
      {
        name: 'Driftline Washed Hoodie',
        model: 'DLH-339',
        serial_number: 'DLH-HOOD-339',
        description: 'Acid-washed hoodie with raw cuffs and boxy silhouette.',
        quantity_in_stock: 28,
        price: 71.0,
        warranty_status: false,
        distributor: 'North Pier',
        category_id: categoryByName['Hoodies & Sweatshirts'],
      },
      {
        name: 'Lunarcore Half-Zip',
        model: 'LHZ-221',
        serial_number: 'LHZ-HOOD-221',
        description: 'Half-zip hoodie with mock neck, thumbholes, and reflective tape.',
        quantity_in_stock: 20,
        price: 88.5,
        warranty_status: true,
        distributor: 'UrbanThreads',
        category_id: categoryByName['Hoodies & Sweatshirts'],
      },
      {
        name: 'Bricklane Heavy Fleece',
        model: 'BLF-778',
        serial_number: 'BLF-HOOD-778',
        description: 'Heavy fleece hoodie with brick red pigment dye and kangaroo pocket.',
        quantity_in_stock: 19,
        price: 82.0,
        warranty_status: false,
        distributor: 'UrbanThreads',
        category_id: categoryByName['Hoodies & Sweatshirts'],
      },
      {
        name: 'Signal Layered Hoodie',
        model: 'SLH-557',
        serial_number: 'SLH-HOOD-557',
        description: 'Layered-look hoodie with mesh hem extension and contrast drawcords.',
        quantity_in_stock: 17,
        price: 86.0,
        warranty_status: false,
        distributor: 'Signal Works',
        category_id: categoryByName['Hoodies & Sweatshirts'],
      },

      // Graphic Tees
      {
        name: 'Neon Pulse Graphic Tee',
        model: 'NP-TEE-01',
        serial_number: 'NP-TEE-2024',
        description: 'Relaxed fit cotton tee with neon screen print inspired by Istanbul nightlife.',
        quantity_in_stock: 60,
        price: 34.5,
        warranty_status: false,
        distributor: 'UrbanThreads',
        category_id: categoryByName['Graphic Tees'],
      },
      {
        name: 'Concrete Jungle Tee',
        model: 'CJT-110',
        serial_number: 'CJT-TEE-110',
        description: 'Washed black tee with stencil logo and cracked texture print.',
        quantity_in_stock: 48,
        price: 32.0,
        warranty_status: false,
        distributor: 'UrbanThreads',
        category_id: categoryByName['Graphic Tees'],
      },
      {
        name: 'Afterhours Ringer Tee',
        model: 'AHR-213',
        serial_number: 'AHR-TEE-213',
        description: 'Ringer tee with contrast collar and retro club flyer graphic.',
        quantity_in_stock: 42,
        price: 31.5,
        warranty_status: false,
        distributor: 'Rooftop Supply',
        category_id: categoryByName['Graphic Tees'],
      },
      {
        name: 'Skyline Warp Tee',
        model: 'SKW-555',
        serial_number: 'SKW-TEE-555',
        description: 'Glitch skyline print on soft jersey with drop shoulders.',
        quantity_in_stock: 55,
        price: 33.0,
        warranty_status: false,
        distributor: 'Signal Works',
        category_id: categoryByName['Graphic Tees'],
      },
      {
        name: 'Blocktype Minimal Tee',
        model: 'BMT-332',
        serial_number: 'BMT-TEE-332',
        description: 'Minimal block lettering on heavyweight cotton, boxy fit.',
        quantity_in_stock: 52,
        price: 29.5,
        warranty_status: false,
        distributor: 'North Pier',
        category_id: categoryByName['Graphic Tees'],
      },
      {
        name: 'Sprayfade Pocket Tee',
        model: 'SPT-189',
        serial_number: 'SPT-TEE-189',
        description: 'Pocket tee with spray gradient and subtle brand tag.',
        quantity_in_stock: 47,
        price: 30.0,
        warranty_status: false,
        distributor: 'UrbanThreads',
        category_id: categoryByName['Graphic Tees'],
      },
      {
        name: 'Mono Tag Longline Tee',
        model: 'MTL-908',
        serial_number: 'MTL-TEE-908',
        description: 'Longline tee with monochrome graffiti tag and stepped hem.',
        quantity_in_stock: 44,
        price: 36.0,
        warranty_status: false,
        distributor: 'UrbanThreads',
        category_id: categoryByName['Graphic Tees'],
      },

      // Sneakers
      {
        name: 'Midnight Runner Sneaker',
        model: 'MR-LOW-01',
        serial_number: 'MR-SNK-8844',
        description: 'Black leather low-top with reflective piping and gum outsole.',
        quantity_in_stock: 25,
        price: 149.0,
        warranty_status: true,
        distributor: 'Rooftop Supply',
        category_id: categoryByName['Sneakers'],
      },
      {
        name: 'Back Alley High-Top',
        model: 'BAH-701',
        serial_number: 'BAH-SNK-701',
        description: 'Canvas high-top with wraparound strap and contrast stitch.',
        quantity_in_stock: 21,
        price: 119.0,
        warranty_status: true,
        distributor: 'Signal Works',
        category_id: categoryByName['Sneakers'],
      },
      {
        name: 'Pulseknit Slip-On',
        model: 'PKS-512',
        serial_number: 'PKS-SNK-512',
        description: 'Sock-fit knit sneaker with speckled midsole and heel pull.',
        quantity_in_stock: 32,
        price: 109.5,
        warranty_status: true,
        distributor: 'UrbanThreads',
        category_id: categoryByName['Sneakers'],
      },
      {
        name: 'Deckside Vulc',
        model: 'DSV-344',
        serial_number: 'DSV-SNK-344',
        description: 'Vulcanized skate shoe with suede overlays and reinforced toe.',
        quantity_in_stock: 34,
        price: 89.0,
        warranty_status: false,
        distributor: 'North Pier',
        category_id: categoryByName['Sneakers'],
      },
      {
        name: 'Nighttrack Trail Low',
        model: 'NTT-622',
        serial_number: 'NTT-SNK-622',
        description: 'Trail-inspired low-top with ripstop panels and lug outsole.',
        quantity_in_stock: 26,
        price: 139.0,
        warranty_status: true,
        distributor: 'Rooftop Supply',
        category_id: categoryByName['Sneakers'],
      },
      {
        name: 'Chrome Lace Runner',
        model: 'CLR-458',
        serial_number: 'CLR-SNK-458',
        description: 'Running silhouette with chrome eyelets and reflective laces.',
        quantity_in_stock: 29,
        price: 132.0,
        warranty_status: true,
        distributor: 'UrbanThreads',
        category_id: categoryByName['Sneakers'],
      },

      // Denim
      {
        name: 'Raw Edge Denim Jacket',
        model: 'RJ-DNM-300',
        serial_number: 'RJ-DNM-300',
        description: 'Cropped denim jacket with raw hems and vintage wash.',
        quantity_in_stock: 14,
        price: 129.5,
        warranty_status: false,
        distributor: 'North Pier',
        category_id: categoryByName['Denim'],
      },
      {
        name: 'Riverside Relaxed Jeans',
        model: 'RRJ-812',
        serial_number: 'RRJ-DNM-812',
        description: 'Relaxed fit jeans with light stone wash and paint flecks.',
        quantity_in_stock: 33,
        price: 98.0,
        warranty_status: false,
        distributor: 'UrbanThreads',
        category_id: categoryByName['Denim'],
      },
      {
        name: 'District Carpenter Jeans',
        model: 'DCJ-404',
        serial_number: 'DCJ-DNM-404',
        description: 'Carpenter jeans with utility pocket and contrast bartacks.',
        quantity_in_stock: 27,
        price: 104.0,
        warranty_status: false,
        distributor: 'Signal Works',
        category_id: categoryByName['Denim'],
      },
      {
        name: 'Faded Rail Denim Shirt',
        model: 'FRS-255',
        serial_number: 'FRS-DNM-255',
        description: 'Lightweight denim shirt with sun-faded seams and snap buttons.',
        quantity_in_stock: 24,
        price: 89.5,
        warranty_status: false,
        distributor: 'North Pier',
        category_id: categoryByName['Denim'],
      },
      {
        name: 'Overcast Cropped Vest',
        model: 'OCV-699',
        serial_number: 'OCV-DNM-699',
        description: 'Cropped denim vest with oversized chest pockets and raw armholes.',
        quantity_in_stock: 18,
        price: 94.0,
        warranty_status: false,
        distributor: 'UrbanThreads',
        category_id: categoryByName['Denim'],
      },
      {
        name: 'Indigo Moto Jeans',
        model: 'IMJ-577',
        serial_number: 'IMJ-DNM-577',
        description: 'Slim moto jeans with panelled knees and oil-finish coating.',
        quantity_in_stock: 20,
        price: 112.0,
        warranty_status: true,
        distributor: 'Rooftop Supply',
        category_id: categoryByName['Denim'],
      },

      // Accessories
      {
        name: 'Concrete Snapback Cap',
        model: 'CSC-77',
        serial_number: 'CSC-77-GRY',
        description: 'Structured snapback with 3D puff logo and grey wool blend.',
        quantity_in_stock: 80,
        price: 29.0,
        warranty_status: false,
        distributor: 'UrbanThreads',
        category_id: categoryByName['Accessories'],
      },
      {
        name: 'Mesh Panel 5-Panel',
        model: 'MP5-204',
        serial_number: 'MP5-ACC-204',
        description: 'Breathable 5-panel cap with mesh side panels and nylon strap.',
        quantity_in_stock: 73,
        price: 27.0,
        warranty_status: false,
        distributor: 'UrbanThreads',
        category_id: categoryByName['Accessories'],
      },
      {
        name: 'Transit Canvas Tote',
        model: 'TCT-801',
        serial_number: 'TCT-ACC-801',
        description: 'Heavy canvas tote with reflective webbing and inner laptop sleeve.',
        quantity_in_stock: 64,
        price: 45.0,
        warranty_status: false,
        distributor: 'Signal Works',
        category_id: categoryByName['Accessories'],
      },
      {
        name: 'Crossbody Utility Bag',
        model: 'CUB-118',
        serial_number: 'CUB-ACC-118',
        description: 'Crossbody with modular pouches and waterproof zippers.',
        quantity_in_stock: 58,
        price: 52.0,
        warranty_status: false,
        distributor: 'UrbanThreads',
        category_id: categoryByName['Accessories'],
      },
      {
        name: 'Stealth Rib Beanie',
        model: 'SRB-909',
        serial_number: 'SRB-ACC-909',
        description: 'Deep cuff beanie with tonal rubber patch and rib knit.',
        quantity_in_stock: 90,
        price: 24.0,
        warranty_status: false,
        distributor: 'North Pier',
        category_id: categoryByName['Accessories'],
      },
      {
        name: 'Reflective Rope Belt',
        model: 'RRB-650',
        serial_number: 'RRB-ACC-650',
        description: 'Climbing-inspired belt with reflective rope and alloy buckle.',
        quantity_in_stock: 77,
        price: 21.5,
        warranty_status: false,
        distributor: 'UrbanThreads',
        category_id: categoryByName['Accessories'],
      },
    ];

    const productsToInsert = baseProducts.map((product, index) => ({
      ...product,
      image_url: imageUrlFor(product.serial_number, index),
    }));

    const productRows = await trx('products')
      .insert(productsToInsert, ['id', 'name', 'price', 'quantity_in_stock']);

    const productByName = Object.fromEntries(
      productRows.map((row) => [row.name, row])
    );

    const [ayseCartId, baranCartId] = await trx('carts')
      .insert(
        [
          { user_id: ayseId },
          { user_id: baranId },
        ],
        ['id']
      )
      .then((rows) => rows.map((row) => row.id));

    await trx('cart_items').insert([
      {
        cart_id: ayseCartId,
        product_id: productByName['Shadowline Oversized Hoodie'].id,
        quantity: 1,
      },
      {
        cart_id: ayseCartId,
        product_id: productByName['Neon Pulse Graphic Tee'].id,
        quantity: 2,
      },
      {
        cart_id: ayseCartId,
        product_id: productByName['Transit Canvas Tote'].id,
        quantity: 1,
      },
      {
        cart_id: baranCartId,
        product_id: productByName['Midnight Runner Sneaker'].id,
        quantity: 1,
      },
      {
        cart_id: baranCartId,
        product_id: productByName['Blocktype Minimal Tee'].id,
        quantity: 1,
      },
    ]);

    const [ayseWishlistId, baranWishlistId] = await trx('wishlists')
      .insert(
        [
          { user_id: ayseId },
          { user_id: baranId },
        ],
        ['id']
      )
      .then((rows) => rows.map((row) => row.id));

    await trx('wishlist_items').insert([
      { wishlist_id: ayseWishlistId, product_id: productByName['Raw Edge Denim Jacket'].id },
      { wishlist_id: ayseWishlistId, product_id: productByName['Concrete Snapback Cap'].id },
      { wishlist_id: ayseWishlistId, product_id: productByName['Night Shift Zip Hoodie'].id },
      { wishlist_id: baranWishlistId, product_id: productByName['Neon Pulse Graphic Tee'].id },
      { wishlist_id: baranWishlistId, product_id: productByName['Back Alley High-Top'].id },
    ]);

    const buildOrder = (userId, status, address, items, createdAt) => {
      const total = items.reduce(
        (sum, item) => sum + Number(item.price) * Number(item.quantity),
        0
      );
      return {
        order: {
          user_id: userId,
          total_price: total,
          status,
          address,
          created_at: createdAt,
        },
        items,
      };
    };

    const orderPayloads = [
      buildOrder(
        ayseId,
        'processing',
        'Moda, Istanbul',
        [
          {
            product_id: productByName['Shadowline Oversized Hoodie'].id,
            quantity: 1,
            price: productByName['Shadowline Oversized Hoodie'].price,
          },
          {
            product_id: productByName['Neon Pulse Graphic Tee'].id,
            quantity: 2,
            price: productByName['Neon Pulse Graphic Tee'].price,
          },
        ],
        knex.fn.now()
      ),
      buildOrder(
        ayseId,
        'delivered',
        'Moda, Istanbul',
        [
          {
            product_id: productByName['Midnight Runner Sneaker'].id,
            quantity: 1,
            price: productByName['Midnight Runner Sneaker'].price,
          },
          {
            product_id: productByName['Concrete Snapback Cap'].id,
            quantity: 1,
            price: productByName['Concrete Snapback Cap'].price,
          },
        ],
        knex.raw("CURRENT_TIMESTAMP - INTERVAL '10 days'")
      ),
      buildOrder(
        baranId,
        'in_transit',
        'Alsancak, Izmir',
        [
          {
            product_id: productByName['Raw Edge Denim Jacket'].id,
            quantity: 1,
            price: productByName['Raw Edge Denim Jacket'].price,
          },
          {
            product_id: productByName['Neon Pulse Graphic Tee'].id,
            quantity: 1,
            price: productByName['Neon Pulse Graphic Tee'].price,
          },
        ],
        knex.raw("CURRENT_TIMESTAMP - INTERVAL '3 days'")
      ),
      buildOrder(
        baranId,
        'refunded',
        'Alsancak, Izmir',
        [
          {
            product_id: productByName['Midnight Runner Sneaker'].id,
            quantity: 1,
            price: productByName['Midnight Runner Sneaker'].price,
          },
        ],
        knex.raw("CURRENT_TIMESTAMP - INTERVAL '20 days'")
      ),
      buildOrder(
        ayseId,
        'delivered',
        'Moda, Istanbul',
        [
          {
            product_id: productByName['Lunarcore Half-Zip'].id,
            quantity: 1,
            price: productByName['Lunarcore Half-Zip'].price,
          },
          {
            product_id: productByName['Transit Canvas Tote'].id,
            quantity: 1,
            price: productByName['Transit Canvas Tote'].price,
          },
          {
            product_id: productByName['Stealth Rib Beanie'].id,
            quantity: 1,
            price: productByName['Stealth Rib Beanie'].price,
          },
        ],
        knex.raw("CURRENT_TIMESTAMP - INTERVAL '15 days'")
      ),
      buildOrder(
        baranId,
        'processing',
        'Alsancak, Izmir',
        [
          {
            product_id: productByName['Back Alley High-Top'].id,
            quantity: 1,
            price: productByName['Back Alley High-Top'].price,
          },
          {
            product_id: productByName['District Carpenter Jeans'].id,
            quantity: 1,
            price: productByName['District Carpenter Jeans'].price,
          },
          {
            product_id: productByName['Afterhours Ringer Tee'].id,
            quantity: 1,
            price: productByName['Afterhours Ringer Tee'].price,
          },
        ],
        knex.raw("CURRENT_TIMESTAMP - INTERVAL '1 day'")
      ),
    ];

    const insertedOrders = [];
    for (const payload of orderPayloads) {
      const [orderRow] = await trx('orders').insert(payload.order).returning('*');
      const itemsWithOrder = payload.items.map((item) => ({
        ...item,
        order_id: orderRow.id,
      }));
      await trx('order_items').insert(itemsWithOrder);
      insertedOrders.push(orderRow);
    }

    await trx('reviews').insert([
      {
        product_id: productByName['Shadowline Oversized Hoodie'].id,
        user_id: ayseId,
        rating: 5,
        comment: 'Kalın kumaş, oversize kalıp tam istediğim gibi.',
        approved: true,
      },
      {
        product_id: productByName['Neon Pulse Graphic Tee'].id,
        user_id: baranId,
        rating: 4,
        comment: 'Baskı kaliteli, beden hafif bol.',
        approved: true,
      },
      {
        product_id: productByName['Midnight Runner Sneaker'].id,
        user_id: ayseId,
        rating: 5,
        comment: 'Gece yürüyüşleri için ideal, rahat ve şık.',
        approved: true,
      },
      {
        product_id: productByName['Back Alley High-Top'].id,
        user_id: baranId,
        rating: 5,
        comment: 'Bileği iyi sarıyor, kaykay için tutuşu sağlam.',
        approved: true,
      },
      {
        product_id: productByName['Lunarcore Half-Zip'].id,
        user_id: ayseId,
        rating: 4,
        comment: 'Yarım fermuar ve yansıtıcı detaylar hoş, beden tam.',
        approved: true,
      },
    ]);

    const refundedOrder = insertedOrders.find((order) => order.status === 'refunded');

    await trx('refunds').insert([
      {
        order_id: refundedOrder.id,
        user_id: refundedOrder.user_id,
        product_id: productByName['Midnight Runner Sneaker'].id,
        status: 'approved',
        refunded_amount: productByName['Midnight Runner Sneaker'].price,
        approved_at: knex.raw("CURRENT_TIMESTAMP - INTERVAL '5 days'")
      },
    ]);
  });
};