// server.js
import express from "express";
import mongoose from "mongoose";
import { engine } from "express-handlebars";
import { Server } from "socket.io";
import http from "http";
import path from "path";
import dotenv from "dotenv";
import viewsRouter from "./routes/views.js";
import productsRouter from "./routes/products.js";
import cartsRouter from "./routes/carts.js";
import { fileURLToPath } from "url";

dotenv.config();

// Paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Express app
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Handlebars setup with helpers
const hbs = engine({
  helpers: {
    eq: (a, b) => a === b,
    increment: (v) => v + 1,
    decrement: (v) => v - 1,
    lt: (a, b) => a < b,
    gt: (a, b) => a > b
  }
});
app.engine("handlebars", hbs);
app.set("view engine", "handlebars");
app.set("views", path.join(__dirname, "views"));

// Inject io into app so routes can use it
app.set("io", io);

// Routes
app.use("/", viewsRouter);
app.use("/api/products", productsRouter);
app.use("/api/carts", cartsRouter);

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/coderhouse_ecommerce";
mongoose.connect(MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// Socket.io events (global)
io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);

  // Example: emit current products to new connection
  const productsRouterInstance = app.get("io"); // if you need to access io inside routers
  // You can also handle chat messages or product updates here
});

// Start server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
