const WishlistModel = require('../models/wishlistModel');

function getUserId(req) {
  // auth middleware'in req.user'a yazdığı alanlara göre
  return req.user?.id ?? req.user?.sub;
}

function parseProductId(req) {
  // Jira endpoint: /:productId
  if (req.params?.productId !== undefined) {
    const pid = Number(req.params.productId);
    return Number.isInteger(pid) ? pid : null;
  }
  // Legacy endpoint: body.productId
  if (req.body?.productId !== undefined) {
    const pid = Number(req.body.productId);
    return Number.isInteger(pid) ? pid : null;
  }
  return null;
}

/**
 * GET /api/wishlist
 */
exports.getWishlist = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const items = await WishlistModel.getByUserId(userId);

    // FE için count da ekleyelim (işe yarıyor)
    return res.status(200).json({
      items,
      count: items.length
    });
  } catch (err) {
    console.error('getWishlist error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET /api/wishlist/count
 */
exports.getWishlistCount = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const count = await WishlistModel.getCount(userId);
    return res.status(200).json({ count });
  } catch (err) {
    console.error('getWishlistCount error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * POST /api/wishlist/:productId  (Jira)
 * POST /api/wishlist/add {productId} (legacy)
 * POST /api/wishlist/items {productId} (legacy)
 */
exports.addToWishlistByProduct = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const productId = parseProductId(req);
    if (!productId) return res.status(400).json({ message: 'Invalid productId' });

    const result = await WishlistModel.add(userId, productId);

    // Idempotent davranalım:
    // created true -> 201
    // created false -> 200
    return res.status(result.created ? 201 : 200).json({
      message: result.created ? 'Added to wishlist' : 'Already in wishlist',
      wishlistId: result.wishlistId,
      productId
    });
  } catch (err) {
    // Eğer modelde error fırlatılırsa (eski versiyonlarda) yine idempotent yapalım
    if (String(err?.message).toLowerCase().includes('already')) {
      return res.status(200).json({ message: 'Already in wishlist' });
    }
    console.error('addToWishlistByProduct error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * DELETE /api/wishlist/:productId (Jira)
 * DELETE /api/wishlist/remove/:productId (legacy)
 */
exports.removeFromWishlistByProduct = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const productId = parseProductId(req);
    if (!productId) return res.status(400).json({ message: 'Invalid productId' });

    const { deleted } = await WishlistModel.remove(userId, productId);

    // Idempotent: yoksa bile 200 dön
    return res.status(200).json({
      message: deleted ? 'Removed from wishlist' : 'Not in wishlist',
      deleted,
      productId
    });
  } catch (err) {
    console.error('removeFromWishlistByProduct error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Legacy handlers (route'larda kullanıyorsan bunlar aynı fonksiyona yönlensin)
 * - /add -> body.productId
 * - /remove/:productId
 */
exports.addToWishlist = exports.addToWishlistByProduct;
exports.removeFromWishlist = exports.removeFromWishlistByProduct;

/**
 * Eğer repo'da gerçekten move-to-cart var diyorsan burada bırak;
 * yoksa route'lardan kaldır.
 */
exports.moveToCart = async (req, res) => {
  return res.status(501).json({ message: 'moveToCart not implemented in this wishlist version' });
};