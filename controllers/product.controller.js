import Product from "../models/product.model.js";
import Category from "../models/category.model.js";
import User from "../models/user.model.js";

const getTopProducts = async (req, res) => {
  try {
    // Parse query parameters for pagination
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = parseInt(req.query.limit) || 10; // Default to 10 items per page
    const skip = (page - 1) * limit;

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

    // Return paginated response
    res.json({
      totalProducts, // Total number of products matching the filter
      currentPage: page,
      totalPages: Math.ceil(totalProducts / limit),
      products,
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const getProductDetails = async (req, res) => {
  try {
    const { productId } = req.params;

    // Fetch the product by ID
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).send("Product not found");
    }  

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

    // Return paginated response
    res.json({
      totalProducts, // Total number of products matching the filter
      currentPage: page,
      totalPages: Math.ceil(totalProducts / limit),
      products,
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const getProductsBetweenPriceRange = async (req, res) => {
  try {
    // Parse query parameters
    const minPrice = parseInt(req.query.minPrice) || 0; // Default to 0
    const maxPrice = parseInt(req.query.maxPrice) || 200; // Default to 100000
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = parseInt(req.query.limit) || 10; // Default to 10 items per page
    const skip = (page - 1) * limit;

    // Fetch products with pagination, filtering, and sorting
    const products = await Product.find({
      price: { $gte: minPrice, $lte: maxPrice }, // Filter products with price between min and max
    })
      .sort({ price: 1, createdAt: -1 }) // Sort by price, then creation date
      .skip(skip) // Skip items for previous pages
      .limit(limit); // Limit items for the current page

    // Count total products for the filter
    const totalProducts = await Product.countDocuments({
      price: { $gte: minPrice, $lte: maxPrice },
    });

    // Return paginated response
    res.json({
      totalProducts, // Total number of products matching the filter
      currentPage: page,
      totalPages: Math.ceil(totalProducts / limit),
      products,
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const searchProducts = async (req, res) => {
  try {
    // Parse query parameter for search
    const { search } = req.query; // Retrieve search query from query parameters

    if (!search) {
      return res.status(400).send("Search query is required");
    }

    // Optional: Use a regex with optional wildcard support and case-insensitivity
    // Improved regex matching to allow more flexible search
    const regex = new RegExp(search, "i"); // Case-insensitive regex

    // Fetch products using a case-insensitive partial match for product name
    const products = await Product.find({
      $text: { $search: search }  // Full-text search for matching products
    }).sort({ rating: -1, createdAt: -1 });

    // Return all matching products
    res.json({
      totalProducts: products.length, // Total number of products matching the search
      products,
    });
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
  getProductsBetweenPriceRange,
  searchProducts,
  addProductToCart,
  removeProductFromCart,
  getProductsOfCart,
  getProductDetails
};
