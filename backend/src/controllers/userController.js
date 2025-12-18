const knex = require('../db/knex');

// GET /users/profile - Get current user profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await knex('users')
      .where({ id: userId })
      .select('id', 'name', 'tax_id', 'email', 'address', 'role')
      .first();

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    return res.json({ 
      success: true, 
      data: user 
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// PUT /users/profile - Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, tax_id, address } = req.body;

    // Validate at least one field is provided
    if (!name && !tax_id && !address) {
      return res.status(400).json({ 
        success: false, 
        error: 'At least one field must be provided' 
      });
    }

    // Build update object
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (tax_id !== undefined) updates.tax_id = tax_id;
    if (address !== undefined) updates.address = address;

    // Update user
    const [updatedUser] = await knex('users')
      .where({ id: userId })
      .update(updates)
      .returning(['id', 'name', 'tax_id', 'email', 'address', 'role']);

    if (!updatedUser) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    return res.json({ 
      success: true, 
      message: 'Profile updated successfully',
      data: updatedUser 
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};