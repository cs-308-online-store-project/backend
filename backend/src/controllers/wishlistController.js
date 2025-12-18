const Wishlist = require('../models/wishlistModel');

// GET /wishlist - Kullanıcının wishlist'ini getir
exports.getWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const items = await Wishlist.getByUserId(userId);
    
    res.json({ 
      success: true, 
      data: items 
    });
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// POST /wishlist/add - Wishlist'e ürün ekle
exports.addToWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { product_id } = req.body;
    
    if (!product_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Product ID is required' 
      });
    }
    
    await Wishlist.add(userId, product_id);
    
    res.status(201).json({ 
      success: true, 
      message: 'Added to wishlist' 
    });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    
    if (error.message === 'Product already in wishlist') {
      return res.status(400).json({ 
        success: false, 
        error: error.message 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// DELETE /wishlist/remove/:productId - Wishlist'ten ürün çıkar
exports.removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;
    
    await Wishlist.remove(userId, productId);
    
    res.json({ 
      success: true, 
      message: 'Removed from wishlist' 
    });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// GET /wishlist/count - Wishlist item sayısı
exports.getWishlistCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await Wishlist.getCount(userId);
    
    res.json({ 
      success: true, 
      count: count 
    });
  } catch (error) {
    console.error('Get wishlist count error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};