/* script.js - Eefees Lovely Heaven (offline/localStorage version)
   - products stored under localStorage key: 'eefees_products'
   - cart stored under localStorage key: 'eefees_cart'
   - staff login password: 'eefee123'
   - admin page: staff.html (uses functions here)
   - edit the CONTACT constants below to your real details
*/

/* ================= CONFIG ================== */
const WHATSAPP_NUMBER = "2349012345678"; // change to your WhatsApp (no +)
const INSTAGRAM_URL = "https://instagram.com/eefees_lovely_heaven"; // change to your insta url
const STAFF_PASSWORD = "eefee123"; // exact as you requested

/* =============== STORAGE KEYS =============== */
const PRODUCTS_KEY = "eefees_products";
const CART_KEY = "eefees_cart";

/* =============== DEFAULT PRODUCTS =============== */
/* If user has no products yet, we seed with your two main products */
const DEFAULT_PRODUCTS = [
  {
    id: generateId(),
    name: "Pearl earrings & necklaces",
    price: 3000,
    img: "images/pearl.jpg",
    desc: "Elegant pearl designs — soft, classy and perfect for every occasion."
  },
  {
    id: generateId(),
    name: "Erasable pen",
    price: 500,
    img: "images/pen.jpg",
    desc: "Smooth erasable gel pen — neat, reliable, and cute for notes & journaling."
  }
];

/* =============== HELPERS: storage =============== */
function loadProducts() {
  try {
    const raw = localStorage.getItem(PRODUCTS_KEY);
    if (!raw) {
      saveProducts(DEFAULT_PRODUCTS);
      return DEFAULT_PRODUCTS.slice();
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error("loadProducts error", e);
    return DEFAULT_PRODUCTS.slice();
  }
}
function saveProducts(arr) {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(arr));
}
function exportProductsJSON() {
  const prods = loadProducts();
  const blob = new Blob([JSON.stringify(prods, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "eefees_products.json"; a.click();
  URL.revokeObjectURL(url);
}

/* =============== HELPERS: cart =============== */
function loadCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
  } catch (e) { return []; }
}
function saveCart(arr) { localStorage.setItem(CART_KEY, JSON.stringify(arr)); }

/* cart variable in memory */
let cart = loadCart();

/* generate simple id */
function generateId() {
  return 'p_' + Math.random().toString(36).slice(2, 9);
}

/* =============== PUBLIC SITE: render shop =============== */
function renderShop() {
  const grid = document.querySelector(".products-grid");
  if (!grid) return; // maybe not on this page
  const products = loadProducts();
  grid.innerHTML = "";
  products.forEach(p => {
    const node = document.createElement("article");
    node.className = "product-card";
    node.innerHTML = `
      <div class="product-media"><img src="${escapeHtml(p.img)}" alt="${escapeHtml(p.name)}" /></div>
      <div class="product-body">
        <h3 class="product-title">${escapeHtml(p.name)}</h3>
        <p class="product-price">₦${Number(p.price)}</p>
        <p class="product-desc">${escapeHtml(p.desc || "")}</p>
        <div class="product-actions">
          <button class="btn" onclick="addToCart('${escapeJs(p.name)}', ${Number(p.price)})">Add to Cart</button>
          <button class="btn outline" onclick="buyNowSingle('${escapeJs(p.name)}', ${Number(p.price)})">Buy Now</button>
        </div>
      </div>
    `;
    grid.appendChild(node);
  });
  updateCartCountUI();
}

/* =============== CART FUNCTIONS =============== */
function addToCart(name, price) {
  cart.push({ name, price });
  saveCart(cart);
  updateCartCountUI();
  showAddedToast(`${name} added to cart`);
}
function updateCartCountUI() {
  const el = document.getElementById("cart-count-top") || document.getElementById("cart-count");
  if (el) el.textContent = cart.length || 0;
}
function buildMessage(items) {
  let total = 0;
  let lines = [];
  items.forEach((it, i) => {
    lines.push(`${i+1}. ${it.name} - ₦${it.price}`);
    total += Number(it.price);
  });
  let msg = "Hello! I want to place an order from Eefee's Lovely Heaven.%0A";
  msg += lines.map(l => encodeURIComponent(l)).join("%0A");
  msg += `%0A%0ATotal: ₦${total}%0A%0APlease send payment & delivery details.`;
  return msg;
}
function buyNowSingle(name, price) {
  const items = [{ name, price }];
  const msg = buildMessage(items);
  copyToClipboard(decodeURIComponent(msg.replace(/%0A/g, '\n')));
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank");
}
function buyNow() {
  if (!cart || cart.length === 0) { alert("Your cart is empty. Add items first."); return; }
  const msg = buildMessage(cart);
  // copy friendly text for Instagram DM
  copyToClipboard(decodeURIComponent(msg.replace(/%0A/g, "\n")));
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank");
}

/* CART PAGE rendering (cart.html) */
function renderCartPage() {
  const listEl = document.getElementById("cart-list");
  const totalEl = document.getElementById("total-price");
  if (!listEl) return;
  listEl.innerHTML = "";
  let total = 0;
  cart.forEach((it, idx) => {
    const li = document.createElement("li");
    li.className = "cart-item";
    li.innerHTML = `
      <span class="ci-name">${escapeHtml(it.name)}</span>
      <span class="ci-price">₦${it.price}</span>
      <button class="btn ghost" onclick="removeItem(${idx})">Remove</button>
    `;
    listEl.appendChild(li);
    total += Number(it.price);
  });
  totalEl.textContent = `₦${total}`;
  updateCartCountUI();
}
function removeItem(idx) {
  if (idx < 0 || idx >= cart.length) return;
  cart.splice(idx, 1);
  saveCart(cart);
  renderCartPage();
  updateCartCountUI();
}
function clearCart() {
  if (!confirm("Clear all items from cart?")) return;
  cart = [];
  saveCart(cart);
  renderCartPage();
  updateCartCountUI();
  alert("Cart cleared 💜");
}

/* =============== SMALL UI HELPERS =============== */
function copyToClipboard(text) {
  if (!navigator.clipboard) {
    const ta = document.createElement("textarea");
    ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove(); return;
  }
  navigator.clipboard.writeText(text).catch(()=>{});
}
function showAddedToast(text) {
  const t = document.createElement("div");
  t.textContent = text;
  t.style.position = "fixed";
  t.style.bottom = "22px";
  t.style.left = "50%";
  t.style.transform = "translateX(-50%)";
  t.style.background = "linear-gradient(90deg,#7a4ff0,#a98bff)";
  t.style.color = "#fff";
  t.style.padding = "10px 14px";
  t.style.borderRadius = "10px";
  t.style.boxShadow = "0 10px 30px rgba(122,79,240,0.12)";
  t.style.zIndex = 9999;
  document.body.appendChild(t);
  setTimeout(()=> t.remove(), 1500);
}
function escapeHtml(s){ if(!s) return ''; return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]); }
function escapeJs(s){ return (String(s||'')).replace(/'/g,"\\'").replace(/"/g,'\\"'); }

