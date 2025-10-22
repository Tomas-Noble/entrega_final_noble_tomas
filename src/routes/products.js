import { Router } from "express";
import Product from "../models/Product.model.js";
import mongoose from "mongoose";

const router = Router();

/**
 GET /api/products
 Query params:
  - limit (default 10)
  - page (default 1)
  - sort: 'asc'|'desc' (by price)
  - query: 'category:Electronics' or 'status:true' or free text
 Returns specified response shape required by consigna.
*/
router.get("/", async (req, res) => {
  try {
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const sortQuery = req.query.sort;
    const sort = sortQuery === "asc" ? 1 : sortQuery === "desc" ? -1 : null;
    const q = req.query.query;

    // Build filter
    const filter = {};
    if (q) {
      if (q.includes(":")) {
        const [k, ...rest] = q.split(":");
        const value = rest.join(":");
        if (k === "category") filter.category = value;
        else if (k === "status") filter.status = (value === "true" || value === "1");
        else if (k === "stock") {
          // support stock:>0 (e.g. stock:>0) or stock:10
          if (value.startsWith(">")) filter.stock = { $gt: Number(value.slice(1)) };
          else filter.stock = Number(value);
        } else {
          // fallback text search
          filter.$or = [
            { title: { $regex: q, $options: "i" } },
            { description: { $regex: q, $options: "i" } }
          ];
        }
      } else {
        filter.$or = [
          { title: { $regex: q, $options: "i" } },
          { description: { $regex: q, $options: "i" } },
          { category: { $regex: q, $options: "i" } }
        ];
      }
    }

    // Count & query
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

    // Link builder
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
    const buildLink = (p) => {
      if (!p) return null;
      const params = new URLSearchParams({ ...req.query, page: p.toString(), limit: limit.toString() });
      return `${baseUrl}${req.baseUrl || ""}${req.path}?${params.toString()}`;
    };

    res.json({
      status: "success",
      payload: products,
      totalPages,
      prevPage,
      nextPage,
      page,
      hasPrevPage,
      hasNextPage,
      prevLink: buildLink(prevPage),
      nextLink: buildLink(nextPage)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", error: err.message });
  }
});

// GET product by id
router.get("/:pid", async (req, res) => {
  try {
    const { pid } = req.params;
    if (!mongoose.Types.ObjectId.isValid(pid)) return res.status(400).json({ status: "error", error: "Invalid product id" });
    const product = await Product.findById(pid);
    if (!product) return res.status(404).json({ status: "error", error: "Product not found" });
    res.json({ status: "success", payload: product });
  } catch (err) {
    res.status(500).json({ status: "error", error: err.message });
  }
});

// POST create product
router.post("/", async (req, res) => {
  try {
    const data = req.body;
    const created = await Product.create(data);

    // Emit via socket if available
    const io = req.app.get("io");
    if (io) io.emit("updateProducts", await Product.find({}).limit(1000));

    res.status(201).json({ status: "success", payload: created });
  } catch (err) {
    res.status(400).json({ status: "error", error: err.message });
  }
});

// PUT update product
router.put("/:pid", async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(req.params.pid, req.body, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ status: "error", error: "Product not found" });

    const io = req.app.get("io");
    if (io) io.emit("updateProducts", await Product.find({}).limit(1000));

    res.json({ status: "success", payload: updated });
  } catch (err) {
    res.status(400).json({ status: "error", error: err.message });
  }
});

// DELETE product
router.delete("/:pid", async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.pid);
    if (!deleted) return res.status(404).json({ status: "error", error: "Product not found" });

    const io = req.app.get("io");
    if (io) io.emit("updateProducts", await Product.find({}).limit(1000));

    res.json({ status: "success", payload: deleted });
  } catch (err) {
    res.status(500).json({ status: "error", error: err.message });
  }
});

export default router;
