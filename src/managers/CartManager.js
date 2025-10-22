import Cart from "../models/Cart.model.js";
import Product from "../models/Product.model.js";

export default class CartManager {
  async createCart() {
    const cart = await Cart.create({ products: [] });
    return cart;
  }

  async getById(id) {
    return Cart.findById(id).populate("products.product");
  }

  async addProduct(cartId, productId, qty = 1) {
    const cart = await Cart.findById(cartId);
    if (!cart) return null;
    const exists = cart.products.find(p => p.product.toString() === productId.toString());
    if (exists) {
      exists.quantity += qty;
    } else {
      // validate product exists
      const product = await Product.findById(productId);
      if (!product) return null;
      cart.products.push({ product: product._id, quantity: qty });
    }
    await cart.save();
    return cart;
  }

  async removeProduct(cartId, productId) {
    const cart = await Cart.findById(cartId);
    if (!cart) return null;
    cart.products = cart.products.filter(p => p.product.toString() !== productId.toString());
    await cart.save();
    return cart;
  }

  async updateProducts(cartId, productsArray) {
    // productsArray: [{ product: productId, quantity }]
    const cart = await Cart.findById(cartId);
    if (!cart) return null;
    cart.products = productsArray.map(p => ({ product: p.product, quantity: p.quantity }));
    await cart.save();
    return cart;
  }

  async updateQuantity(cartId, productId, quantity) {
    const cart = await Cart.findById(cartId);
    if (!cart) return null;
    const prod = cart.products.find(p => p.product.toString() === productId.toString());
    if (!prod) return null;
    prod.quantity = quantity;
    await cart.save();
    return cart;
  }

  async clearCart(cartId) {
    const cart = await Cart.findById(cartId);
    if (!cart) return null;
    cart.products = [];
    await cart.save();
    return cart;
  }
}