/* =============== ADMIN (staff.html) =============== */
function showAdminUI(show) {
  const loginSection = document.getElementById("loginSection");
  const adminUI = document.getElementById("adminUI");
  const signoutBtn = document.getElementById("signoutBtn");
  if (!loginSection) return;
  loginSection.style.display = show ? "none" : "block";
  if (adminUI) adminUI.style.display = show ? "block" : "none";
  if (signoutBtn) signoutBtn.style.display = show ? "inline-block" : "none";
  if (show) loadAdminList();
}

/* handle staff login */
document.addEventListener("DOMContentLoaded", function () {
  // Render shop if on index
  renderShop();

  // If on cart page, render cart
  renderCartPage();

  // update cart count UI
  updateCartCountUI();

  // ADMIN specific bindings
  const loginBtn = document.getElementById("staffLoginBtn");
  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      const pw = document.getElementById("staffPassword").value || "";
      if (pw === STAFF_PASSWORD) {
        showAdminUI(true);
      } else {
        alert("Incorrect password.");
      }
    });
  }

  const signOutBtn = document.getElementById("signOutBtn");
  if (signOutBtn) signOutBtn.addEventListener("click", () => {
    showAdminUI(false);
  });

  const refreshBtn = document.getElementById("refreshProducts");
  if (refreshBtn) refreshBtn.addEventListener("click", () => { loadAdminList(); renderShop(); alert("Refreshed"); });

  const saveProdBtn = document.getElementById("saveProd");
  if (saveProdBtn) saveProdBtn.addEventListener("click", () => {
    const id = document.getElementById("prodId").value.trim();
    const name = document.getElementById("prodName").value.trim();
    const price = Number(document.getElementById("prodPrice").value.trim() || 0);
    const img = document.getElementById("prodImg").value.trim();
    const desc = document.getElementById("prodDesc").value.trim();
    if (!name || !price || !img) return alert("Name, price and image path are required.");
    let products = loadProducts();
    if (id) {
      // update
      const idx = products.findIndex(p => p.id === id);
      if (idx >= 0) {
        products[idx].name = name; products[idx].price = price; products[idx].img = img; products[idx].desc = desc;
      } else {
        return alert("Product id not found.");
      }
    } else {
      // create
      products.push({ id: generateId(), name, price, img, desc });
    }
    saveProducts(products);
    clearAdminForm();
    loadAdminList();
    renderShop();
    alert("Saved.");
  });

  const clearFormBtn = document.getElementById("clearForm");
  if (clearFormBtn) clearFormBtn.addEventListener("click", clearAdminForm);

  const deleteAllBtn = document.getElementById("deleteAll");
  if (deleteAllBtn) deleteAllBtn.addEventListener("click", () => {
    if (!confirm("Delete ALL products? This will empty the shop.")) return;
    saveProducts([]); loadAdminList(); renderShop(); alert("All products deleted.");
  });

  const resetDemoBtn = document.getElementById("resetDemo");
  if (resetDemoBtn) resetDemoBtn.addEventListener("click", () => {
    if (!confirm("Reset to starter products?")) return;
    saveProducts(DEFAULT_PRODUCTS.slice()); loadAdminList(); renderShop(); alert("Reset done.");
  });

  const exportBtn = document.getElementById("exportProducts");
  if (exportBtn) exportBtn.addEventListener("click", exportProductsJSON);

  const importBtn = document.getElementById("importProductsBtn");
  if (importBtn) importBtn.addEventListener("click", () => document.getElementById("importFile").click());

  const importFile = document.getElementById("importFile");
  if (importFile) importFile.addEventListener("change", function (e) {
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = function (ev) {
      try {
        const data = JSON.parse(ev.target.result);
        if (!Array.isArray(data)) throw new Error("Invalid JSON format");
        // normalize items (ensure id exists)
        const normalized = data.map(it => ({
          id: it.id || generateId(),
          name: it.name || "Unnamed",
          price: Number(it.price || 0),
          img: it.img || "images/placeholder.jpg",
          desc: it.desc || ""
        }));
        saveProducts(normalized);
        loadAdminList(); renderShop();
        alert("Imported " + normalized.length + " products.");
      } catch (err) { alert("Import failed: " + err.message); }
    };
    reader.readAsText(f);
  });
}); // DOMContent

