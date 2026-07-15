const products = PRODUCTS;
const categoryOrder = [
  "Stickers",
  "Mini Sticker Sheet",
  "6cm Keychains",
  "3cm Mini Keychains",
  "A5 Prints",
  "Gachapon Coins",
];

const categoryMenu = [
  ["ALL", "All"],
  ["Stickers", "Stickers"],
  ["Mini Sticker Sheet", "Mini Sticker Sheet"],
  ["6cm Keychains", "6cm Keychains"],
  ["3cm Mini Keychains", "3cm Mini Keychains"],
  ["A5 Prints", "A5 Prints"],
  ["Gachapon Coins", "Gachapon Coins"],
];

let stock = [];
let cart = [];
let sales = [];

function normalizeProducts() {
  products.forEach(product => {
    if (product.name.startsWith("A6 Kiss Cut Vinyl Sticker")) product.category = "Mini Sticker Sheet";
    if (product.name.startsWith("6CM 3mm Acrylic Charm")) product.category = "6cm Keychains";
    if (product.name.startsWith("3CM 1.5mm Acrylic Charm")) product.category = "3cm Mini Keychains";
    if (product.category === "Mini Sticker Sheet") product.price = "1 for $8 | 3 for $22";
    if (product.category === "6cm Keychains") product.price = "1 for $8 | 2 for $15";
    if (product.category === "3cm Mini Keychains") product.price = "1 for $3 | 3 for $7";
  });

  products.push({
    name: "Gachapon Coin",
    image: "",
    category: "Gachapon Coins",
    price: "1 for $3 | 3 for $7",
    stock: 50,
  });

  products.sort((a, b) => {
    return getProductId(a.name) - getProductId(b.name)
      || a.category.localeCompare(b.category)
      || a.name.localeCompare(b.name);
  });
}

function getProductId(name) {
  const match = name.match(/(?:^|\s)(\d+)(?=\s-\s)/);
  return match ? parseInt(match[1], 10) : Number.MAX_SAFE_INTEGER;
}

function loadState() {
  const saved = JSON.parse(localStorage.getItem("posState") || "null");
  const legacyStock = JSON.parse(localStorage.getItem("stockCounts") || "null");
  const loadedStock = products.map(product => {
    if (saved && saved.stockCounts && saved.stockCounts[product.name] !== undefined) {
      return saved.stockCounts[product.name];
    }
    if (legacyStock && legacyStock[product.name] !== undefined) {
      return legacyStock[product.name];
    }
    return product.stock;
  });
  const loadedSales = saved && Array.isArray(saved.sales)
    ? saved.sales
    : JSON.parse(localStorage.getItem("sales") || "[]");

  return { stock: loadedStock, sales: loadedSales };
}

function saveState() {
  const stockCounts = {};
  products.forEach((product, index) => {
    stockCounts[product.name] = stock[index];
  });

  localStorage.setItem("posState", JSON.stringify({ stockCounts, sales }));
  localStorage.setItem("stockCounts", JSON.stringify(stockCounts));
  localStorage.setItem("sales", JSON.stringify(sales));
}

function bestBulkPrice(quantity, deals) {
  const bestPrices = Array(quantity + 1).fill(Infinity);
  bestPrices[0] = 0;

  for (let count = 1; count <= quantity; count++) {
    deals.forEach(deal => {
      if (count >= deal.quantity) {
        bestPrices[count] = Math.min(
          bestPrices[count],
          bestPrices[count - deal.quantity] + deal.price
        );
      }
    });
  }

  return bestPrices[quantity];
}

