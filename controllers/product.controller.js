import Product from "../models/product.model.js";
import Category from "../models/category.model.js";
import User from "../models/user.model.js";
import NodeCache from "node-cache";

const cache = new NodeCache({
  stdTTL: 60 * 60, // 1 hour cache
  checkperiod: 120, // Check for expired keys every 2 minutes
  useClones: false, // Don't clone values when getting from cache
  deleteOnExpire: true, // Delete expired keys automatically
  // Optionally enable statistics
  enableStatistics: true,
});


const getTopProducts = async (req, res) => {
  try {
    // Parse query parameters for pagination
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = parseInt(req.query.limit) || 10; // Default to 10 items per page
    const skip = (page - 1) * limit;

    // Create a unique cache key based on the query
    const cacheKey = `top-products-page-${page}-limit-${limit}`;

    // Check if data is available in cache
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      console.log('Serving from cache');
      return res.json(cachedData);
    }

    // Fetch products with pagination, filtering, and sorting
    const products = await Product.find({
      rating: { $gte: 4 }, // Filter products with rating >= 4
    })
      .sort({ rating: -1, createdAt: -1 }) // Sort by rating, then creation date
      .skip(skip) // Skip items for previous pages
      .limit(limit); // Limit items for the current page

    // Count total products for the filter
    const totalProducts = await Product.countDocuments({
      rating: { $gte: 4 },
    });

    // Construct response object
    const responseData = {
      totalProducts, // Total number of products matching the filter
      currentPage: page,
      totalPages: Math.ceil(totalProducts / limit),
      products,
    };

    // Store the response in cache with the cache key
    cache.set(cacheKey, responseData);

    // Return the response
    res.json(responseData);
  } catch (error) {
    res.status(500).send(error.message);
  }
};


const getProductDetails = async (req, res) => {
  try {
    const { productId } = req.params;

    const cacheKey = `product-${productId}`;

    // Check if data is available in cache
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      console.log('Serving from cache');
      return res.json(cachedData);
    }

    // Fetch the product by ID
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).send("Product not found");
    } 

    // Store the response in cache with the cache key
    cache.set(cacheKey, product);
    res.json(product);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const getProductsByCategory = async (req, res) => {
  try {
    // Parse query parameters
    const { category } = req.query; // Retrieve category from query parameters
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = parseInt(req.query.limit) || 10; // Default to 10 items per page
    const skip = (page - 1) * limit;

    if (!category) {
      return res.status(400).send("Category name is required");
    }

    // Create a unique cache key based on category, page, and limit
    const cacheKey = `category-${category}-page-${page}-limit-${limit}`;

    // Check if data is available in cache
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      console.log('Serving from cache');
      return res.json(cachedData);
    }

    // Fetch categories using a case-insensitive partial match for category name
    const categoryDocuments = await Category.find({
      name: { $regex: category, $options: "i" }, // Case-insensitive search
    });

    if (categoryDocuments.length === 0) {
      return res.status(404).send("No categories found matching that name");
    }

    // Extract category IDs from the found categories
    const categoryIds = categoryDocuments.map((cat) => cat._id);

    // Fetch products matching the category IDs and apply pagination
    const products = await Product.find({
      category: { $in: categoryIds }, // Match products that belong to any of the found categories
    })
      .sort({ rating: -1, createdAt: -1 }) // Sort by rating, then creation date
      .skip(skip) // Skip items for previous pages
      .limit(limit); // Limit items for the current page

    // Count total products for the filter
    const totalProducts = await Product.countDocuments({
      category: { $in: categoryIds }, // Match products that belong to any of the found categories
    });

    // Construct response object
    const responseData = {
      totalProducts, // Total number of products matching the filter
      currentPage: page,
      totalPages: Math.ceil(totalProducts / limit),
      products,
    };

    // Store the response in cache with the cache key
    cache.set(cacheKey, responseData);

    // Return the response
    res.json(responseData);
  } catch (error) {
    res.status(500).send(error.message);
  }
};


