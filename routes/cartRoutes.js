import express from "express";
import mongoose from "mongoose";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

const router = express.Router(); // ✅ initialize router

// 🛒 Add product to cart
router.post("/add", async (req, res) => {
  const { userId, productId, quantity } = req.body;

  try {
    let cart = await Cart.findOne({ user: userId });
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    const existingItem = cart.items.find(
      (item) => item.product.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ product: productId, quantity });
    }

    await cart.save();
    res.json({ message: "Product added to cart", cart });
  } catch (err) {
    console.error("❌ Add Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 👀 View cart
router.get("/:userId", async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.params.userId }).populate(
      "items.product"
    );
    res.json(cart || { message: "Cart is empty" });
  } catch (err) {
    console.error("❌ View Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ❌ Remove item from cart (POST to match frontend)
router.post("/remove", async (req, res) => {
  const { userId, productId } = req.body;

  try {
    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const beforeCount = cart.items.length;

    console.log("Removing product:", productId);
    console.log(
      "Current cart items:",
      cart.items.map((i) => i.product.toString())
    );

    // convert productId to ObjectId safely
    const pid = new mongoose.Types.ObjectId(productId);

    cart.items = cart.items.filter((item) => !item.product.equals(pid));

    if (cart.items.length === beforeCount) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    await cart.save();
    res.json({ message: "Item removed from cart", cart });
  } catch (err) {
    console.error("❌ Remove Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 🧹 Clear cart (for checkout)
router.post("/clear/:userId", async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.params.userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = [];
    await cart.save();
    res.json({ message: "Cart cleared successfully" });
  } catch (err) {
    console.error("❌ Clear Error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router; // ✅ export router for ES module use