function calc(category, quantity) {
  if (category === "Stickers") return bestBulkPrice(quantity, [
    { quantity: 1, price: 3 },
    { quantity: 2, price: 5 },
    { quantity: 3, price: 8 },
    { quantity: 4, price: 10 },
  ]);
  if (category === "Mini Sticker Sheet") return bestBulkPrice(quantity, [
    { quantity: 1, price: 8 },
    { quantity: 3, price: 22 },
  ]);
  if (category === "6cm Keychains") return bestBulkPrice(quantity, [
    { quantity: 1, price: 8 },
    { quantity: 2, price: 15 },
  ]);
  if (category === "3cm Mini Keychains") return bestBulkPrice(quantity, [
    { quantity: 1, price: 3 },
    { quantity: 3, price: 7 },
  ]);
  if (category === "Gachapon Coins") return bestBulkPrice(quantity, [
    { quantity: 1, price: 3 },
    { quantity: 3, price: 7 },
  ]);
  if (category === "A5 Prints") return quantity * 7;
  return bestBulkPrice(quantity, [
    { quantity: 1, price: 3 },
    { quantity: 3, price: 7 },
  ]);
}

function getCategoryTotals() {
  const totals = {};
  cart.forEach(item => {
    const product = products[item.index];
    totals[product.category] = (totals[product.category] || 0) + item.quantity;
  });
  return totals;
}

function render() {
  renderNavbar();
  renderProducts();
  drawCart();
}

function renderNavbar() {
  const nav = document.getElementById("navbar");
  nav.innerHTML = "";

  categoryMenu.forEach(([category, label]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.category = category;
    button.textContent = label;
    nav.appendChild(button);
  });
}

function renderProducts() {
  const area = document.getElementById("products");
  const categories = categoryOrder.filter(category => {
    return products.some(product => product.category === category);
  });

  area.innerHTML = "";
  categories.forEach(category => {
    const heading = document.createElement("div");
    heading.className = "category";
    heading.textContent = category;

    const grid = document.createElement("div");
    grid.className = "grid";
    grid.id = category;

    area.appendChild(heading);
    area.appendChild(grid);
  });

  products.forEach((product, index) => {
    document.getElementById(product.category).appendChild(createProductCard(product, index));
  });
}

function createProductCard(product, index) {
  const card = document.createElement("div");
  card.className = "card";

  if (product.image) {
    const image = document.createElement("img");
    image.src = `images/${product.image}`;
    image.alt = product.name;
    card.appendChild(image);
  }

  const name = document.createElement("h3");
  name.textContent = product.name;

  const price = document.createElement("p");
  price.textContent = product.price;

  const stockLine = document.createElement("p");
  stockLine.append("Stock: ");

  const stockCount = document.createElement("span");
  stockCount.id = `stock${index}`;
  stockCount.textContent = stock[index];
  stockLine.appendChild(stockCount);

  const addButton = document.createElement("button");
  addButton.type = "button";
  addButton.dataset.productIndex = index;
  addButton.textContent = "Add to Cart";

  card.append(name, price, stockLine, addButton);
  return card;
}

function addToCart(index) {
  if (stock[index] <= 0) {
    alert("Out of stock");
    return;
  }

  stock[index]--;
  updateStockDisplay(index);

  const item = cart.find(cartItem => cartItem.index === index);
  if (item) item.quantity++;
  else cart.push({ index, quantity: 1 });

  saveState();
  drawCart();
}

function drawCart() {
  const cartArea = document.getElementById("cart");
  const categoryTotals = getCategoryTotals();
  const renderedCategories = new Set();
  let total = 0;

  cartArea.innerHTML = "";

  cart.forEach(item => {
    const product = products[item.index];

    if (!renderedCategories.has(product.category)) {
      const categoryQuantity = categoryTotals[product.category];
      const categoryCost = calc(product.category, categoryQuantity);
      total += categoryCost;

      const summary = document.createElement("div");
      summary.className = "cart-item";
      summary.textContent = `${product.category}: ${categoryQuantity} = $${categoryCost}`;
      cartArea.appendChild(summary);
      renderedCategories.add(product.category);
    }

    cartArea.appendChild(createCartItem(product, item));
  });

  document.getElementById("total").textContent = total;
}

function createCartItem(product, item) {
  const row = document.createElement("div");
  row.className = "cart-item";

  const label = document.createElement("span");
  label.textContent = `${product.name} x ${item.quantity}`;

  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.dataset.removeIndex = item.index;
  removeButton.textContent = "Remove";

  row.append(label, removeButton);
  return row;
}

