import Category from "../models/category.model.js";

const getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

export { getCategories };