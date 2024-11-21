import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  productImage: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  inStock: {
    type: Boolean,
    default: true,
  },
  price: {
    type: Number,
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: [0, "Rating must be at least 1"], // Minimum value is 1
    max: [5, "Rating must be at most 5"], // Maximum value is 5
    default: 0, // Default rating value
  },
  discount: {
    type: Number,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
});
productSchema.index({ name: "text" });

const Product = mongoose.model('Product', productSchema);


export default Product;