/* =============== ADMIN: list & helpers =============== */
function loadAdminList() {
  const out = document.getElementById("productsAdminList");
  if (!out) return;
  const products = loadProducts();
  out.innerHTML = "";
  if (!products.length) {
    out.textContent = "No products. Use the form above to add.";
    return;
  }
  products.forEach(p => {
    const row = document.createElement("div");
    row.className = "prod-admin-item";
    row.innerHTML = `
      <div style="flex:1">
        <strong>${escapeHtml(p.name)}</strong><br>
        <small class="txt-muted">₦${p.price} • ${escapeHtml(p.desc || "")}</small>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <button class="btn small" onclick='populateEditForm("${p.id}")'>Edit</button>
        <button class="btn ghost small" onclick='deleteProduct("${p.id}")'>Delete</button>
      </div>
    `;
    out.appendChild(row);
  });
}

function populateEditForm(id) {
  const products = loadProducts();
  const p = products.find(x => x.id === id);
  if (!p) return alert("Product not found");
  document.getElementById("prodId").value = p.id;
  document.getElementById("prodName").value = p.name;
  document.getElementById("prodPrice").value = p.price;
  document.getElementById("prodImg").value = p.img;
  document.getElementById("prodDesc").value = p.desc || "";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteProduct(id) {
  if (!confirm("Delete this product?")) return;
  let products = loadProducts();
  products = products.filter(p => p.id !== id);
  saveProducts(products);
  loadAdminList();
  renderShop();
  alert("Deleted.");
}

function clearAdminForm() {
  document.getElementById("prodId").value = "";
  document.getElementById("prodName").value = "";
  document.getElementById("prodPrice").value = "";
  document.getElementById("prodImg").value = "";
  document.getElementById("prodDesc").value = "";
}

/* =============== NAV HELPERS =============== */
function goToCart() { window.location.href = "cart.html"; }
function goToShop() { window.location.href = "index.html"; }

/* expose some functions for console / debugging */
window.addToCart = addToCart;
window.buyNow = buyNow;
window.buyNowSingle = buyNowSingle;
window.renderShop = renderShop;
window.renderCartPage = renderCartPage;
window.clearCart = clearCart;
window.removeItem = removeItem;
window.loadProducts = loadProducts;
window.saveProducts = saveProducts;
window.exportProductsJSON = exportProductsJSON;
window.clearAdminForm = clearAdminForm;

/* When this script loads in any page, ensure shop rendering is attempted */
document.addEventListener("DOMContentLoaded", function () {
  // render shop if element is present
  renderShop();
  renderCartPage();
  updateCartCountUI();
});
