(function () {
  const storedConfig = readStorage("eliteConfigPreview");
  const config = { ...window.ELITE_CONFIG, ...(storedConfig || {}) };
  const storedProducts = readStorage("eliteProductsPreview");
  const products = Array.isArray(storedProducts) ? storedProducts : window.ELITE_PRODUCTS;
  const cart = new Map(JSON.parse(localStorage.getItem("eliteCart") || "[]"));

  const grid = document.querySelector("[data-product-grid]");
  const categoryWrap = document.querySelector("[data-categories]");
  const searchInput = document.querySelector("[data-search]");
  const cartDrawer = document.querySelector("[data-cart-drawer]");
  const cartItems = document.querySelector("[data-cart-items]");
  const cartEmpty = document.querySelector("[data-cart-empty]");
  const cartTotal = document.querySelector("[data-cart-total]");
  const cartCount = document.querySelector("[data-cart-count]");
  const checkoutForm = document.querySelector("[data-checkout-form]");
  const upiLink = document.querySelector("[data-upi-link]");
  const whatsappLink = document.querySelector("[data-whatsapp-link]");
  const toast = document.querySelector("[data-toast]");
  let currentCategory = "All";

  init();

  function init() {
    renderCategories();
    renderProducts();
    renderCart();
    wireEvents();
    whatsappLink.href = buildWhatsAppUrl("Hello Elite Crystal Hubb, I need help choosing crystal products.");
  }

  function wireEvents() {
    document.querySelector("[data-open-cart]").addEventListener("click", openCart);
    document.querySelector("[data-close-cart]").addEventListener("click", closeCart);
    cartDrawer.addEventListener("click", (event) => {
      if (event.target === cartDrawer) closeCart();
    });
    searchInput.addEventListener("input", renderProducts);
    checkoutForm.addEventListener("submit", submitOrder);
    upiLink.addEventListener("click", (event) => {
      if (!getCartLines().length) {
        event.preventDefault();
        showToast("Add a product before payment.");
      }
    });
  }

  function renderCategories() {
    const categories = ["All", ...new Set(products.map((product) => product.category))];
    categoryWrap.innerHTML = categories.map((category) => {
      return `<button class="tab ${category === currentCategory ? "active" : ""}" type="button" data-category="${escapeAttr(category)}">${escapeHtml(category)}</button>`;
    }).join("");
    categoryWrap.querySelectorAll("[data-category]").forEach((button) => {
      button.addEventListener("click", () => {
        currentCategory = button.dataset.category;
        renderCategories();
        renderProducts();
      });
    });
  }

  function renderProducts() {
    const query = searchInput.value.trim().toLowerCase();
    const filtered = products.filter((product) => {
      const searchable = [product.name, product.category, product.description, ...(product.tags || [])].join(" ").toLowerCase();
      const matchesSearch = !query || searchable.includes(query);
      const matchesCategory = currentCategory === "All" || product.category === currentCategory;
      return matchesSearch && matchesCategory;
    });

    if (!filtered.length) {
      grid.innerHTML = `<div class="empty-state">No matching products found.</div>`;
      return;
    }

    grid.innerHTML = filtered.map((product) => productCard(product)).join("");
    grid.querySelectorAll("[data-add]").forEach((button) => {
      button.addEventListener("click", () => addToCart(button.dataset.add));
    });
  }

  function openCart() {
    cartDrawer.classList.add("open");
    cartDrawer.setAttribute("aria-hidden", "false");
  }

  function closeCart() {
    cartDrawer.classList.remove("open");
    cartDrawer.setAttribute("aria-hidden", "true");
  }

  function productCard(product) {
    const disabled = Number(product.stock) <= 0;
    return `
      <article class="product-card">
        <div class="product-media">
          <img src="${escapeAttr(product.image)}" alt="${escapeAttr(product.name)}">
          ${product.featured ? `<span class="badge">Featured</span>` : ""}
        </div>
        <div class="product-body">
          <span class="product-category">${escapeHtml(product.category)}</span>
          <h3>${escapeHtml(product.name)}</h3>
          <p>${escapeHtml(product.description)}</p>
          <div class="product-foot">
            <strong>${formatMoney(product.price)}</strong>
            <button class="button small ${disabled ? "disabled" : "secondary"}" type="button" data-add="${escapeAttr(product.id)}" ${disabled ? "disabled" : ""}>
              ${disabled ? "Sold out" : "Add"}
            </button>
          </div>
        </div>
      </article>
    `;
  }

  function addToCart(id) {
    const product = products.find((item) => item.id === id);
    if (!product) return;
    const line = cart.get(id) || 0;
    cart.set(id, Math.min(line + 1, Number(product.stock) || 99));
    persistCart();
    renderCart();
    showToast(`${product.name} added to cart.`);
  }

  function renderCart() {
    const lines = getCartLines();
    cartItems.innerHTML = lines.map(({ product, quantity }) => `
      <div class="cart-line">
        <img src="${escapeAttr(product.image)}" alt="">
        <div>
          <strong>${escapeHtml(product.name)}</strong>
          <span>${quantity} x ${formatMoney(product.price)}</span>
        </div>
        <div class="quantity-controls">
          <button type="button" aria-label="Decrease ${escapeAttr(product.name)}" data-dec="${escapeAttr(product.id)}">-</button>
          <span>${quantity}</span>
          <button type="button" aria-label="Increase ${escapeAttr(product.name)}" data-inc="${escapeAttr(product.id)}">+</button>
        </div>
      </div>
    `).join("");
    cartItems.querySelectorAll("[data-dec]").forEach((button) => {
      button.addEventListener("click", () => changeQuantity(button.dataset.dec, -1));
    });
    cartItems.querySelectorAll("[data-inc]").forEach((button) => {
      button.addEventListener("click", () => changeQuantity(button.dataset.inc, 1));
    });
    const total = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
    cartTotal.textContent = formatMoney(total);
    cartCount.textContent = String(lines.reduce((sum, line) => sum + line.quantity, 0));
    cartEmpty.hidden = lines.length > 0;
    checkoutForm.hidden = lines.length === 0;
    upiLink.href = buildUpiUrl(total);
  }

  function changeQuantity(id, delta) {
    const product = products.find((item) => item.id === id);
    const next = (cart.get(id) || 0) + delta;
    if (next <= 0) cart.delete(id);
    else cart.set(id, Math.min(next, Number(product?.stock) || 99));
    persistCart();
    renderCart();
  }

  function getCartLines() {
    return [...cart.entries()].map(([id, quantity]) => {
      const product = products.find((item) => item.id === id);
      return product ? { product, quantity } : null;
    }).filter(Boolean);
  }

  function submitOrder(event) {
    event.preventDefault();
    const form = new FormData(checkoutForm);
    const lines = getCartLines();
    if (!lines.length) return;
    const total = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
    const productText = lines.map(({ product, quantity }) => `- ${product.name} x ${quantity} = ${formatMoney(product.price * quantity)}`).join("\n");
    const message = [
      `New order for ${config.businessName}`,
      "",
      productText,
      "",
      `Total: ${formatMoney(total)}`,
      config.shippingNote,
      "",
      `Name: ${form.get("name")}`,
      `Mobile: ${form.get("phone")}`,
      `Address: ${form.get("address")}`,
      `Notes: ${form.get("notes") || "None"}`
    ].join("\n");
    window.open(buildWhatsAppUrl(message), "_blank", "noopener");
  }

  function buildWhatsAppUrl(message) {
    const number = String(config.whatsappNumber || "").replace(/\D/g, "");
    return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
  }

  function buildUpiUrl(amount) {
    const params = new URLSearchParams({
      pa: config.upiId,
      pn: config.businessName,
      am: String(amount || 0),
      cu: "INR",
      tn: `${config.businessName} order`
    });
    return `upi://pay?${params.toString()}`;
  }

  function persistCart() {
    localStorage.setItem("eliteCart", JSON.stringify([...cart.entries()]));
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("show"), 2200);
  }

  function readStorage(key) {
    try {
      return JSON.parse(localStorage.getItem(key));
    } catch {
      return null;
    }
  }

  function formatMoney(value) {
    return `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char]));
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, "&#096;");
  }
}());
