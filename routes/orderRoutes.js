import express from "express";
import Order from "../models/Order.js";
import Cart from "../models/Cart.js";

const router = express.Router();

// 🧾 Checkout (place order)
router.post("/checkout", async (req, res) => {
  const { userId } = req.body;

  try {
    const cart = await Cart.findOne({ user: userId }).populate("items.product");
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Calculate total
    const total = cart.items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );

    // Create new order
    const order = new Order({
      user: userId,
      items: cart.items,
      totalAmount: total,
    });

    await order.save();

    // Clear cart after checkout
    cart.items = [];
    await cart.save();

    res.json({ message: "Order placed successfully", order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
