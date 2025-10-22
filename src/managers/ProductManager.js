import Product from "../models/Product.model.js";

export default class ProductManager {
  async getAll(filter = {}, options = {}) {
    // options: { limit, page, sort }
    const limit = options.limit || 10;
    const page = options.page || 1;
    const skip = (page - 1) * limit;
    const sort = options.sort || null;

    let query = Product.find(filter).skip(skip).limit(limit);
    if (sort) query = query.sort({ price: sort });

    const products = await query.exec();
    const total = await Product.countDocuments(filter);
    return { products, total, limit, page };
  }

  async getById(id) {
    return Product.findById(id);
  }

  async create(data) {
    return Product.create(data);
  }

  async update(id, updates) {
    return Product.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
  }

  async delete(id) {
    return Product.findByIdAndDelete(id);
  }
}