function removeFromCart(index) {
  const item = cart.find(cartItem => cartItem.index === index);
  if (!item) return;

  item.quantity--;
  stock[index]++;
  updateStockDisplay(index);

  if (item.quantity <= 0) {
    cart = cart.filter(cartItem => cartItem.index !== index);
  }

  saveState();
  drawCart();
}

function clearCart() {
  if (cart.length === 0) {
    alert("Cart is empty");
    return;
  }

  if (!confirm("Clear the entire cart?")) return;

  cart.forEach(item => {
    stock[item.index] += item.quantity;
    updateStockDisplay(item.index);
  });

  cart = [];
  saveState();
  drawCart();
}

function resetAll() {
  if (!confirm("Reset all stock and clear all CSV entries?")) return;

  stock = products.map(product => product.stock);
  cart = [];
  sales = [];

  products.forEach((product, index) => updateStockDisplay(index));

  localStorage.removeItem("posState");
  localStorage.removeItem("stockCounts");
  localStorage.removeItem("sales");
  saveState();
  drawCart();
  alert("All stock and CSV entries have been reset");
}

function updateStockDisplay(index) {
  const stockElement = document.getElementById(`stock${index}`);
  if (stockElement) stockElement.textContent = stock[index];
}

function filterProducts() {
  const keyword = document.getElementById("search").value.toLowerCase();
  document.querySelectorAll(".card").forEach(card => {
    card.style.display = card.innerText.toLowerCase().includes(keyword) ? "block" : "none";
  });
}

function showCategory(category) {
  document.querySelectorAll(".card").forEach(card => {
    card.style.display = category === "ALL" || card.parentElement.id === category ? "block" : "none";
  });
}

function completeSale() {
  if (cart.length === 0) {
    alert("Cart is empty");
    return;
  }

  if (!confirm("Complete this sale?")) return;

  const categoryTotals = getCategoryTotals();
  const saleItems = [];
  let total = 0;

  Object.keys(categoryTotals).forEach(category => {
    const categoryCost = calc(category, categoryTotals[category]);
    total += categoryCost;
    saleItems.push(`${category} x ${categoryTotals[category]}`);
  });

  sales.push({
    Date: new Date().toLocaleString(),
    Items: saleItems.join(" | "),
    Revenue: total,
  });

  saveState();
  cart = [];
  drawCart();
  alert("Sale completed and saved");
}

function exportCSV() {
  if (sales.length === 0) {
    alert("No sales recorded yet");
    return;
  }

  if (!confirm("Export sales CSV?")) return;

  let csv = "Date,Items,Revenue\n";
  sales.forEach(sale => {
    csv += `"${sale.Date}","${sale.Items}",${sale.Revenue}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "YQs_Aozora_Booth_Sales.csv";
  link.click();
}

function bindEvents() {
  document.getElementById("reset-btn").addEventListener("click", resetAll);
  document.getElementById("search").addEventListener("input", filterProducts);
  document.getElementById("complete-sale-btn").addEventListener("click", completeSale);
  document.getElementById("clear-cart-btn").addEventListener("click", clearCart);
  document.getElementById("export-csv-btn").addEventListener("click", exportCSV);

  document.getElementById("navbar").addEventListener("click", event => {
    const button = event.target.closest("[data-category]");
    if (button) showCategory(button.dataset.category);
  });

  document.getElementById("products").addEventListener("click", event => {
    const button = event.target.closest("[data-product-index]");
    if (button) addToCart(Number(button.dataset.productIndex));
  });

  document.getElementById("cart").addEventListener("click", event => {
    const button = event.target.closest("[data-remove-index]");
    if (button) removeFromCart(Number(button.dataset.removeIndex));
  });

  window.addEventListener("beforeunload", saveState);
  window.addEventListener("pagehide", saveState);
}

function init() {
  normalizeProducts();

  const state = loadState();
  stock = state.stock;
  sales = state.sales;

  bindEvents();
  render();
}

init();
