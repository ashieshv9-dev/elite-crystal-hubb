(function () {
  let config = { ...window.ELITE_CONFIG };
  let products = structuredClone(readStorage("eliteProductsPreview") || window.ELITE_PRODUCTS);
  const list = document.querySelector("[data-admin-list]");
  const template = document.querySelector("#product-editor-template");
  const toast = document.querySelector("[data-toast]");
  const settingInputs = document.querySelectorAll("[data-setting]");

  init();

  function init() {
    hydrateSettings();
    render();
    document.querySelector("[data-add-product]").addEventListener("click", addProduct);
    document.querySelector("[data-save-preview]").addEventListener("click", savePreview);
    document.querySelector("[data-export]").addEventListener("click", exportFile);
    document.querySelector("[data-import]").addEventListener("change", importFile);
    settingInputs.forEach((input) => input.addEventListener("input", updateSettings));
  }

  function hydrateSettings() {
    settingInputs.forEach((input) => {
      input.value = config[input.dataset.setting] || "";
    });
  }

  function updateSettings() {
    settingInputs.forEach((input) => {
      config[input.dataset.setting] = input.value.trim();
    });
  }

  function render() {
    list.innerHTML = "";
    products.forEach((product, index) => {
      const node = template.content.firstElementChild.cloneNode(true);
      node.querySelector("[data-editor-title]").textContent = product.name || `Product ${index + 1}`;
      node.querySelector("[data-remove]").addEventListener("click", () => {
        products.splice(index, 1);
        render();
        showToast("Product removed.");
      });
      node.querySelectorAll("[data-field]").forEach((field) => {
        const key = field.dataset.field;
        if (key === "tags") field.value = (product.tags || []).join(", ");
        else if (field.type === "checkbox") field.checked = Boolean(product[key]);
        else field.value = product[key] ?? "";
        field.addEventListener("input", () => updateProduct(index, key, field));
        field.addEventListener("change", () => updateProduct(index, key, field));
      });
      list.appendChild(node);
    });
  }

  function updateProduct(index, key, field) {
    const product = products[index];
    if (!product) return;
    if (key === "price" || key === "stock") product[key] = Number(field.value || 0);
    else if (key === "tags") product[key] = field.value.split(",").map((tag) => tag.trim()).filter(Boolean);
    else if (key === "featured") product[key] = field.checked;
    else product[key] = field.value;
    if (key === "name") {
      product.id = slugify(field.value) || product.id;
      field.closest(".product-editor").querySelector("[data-editor-title]").textContent = field.value || "Product";
    }
  }

  function addProduct() {
    products.unshift({
      id: `new-product-${Date.now()}`,
      name: "New Product",
      category: "Pyrite",
      price: 499,
      stock: 5,
      image: "assets/images/pyrite-cluster.svg",
      description: "Short product description.",
      tags: [],
      featured: false
    });
    render();
    showToast("New product added.");
  }

  function savePreview() {
    updateSettings();
    localStorage.setItem("eliteProductsPreview", JSON.stringify(products));
    localStorage.setItem("eliteConfigPreview", JSON.stringify(config));
    showToast("Preview saved in this browser.");
  }

  function exportFile() {
    updateSettings();
    const js = `(function () {\n  window.ELITE_CONFIG = ${JSON.stringify(config, null, 2)};\n\n  window.ELITE_PRODUCTS = ${JSON.stringify(products, null, 2)};\n}());\n`;
    const blob = new Blob([js], { type: "text/javascript" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "products.js";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
    showToast("products.js downloaded.");
  }

  function importFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result || "");
        if (file.name.endsWith(".json")) {
          products = JSON.parse(text);
        } else {
          const sandbox = {};
          Function("window", text)(sandbox);
          products = sandbox.ELITE_PRODUCTS || products;
          config = sandbox.ELITE_CONFIG || config;
        }
        hydrateSettings();
        render();
        showToast("File imported.");
      } catch (error) {
        showToast("Import failed. Check the file format.");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  function readStorage(key) {
    try {
      return JSON.parse(localStorage.getItem(key));
    } catch {
      return null;
    }
  }

  function slugify(value) {
    return String(value || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("show"), 2200);
  }
}());
