import { Router } from "express";
import Product from "../models/Product.model.js";
import Cart from "../models/Cart.model.js";

const router = Router();

// Products listing with pagination/filtering (rendered)
router.get("/products", async (req, res) => {
  try {
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const sort = req.query.sort === "asc" ? 1 : req.query.sort === "desc" ? -1 : null;
    const q = req.query.query;

    const filter = {};
    if (q) {
      if (q.includes(":")) {
        const [k, ...rest] = q.split(":");
        const value = rest.join(":");
        if (k === "category") filter.category = value;
        else if (k === "status") filter.status = (value === "true" || value === "1");
        else filter.$or = [{ title: { $regex: q, $options: "i" } }, { description: { $regex: q, $options: "i" } }];
      } else {
        filter.$or = [{ title: { $regex: q, $options: "i" } }, { description: { $regex: q, $options: "i" } }];
      }
    }

    const totalDocs = await Product.countDocuments(filter);
    const totalPages = Math.max(1, Math.ceil(totalDocs / limit));
    const skip = (page - 1) * limit;

    let query = Product.find(filter).skip(skip).limit(limit);
    if (sort !== null) query = query.sort({ price: sort });

    const products = await query.exec();

    const hasPrevPage = page > 1;
    const hasNextPage = page < totalPages;
    const prevPage = hasPrevPage ? page - 1 : null;
    const nextPage = hasNextPage ? page + 1 : null;

    // build links (relative)
    const buildLink = (p) => p ? `/products?${new URLSearchParams({ ...req.query, page: p.toString(), limit: limit.toString() }).toString()}` : null;

    res.render("products", {
      title: "Productos",
      products,
      totalPages,
      prevPage,
      nextPage,
      page,
      hasPrevPage,
      hasNextPage,
      prevLink: buildLink(prevPage),
      nextLink: buildLink(nextPage),
      query: req.query.query || "",
      sort: req.query.sort || "",
      limit
    });
  } catch (err) {
    res.status(500).send("Error rendering products");
  }
});

// Product detail view
router.get("/products/:pid", async (req, res) => {
  try {
    const product = await Product.findById(req.params.pid);
    if (!product) return res.status(404).send("Product not found");
    res.render("productDetail", { title: product.title, product });
  } catch (err) {
    res.status(500).send("Error rendering product detail");
  }
});

// Cart view
router.get("/carts/:cid", async (req, res) => {
  try {
    const cart = await Cart.findById(req.params.cid).populate("products.product");
    if (!cart) return res.status(404).send("Cart not found");
    res.render("cart", { title: "Carrito", cart });
  } catch (err) {
    res.status(500).send("Error rendering cart");
  }
});

export default router;
