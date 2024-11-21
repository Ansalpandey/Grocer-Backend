import Order from "../models/order.model.js";
import Product from "../models/product.model.js";

const createOrder = async (req, res) => {
  const user = req.user; // Get the logged-in user from the request (assuming it's populated via middleware)
  const { orderItems, shippingAddress, totalPrice} = req.body; // Destructure from the request body

  try {
    // Validate each order item to ensure the product exists
    for (let i = 0; i < orderItems.length; i++) {
      const product = await Product.findById(orderItems[i].product);

      if (!product) {
        return res
          .status(404)
          .json({
            message: `Product with ID ${orderItems[i].product} not found`,
          });
      }
    }

    // Create a new order object with validated data
    const order = new Order({
      user,
      orderItems, // Order items passed from the request
      shippingAddress, // Shipping address passed from the request
      totalPrice, // Total price of the order passed from the request
    });

    // Save the order to the database
    await order.save();

    // Respond with the created order
    res.status(201).json({ message: "Order created successfully"});
  } catch (error) {
    // Handle errors and send a response
    res.status(400).json({ message: error.message });
  }
};

const getOrders = async (req, res) => {
  const user = req.user;
  try {
    // Fetch all orders and populate the user field
    const orders = await Order.find({
      user: user._id,
    })
      .populate("user", "name email phone")
      .populate("orderItems.product", "name price productImage")
      .populate("shippingAddress");

    // Map through orders and add a status step for each order
    const orderWithStatus = orders.map((order) => {
      // Set the current status based on the order's flags
      let status = [];
      if (!order.isOrderShipped) {
        status.push("Order Placed");
      }
      if (order.isOrderShipped && !order.isOutForDelivery) {
        status.push("Order Shipped");
      }
      if (order.isOutForDelivery && !order.isDelivered) {
        status.push("Out for Delivery");
      }
      if (order.isDelivered) {
        status.push("Order Delivered");
      }

      // Return the order with status
      return {
        ...order.toObject(),
        status,
      };
    });

    // Respond with the list of orders with statuses
    res.json(orderWithStatus);
  } catch (error) {
    // Handle errors and send a response
    res.status(500).json({ message: error.message });
  }
};


export { createOrder, getOrders };
