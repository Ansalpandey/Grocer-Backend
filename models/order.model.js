import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  orderItems: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
      quantity: { type: Number},
    },
  ],
  shippingAddress: {
    address: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
  },
  totalPrice: { type: Number, required: true, default: 0.0 },
  isOrderShipped: { type: Boolean, required: true, default: false },
  isOutForDelivery: { type: Boolean, required: true, default: false },
  isDelivered: { type: Boolean, required: true, default: false },
},
  { timestamps: true }
);

const Order = mongoose.model('Order', orderSchema);

export default Order;
