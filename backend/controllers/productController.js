const Product = require('../models/Product');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/responseHandler');

// @desc    Get all products with filtering, search, sorting, pagination
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  const {
    search,
    category,
    brand,
    color,
    minPrice,
    maxPrice,
    rating,
    isNew,
    isTrending,
    sort = 'newest',
    page = 1,
    limit = 12,
  } = req.query;

  const query = { isActive: true };

  // Text search
  if (search) {
    query.$text = { $search: search };
  }

  // Filters
  if (category) query.category = category;
  if (brand) query.brand = { $regex: brand, $options: 'i' };
  if (color) query.colors = { $in: [color] };
  if (isNew === 'true') query.isNew = true;
  if (isTrending === 'true') query.isTrending = true;

  // Price range
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  // Rating filter
  if (rating) {
    query.rating = { $gte: Number(rating) };
  }

  // Sorting
  let sortOption = {};
  switch (sort) {
    case 'price_asc':
      sortOption = { price: 1 };
      break;
    case 'price_desc':
      sortOption = { price: -1 };
      break;
    case 'rating':
      sortOption = { rating: -1 };
      break;
    case 'newest':
    default:
      sortOption = { createdAt: -1 };
  }

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Product.countDocuments(query);
  const products = await Product.find(query).sort(sortOption).skip(skip).limit(Number(limit));

  return paginatedResponse(res, 'Products fetched successfully', products, page, limit, total);
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product || !product.isActive) {
    return errorResponse(res, 'Product not found', 404);
  }
  return successResponse(res, 'Product fetched successfully', product);
};

// @desc    Get featured/trending/new products
// @route   GET /api/products/featured
// @access  Public
const getFeaturedProducts = async (req, res) => {
  const [trending, newArrivals, popular] = await Promise.all([
    Product.find({ isTrending: true, isActive: true }).limit(8).sort({ createdAt: -1 }),
    Product.find({ isNew: true, isActive: true }).limit(8).sort({ createdAt: -1 }),
    Product.find({ isActive: true }).sort({ rating: -1, reviewCount: -1 }).limit(8),
  ]);

  return successResponse(res, 'Featured products fetched', { trending, newArrivals, popular });
};

// @desc    Get related products
// @route   GET /api/products/:id/related
// @access  Public
const getRelatedProducts = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return errorResponse(res, 'Product not found', 404);

  const related = await Product.find({
    _id: { $ne: product._id },
    isActive: true,
    $or: [{ category: product.category }, { brand: product.brand }],
  }).limit(6);

  return successResponse(res, 'Related products fetched', related);
};

// @desc    Get all distinct categories and brands
// @route   GET /api/products/meta
// @access  Public
const getProductMeta = async (req, res) => {
  const [brands, colors] = await Promise.all([
    Product.distinct('brand', { isActive: true }),
    Product.distinct('colors', { isActive: true }),
  ]);
  return successResponse(res, 'Product meta fetched', { brands, colors });
};

// @desc    Create product (admin)
// @route   POST /api/products
// @access  Admin
const createProduct = async (req, res) => {
  const product = await Product.create(req.body);
  return successResponse(res, 'Product created successfully', product, 201);
};

// @desc    Update product (admin)
// @route   PUT /api/products/:id
// @access  Admin
const updateProduct = async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!product) return errorResponse(res, 'Product not found', 404);
  return successResponse(res, 'Product updated successfully', product);
};

// @desc    Delete product (admin)
// @route   DELETE /api/products/:id
// @access  Admin
const deleteProduct = async (req, res) => {
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );
  if (!product) return errorResponse(res, 'Product not found', 404);
  return successResponse(res, 'Product deleted successfully');
};

module.exports = {
  getProducts,
  getProductById,
  getFeaturedProducts,
  getRelatedProducts,
  getProductMeta,
  createProduct,
  updateProduct,
  deleteProduct,
};
