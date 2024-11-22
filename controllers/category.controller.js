import Category from "../models/category.model.js";
import NodeCache from "node-cache";
const cache = new NodeCache({
  stdTTL: 60 * 60, // 1 hour cache
  checkperiod: 120, // Check for expired keys every 2 minutes
  useClones: false, // Don't clone values when getting from cache
  deleteOnExpire: true, // Delete expired keys automatically
  enableStatistics: true,
});
const cacheKey = "categories-list";

const getCategories = async (req, res) => {
  try {
    // Check if the categories are in the cache
    let categories = cache.get(cacheKey);

    if (!categories) {
      // If not in cache, fetch categories from the database
      categories = await Category.find();

      // Store the fetched categories in the cache
      cache.set(cacheKey, categories);
      console.log("Categories fetched from database and cached.");
    } else {
      console.log("Categories retrieved from cache.");
    }
    res.json(categories);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

export { getCategories };
