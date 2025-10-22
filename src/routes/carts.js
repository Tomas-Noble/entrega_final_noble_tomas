import { Router } from "express";
import mongoose from "mongoose";
import Cart from "../models/Cart.model.js";
import Product from "../models/Product.model.js";

const router = Router();

// POST create cart
router.post("/", async (req, res) => {
  try {
    const cart = await Cart.create({ products: [] });
    res.status(201).json({ status: "success", payload: cart });
  } catch (err) {
    res.status(500).json({ status: "error", error: err.message });
  }
});

// GET cart by id (populated)
router.get("/:cid", async (req, res) => {
  try {
    const { cid } = req.params;
    if (!mongoose.Types.ObjectId.isValid(cid)) return res.status(400).json({ status: "error", error: "Invalid cart id" });
    const cart = await Cart.findById(cid).populate("products.product");
    if (!cart) return res.status(404).json({ status: "error", error: "Cart not found" });
    res.json({ status: "success", payload: cart });
  } catch (err) {
    res.status(500).json({ status: "error", error: err.message });
  }
});

// POST add product to cart (increment if exists)
router.post("/:cid/product/:pid", async (req, res) => {
  try {
    const { cid, pid } = req.params;
    if (!mongoose.Types.ObjectId.isValid(cid) || !mongoose.Types.ObjectId.isValid(pid)) return res.status(400).json({ status: "error", error: "Invalid id" });

    const product = await Product.findById(pid);
    if (!product) return res.status(404).json({ status: "error", error: "Product not found" });

    const cart = await Cart.findById(cid);
    if (!cart) return res.status(404).json({ status: "error", error: "Cart not found" });

    const existing = cart.products.find(p => p.product.toString() === pid);
    if (existing) existing.quantity += 1;
    else cart.products.push({ product: pid, quantity: 1 });

    await cart.save();
    const populated = await Cart.findById(cid).populate("products.product");
    res.json({ status: "success", payload: populated });
  } catch (err) {
    res.status(500).json({ status: "error", error: err.message });
  }
});

// DELETE api/carts/:cid/products/:pid -> remove product from cart
router.delete("/:cid/products/:pid", async (req, res) => {
  try {
    const { cid, pid } = req.params;
    if (!mongoose.Types.ObjectId.isValid(cid) || !mongoose.Types.ObjectId.isValid(pid)) return res.status(400).json({ status: "error", error: "Invalid id" });

    const cart = await Cart.findById(cid);
    if (!cart) return res.status(404).json({ status: "error", error: "Cart not found" });

    cart.products = cart.products.filter(p => p.product.toString() !== pid);
    await cart.save();
    const populated = await Cart.findById(cid).populate("products.product");
    res.json({ status: "success", payload: populated });
  } catch (err) {
    res.status(500).json({ status: "error", error: err.message });
  }
});

// PUT api/carts/:cid -> replace full products array (expects array of { product, quantity })
router.put("/:cid", async (req, res) => {
  try {
    const { cid } = req.params;
    const { products } = req.body;
    if (!Array.isArray(products)) return res.status(400).json({ status: "error", error: "Products must be an array" });

    // validate ids
    for (const p of products) {
      if (!mongoose.Types.ObjectId.isValid(p.product)) return res.status(400).json({ status: "error", error: "Invalid product id in array" });
    }

    const cart = await Cart.findByIdAndUpdate(cid, { products }, { new: true });
    if (!cart) return res.status(404).json({ status: "error", error: "Cart not found" });

    const populated = await Cart.findById(cart._id).populate("products.product");
    res.json({ status: "success", payload: populated });
  } catch (err) {
    res.status(500).json({ status: "error", error: err.message });
  }
});

// PUT api/carts/:cid/products/:pid -> update only quantity for product
router.put("/:cid/products/:pid", async (req, res) => {
  try {
    const { cid, pid } = req.params;
    let { quantity } = req.body;
    quantity = Number(quantity);
    if (!quantity || quantity < 1) return res.status(400).json({ status: "error", error: "Quantity must be >= 1" });

    const cart = await Cart.findById(cid);
    if (!cart) return res.status(404).json({ status: "error", error: "Cart not found" });

    const prod = cart.products.find(p => p.product.toString() === pid);
    if (!prod) return res.status(404).json({ status: "error", error: "Product not in cart" });

    prod.quantity = quantity;
    await cart.save();
    const populated = await Cart.findById(cid).populate("products.product");
    res.json({ status: "success", payload: populated });
  } catch (err) {
    res.status(500).json({ status: "error", error: err.message });
  }
});

// DELETE api/carts/:cid -> delete all products
router.delete("/:cid", async (req, res) => {
  try {
    const { cid } = req.params;
    const cart = await Cart.findById(cid);
    if (!cart) return res.status(404).json({ status: "error", error: "Cart not found" });

    cart.products = [];
    await cart.save();
    res.json({ status: "success", payload: cart });
  } catch (err) {
    res.status(500).json({ status: "error", error: err.message });
  }
});

export default router;