const getProductsBetweenPriceRangeInCategory = async (req, res) => {
  try {
    // Set default values for query parameters
    const DEFAULT_MIN_PRICE = 0;
    const DEFAULT_MAX_PRICE = 200;
    const DEFAULT_PAGE = 1;
    const DEFAULT_LIMIT = 10;

    // Parse query parameters with defaults
    const minPrice = parseInt(req.query.minPrice) || DEFAULT_MIN_PRICE;
    const maxPrice = parseInt(req.query.maxPrice) || DEFAULT_MAX_PRICE;
    const page = parseInt(req.query.page) || DEFAULT_PAGE;
    const limit = parseInt(req.query.limit) || DEFAULT_LIMIT;
    const category = req.query.category || null; // Get category from query parameters

    // Validate query parameters
    if (minPrice < 0 || maxPrice < 0 || page < 1 || limit < 1) {
      return res.status(400).json({
        message: "Invalid query parameters. Ensure all values are positive.",
      });
    }
    if (!category) {
      return res.status(400).json({
        message: "Category is required.",
      });
    }

    const skip = (page - 1) * limit;

    // Query filters and options
    const filter = {
      price: { $gte: minPrice, $lte: maxPrice },
      category, // Filter by category
    };
    const options = {
      sort: { price: 1, createdAt: -1 },
      skip,
      limit,
    };

    // Fetch products with filters and options
    const [products, totalProducts] = await Promise.all([
      Product.find(filter, null, options),
      Product.countDocuments(filter),
    ]);

    // Return paginated response
    res.json({
      totalProducts, // Total number of products matching the filter
      currentPage: page,
      totalPages: Math.ceil(totalProducts / limit),
      products,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({
      message: "An error occurred while fetching products.",
      error: error.message,
    });
  }
};



const searchProducts = async (req, res) => {
  try {
    // Parse query parameter for search
    const { search } = req.query; // Retrieve search query from query parameters

    if (!search) {
      return res.status(400).send("Search query is required");
    }

    // Create a unique cache key based on the search query
    const cacheKey = `search-${search}`;

    // Check if data is available in cache
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      console.log('Serving search results from cache');
      return res.json(cachedData);
    }

    // Use regex for case-insensitive partial match
    const regex = new RegExp(search, "i");

    // Fetch products using case-insensitive partial match or full-text search
    const products = await Product.find({
      $or: [
        { name: regex }, // Case-insensitive regex match on product name
        { description: regex }, // Optional: Match description if needed
      ],
    }).sort({ rating: -1, createdAt: -1 });

    // Construct response object
    const responseData = {
      totalProducts: products.length, // Total number of products matching the search
      products,
    };

    // Store the response in cache with the cache key
    cache.set(cacheKey, responseData);

    // Return the response
    res.json(responseData);
  } catch (error) {
    res.status(500).send(error.message);
  }
};


const addProductToCart = async (req, res) => {
  try {
    // Parse product ID and quantity from the request body
    const { productId, quantity } = req.body;

    // Fetch the product by ID
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).send("Product not found");
    }

    // Find the user by their ID (ensure the user ID is passed in the request or available in req.user)
    const userId = req.user._id; // Assuming the user ID is available from the auth middleware
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).send("User not found");
    }

    // Check if the product is already in the user's cart
    const existingProduct = user.cart.find(
      (item) => item.product.toString() === productId
    );

    if (existingProduct) {
      // If the product is already in the cart, update the quantity
      existingProduct.quantity += quantity;  // Increase the quantity by the quantity specified
    } else {
      // If the product is not in the cart, add it with the specified quantity
      user.cart.push({ product: productId, quantity });
    }

    // Save the updated user with the modified cart
    await user.save();

    res.json({
      message: "Product added to cart",
      cart: user.cart  // Optionally send the updated cart in the response
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
};



const removeProductFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user._id; // Assuming user is authenticated and req.user has _id

    // Find the user by userId
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).send("User not found");
    }

    // Find and remove the product from the user's cart
    user.cart = user.cart.filter(item => item.product.toString() !== productId);

    // Save the updated user data
    await user.save();

    res.json({
      message: "Product removed from cart",
    }); // Respond with an empty JSON object
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const getProductsOfCart = async (req, res) => {
  try {
    // Find the user by ID and populate the cart's product field
    const user = await User.findById(req.user._id).populate("cart.product");

    if (!user) {
      return res.status(404).send("User not found");
    }

    // Map over the user's cart and include both the product details and the quantity
    const productsWithQuantity = user.cart.map(item => ({
      product: item.product,
      quantity: item.quantity
    }));

    res.json(productsWithQuantity);
  } catch (error) {
    res.status(500).send(error.message);
  }
};



export {
  getTopProducts,
  getProductsByCategory,
  getProductsBetweenPriceRangeInCategory,
  searchProducts,
  addProductToCart,
  removeProductFromCart,
  getProductsOfCart,
  getProductDetails
};
