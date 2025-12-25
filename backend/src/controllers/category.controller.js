const Category = require('../models/category.model');

exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.findAll();

    return res.json({
      success: true,
      data: categories,
      count: categories.length,
    });
  } catch (error) {
    console.error('Error in getAllCategories:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Category name is required' });
    }

    const category = await Category.create({
      name: name.trim(),
      description: description || null,
    });

    return res.status(201).json({ success: true, data: category });
  } catch (error) {
    console.error('Error in createCategory:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const deleted = await Category.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }
    return res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    console.error('Error in deleteCategory:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};