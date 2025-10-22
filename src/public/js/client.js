// client helpers for add-to-cart and cart interaction

async function ensureCart() {
  let cid = localStorage.getItem("cartId");
  if (!cid) {
    const res = await fetch("/api/carts", { method: "POST" });
    const data = await res.json();
    cid = data.payload._id || data.payload.id || data.payload;
    localStorage.setItem("cartId", cid);
  }
  return cid;
}

async function addToCart(pid) {
  const cid = await ensureCart();
  await fetch(`/api/carts/${cid}/product/${pid}`, { method: "POST" });
  alert("Producto agregado al carrito");
}

// expose function to global scope used by inline onclicks
window.addToCart = addToCart;

// add-to-cart buttons on products list
document.addEventListener("click", async (e) => {
  if (e.target.matches(".add-to-cart")) {
    const pid = e.target.dataset.id;
    addToCart(pid);
  }
});

// Cart page handlers (update qty, remove, clear)
document.addEventListener("submit", async (e) => {
  if (e.target.matches(".update-qty")) {
    e.preventDefault();
    const pid = e.target.dataset.pid;
    const qty = e.target.quantity.value;
    const cid = location.pathname.split("/").pop();
    await fetch(`/api/carts/${cid}/products/${pid}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: Number(qty) })
    });
    location.reload();
  }

  if (e.target.matches("#clear-cart")) {
    e.preventDefault();
    const cid = location.pathname.split("/").pop();
    await fetch(`/api/carts/${cid}`, { method: "DELETE" });
    location.reload();
  }
});

// remove product button
document.addEventListener("click", async (e) => {
  if (e.target.matches(".remove")) {
    const pid = e.target.dataset.pid;
    const cid = location.pathname.split("/").pop();
    await fetch(`/api/carts/${cid}/products/${pid}`, { method: "DELETE" });
    location.reload();
  }
});
