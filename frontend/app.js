/**
 * StockMaster - Inventory Management Frontend SPA
 * REST API client & UI Controller
 */

// Configuration & State
const CONFIG = {
  getApiBaseUrl() {
    const saved = localStorage.getItem('STOCKMASTER_API_URL');
    if (saved) return saved.replace(/\/+$/, '');
    
    // If served from Flask server (http/https on port 5000 or similar)
    if (window.location.protocol.startsWith('http')) {
      return window.location.origin;
    }
    
    // Default fallback for file:// or external dev servers
    return 'http://127.0.0.1:5000';
  },
  setApiBaseUrl(url) {
    const cleanUrl = url.trim().replace(/\/+$/, '');
    localStorage.setItem('STOCKMASTER_API_URL', cleanUrl);
  }
};

const state = {
  productos: [],
  categorias: [],
  entradas: [],
  activeView: 'dashboard',
  isOnline: false,
  filteredProducts: [],
  filteredCategories: [],
  filteredEntradas: []
};

// ==========================================
// API HELPER
// ==========================================
async function apiRequest(endpoint, options = {}) {
  const baseUrl = CONFIG.getApiBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  
  const defaultHeaders = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options.headers || {})
      }
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg = data?.error || data?.mensaje || data?.descripcion || `Error HTTP ${response.status}`;
      throw new Error(errorMsg);
    }

    setApiStatus(true);
    return data;
  } catch (error) {
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      setApiStatus(false);
      throw new Error(`No se pudo conectar al servidor en ${baseUrl}. ¿Está el backend Flask corriendo?`);
    }
    throw error;
  }
}

function setApiStatus(isOnline) {
  state.isOnline = isOnline;
  const badge = document.getElementById('api-status-badge');
  const dot = document.getElementById('status-dot');
  const text = document.getElementById('status-text');

  if (!badge || !dot || !text) return;

  if (isOnline) {
    badge.className = 'flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 transition-all hover:shadow-sm';
    dot.className = 'w-2.5 h-2.5 rounded-full bg-emerald-500 pulse-online';
    text.textContent = 'API Online';
  } else {
    badge.className = 'flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 transition-all hover:shadow-sm';
    dot.className = 'w-2.5 h-2.5 rounded-full bg-rose-500 pulse-offline';
    text.textContent = 'API Offline';
  }
}

// ==========================================
// NAVIGATION CONTROLLER
// ==========================================
function navigateTo(viewName) {
  state.activeView = viewName;

  // Hide all sections
  document.querySelectorAll('.view-section').forEach(sec => {
    sec.classList.remove('active');
  });

  // Show active section
  const target = document.getElementById(`view-${viewName}`);
  if (target) {
    target.classList.add('active');
  }

  // Update nav buttons highlight
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.className = 'nav-tab px-3 py-2 rounded-lg text-sm font-medium transition-all text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center gap-2';
  });

  const activeTab = document.getElementById(`nav-${viewName}`);
  if (activeTab) {
    activeTab.className = 'nav-tab px-3 py-2 rounded-lg text-sm font-semibold transition-all text-indigo-600 bg-indigo-50 flex items-center gap-2';
  }

  // Render appropriate view
  if (viewName === 'dashboard') renderDashboard();
  if (viewName === 'productos') renderProductsTable();
  if (viewName === 'categorias') renderCategoriesGrid();
  if (viewName === 'entradas') renderEntradasTable();
}

// ==========================================
// DATA FETCHING & STOCK CALCULATION
// ==========================================
async function fetchAllData() {
  const refreshIcon = document.getElementById('refresh-icon');
  if (refreshIcon) refreshIcon.classList.add('fa-spin');

  try {
    const [categorias, productos, entradas] = await Promise.all([
      apiRequest('/categorias'),
      apiRequest('/products'),
      apiRequest('/entradas')
    ]);

    state.categorias = Array.isArray(categorias) ? categorias : [];
    state.productos = Array.isArray(productos) ? productos : [];
    state.entradas = Array.isArray(entradas) ? entradas : [];

    // Calculate dynamic stock for each product based on entradas
    calculateProductStocks();

    // Populate dropdowns
    populateCategoryDropdowns();
    populateProductDropdowns();

    // Render active view
    navigateTo(state.activeView);

  } catch (error) {
    console.error('Error fetching data:', error);
    showToast('error', error.message);
  } finally {
    if (refreshIcon) refreshIcon.classList.remove('fa-spin');
  }
}

function calculateProductStocks() {
  // Map product stock
  const stockMap = {};
  state.entradas.forEach(e => {
    const pId = e.producto_id;
    const qty = parseInt(e.cantidad) || 0;
    stockMap[pId] = (stockMap[pId] || 0) + qty;
  });

  state.productos.forEach(p => {
    p.stock_actual = stockMap[p.id] || 0;
    p.is_low_stock = p.stock_actual <= (p.stock_min || 0);
  });
}

// ==========================================
// RENDER: DASHBOARD
// ==========================================
function renderDashboard() {
  // 1. KPI Cards
  const kpiProds = document.getElementById('kpi-total-productos');
  const kpiCats = document.getElementById('kpi-total-categorias');
  const kpiEntradas = document.getElementById('kpi-total-entradas');
  const kpiUnidades = document.getElementById('kpi-total-unidades');
  const kpiLowStock = document.getElementById('kpi-low-stock-count');

  const totalUnidades = state.entradas.reduce((sum, e) => sum + (parseInt(e.cantidad) || 0), 0);
  const lowStockProducts = state.productos.filter(p => p.is_low_stock);

  if (kpiProds) kpiProds.textContent = state.productos.length;
  if (kpiCats) kpiCats.textContent = state.categorias.length;
  if (kpiEntradas) kpiEntradas.textContent = state.entradas.length;
  if (kpiUnidades) kpiUnidades.textContent = totalUnidades.toLocaleString();
  if (kpiLowStock) {
    kpiLowStock.innerHTML = lowStockProducts.length > 0 
      ? `<span class="text-rose-600 font-bold"><i class="fa-solid fa-triangle-exclamation"></i> ${lowStockProducts.length} en stock bajo</span>`
      : `<span class="text-emerald-600 font-semibold"><i class="fa-solid fa-check"></i> Stock en niveles óptimos</span>`;
  }

  // 2. Low Stock Alerts List
  const lowStockContainer = document.getElementById('dashboard-low-stock-list');
  if (lowStockContainer) {
    if (lowStockProducts.length === 0) {
      lowStockContainer.innerHTML = `
        <div class="text-center py-8 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
          <i class="fa-solid fa-circle-check text-3xl text-emerald-500 mb-2"></i>
          <p class="text-sm font-semibold text-slate-700">¡Todo en orden!</p>
          <p class="text-xs text-slate-500">Ningún producto está por debajo de su stock mínimo.</p>
        </div>
      `;
    } else {
      lowStockContainer.innerHTML = lowStockProducts.map(p => `
        <div class="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/80 transition-all">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg ${p.stock_actual === 0 ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'} flex items-center justify-center text-sm font-bold">
              ${p.stock_actual === 0 ? '<i class="fa-solid fa-ban"></i>' : '<i class="fa-solid fa-exclamation"></i>'}
            </div>
            <div>
              <h4 class="text-sm font-bold text-slate-800">${escapeHtml(p.nombre)}</h4>
              <p class="text-xs text-slate-500">Categoría: ${escapeHtml(p.categoria_nombre || 'General')}</p>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <div class="text-right">
              <span class="text-xs font-bold ${p.stock_actual === 0 ? 'text-rose-600' : 'text-amber-600'} block">
                ${p.stock_actual} unid. actuales
              </span>
              <span class="text-xs text-slate-400">Mínimo: ${p.stock_min}</span>
            </div>
            <button onclick="openEntradaModal(null, ${p.id})" class="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition-all flex items-center gap-1.5">
              <i class="fa-solid fa-plus"></i> Entrada
            </button>
          </div>
        </div>
      `).join('');
    }
  }

  // 3. Category Breakdown
  const catListContainer = document.getElementById('dashboard-categories-list');
  if (catListContainer) {
    if (state.categorias.length === 0) {
      catListContainer.innerHTML = `<p class="text-xs text-slate-400 text-center py-4">No hay categorías registradas.</p>`;
    } else {
      const maxProds = Math.max(1, ...state.categorias.map(c => state.productos.filter(p => p.categoria_id === c.id).length));
      catListContainer.innerHTML = state.categorias.map(c => {
        const prodsInCat = state.productos.filter(p => p.categoria_id === c.id).length;
        const percentage = Math.round((prodsInCat / maxProds) * 100);
        return `
          <div>
            <div class="flex justify-between items-center text-xs font-semibold mb-1">
              <span class="text-slate-700 truncate max-w-[180px]">${escapeHtml(c.nombre)}</span>
              <span class="text-slate-500">${prodsInCat} productos</span>
            </div>
            <div class="w-full bg-slate-100 rounded-full h-2">
              <div class="bg-indigo-600 h-2 rounded-full transition-all duration-500" style="width: ${percentage}%"></div>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // 4. Recent Entradas Table on Dashboard
  const recentTable = document.getElementById('dashboard-recent-entradas');
  if (recentTable) {
    const recent5 = state.entradas.slice(0, 5);
    if (recent5.length === 0) {
      recentTable.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-8 text-slate-400">
            <i class="fa-solid fa-inbox text-2xl mb-1 block"></i>
            No se han registrado entradas al inventario aún.
          </td>
        </tr>
      `;
    } else {
      recentTable.innerHTML = recent5.map(e => `
        <tr class="hover:bg-slate-50/75 transition-colors">
          <td class="py-3 px-4 font-mono font-semibold text-slate-600">#${e.id}</td>
          <td class="py-3 px-4 text-slate-600">${formatDate(e.fecha)}</td>
          <td class="py-3 px-4 font-semibold text-slate-900">${escapeHtml(e.producto_nombre || 'Producto #' + e.producto_id)}</td>
          <td class="py-3 px-4">
            <span class="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              +${e.cantidad} unid.
            </span>
          </td>
          <td class="py-3 px-4 font-mono text-xs text-slate-500">${escapeHtml(e.factura || 'Sin factura')}</td>
          <td class="py-3 px-4 text-xs text-slate-600">${escapeHtml(e.ubicacion ? `${e.ubicacion} (${e.stand})` : e.stand || '-')}</td>
        </tr>
      `).join('');
    }
  }
}

// ==========================================
// RENDER: PRODUCTOS
// ==========================================
function filterProducts() {
  const query = (document.getElementById('product-search')?.value || '').toLowerCase().trim();
  const catFilter = document.getElementById('product-filter-cat')?.value || '';
  const statusFilter = document.getElementById('product-filter-status')?.value || '';

  state.filteredProducts = state.productos.filter(p => {
    const matchQuery = !query || 
      p.nombre.toLowerCase().includes(query) || 
      (p.descripcion && p.descripcion.toLowerCase().includes(query)) ||
      (p.categoria_nombre && p.categoria_nombre.toLowerCase().includes(query));

    const matchCat = !catFilter || String(p.categoria_id) === String(catFilter);

    const matchStatus = !statusFilter || 
      (statusFilter === 'disponible' && p.disponible) ||
      (statusFilter === 'agotado' && !p.disponible);

    return matchQuery && matchCat && matchStatus;
  });

  renderProductsTable(state.filteredProducts);
}

function resetProductFilters() {
  if (document.getElementById('product-search')) document.getElementById('product-search').value = '';
  if (document.getElementById('product-filter-cat')) document.getElementById('product-filter-cat').value = '';
  if (document.getElementById('product-filter-status')) document.getElementById('product-filter-status').value = '';
  filterProducts();
}

function renderProductsTable(products = state.productos) {
  const tbody = document.getElementById('products-table-body');
  const countBadge = document.getElementById('products-count-badge');
  if (!tbody) return;

  if (countBadge) {
    countBadge.textContent = `Mostrando ${products.length} de ${state.productos.length} productos`;
  }

  if (products.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center py-12 text-slate-400">
          <i class="fa-solid fa-box-open text-3xl mb-2 block text-slate-300"></i>
          <p class="font-semibold text-slate-700">No se encontraron productos</p>
          <p class="text-xs text-slate-400 mt-1">Intenta con otros filtros o añade un nuevo producto.</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = products.map(p => {
    const isOutOfStock = p.stock_actual === 0;
    const isLow = p.is_low_stock && !isOutOfStock;

    let stockBadgeClass = 'bg-emerald-100 text-emerald-800';
    let stockBadgeText = `${p.stock_actual} unid.`;

    if (isOutOfStock) {
      stockBadgeClass = 'bg-rose-100 text-rose-800 font-bold';
      stockBadgeText = '0 (Agotado)';
    } else if (isLow) {
      stockBadgeClass = 'bg-amber-100 text-amber-800 font-bold';
      stockBadgeText = `${p.stock_actual} (Bajo)`;
    }

    const statusBadge = p.disponible
      ? `<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Disponible</span>`
      : `<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">Inactivo</span>`;

    return `
      <tr class="table-hover-row border-b border-slate-100 transition-colors">
        <td class="py-3 px-4 font-mono text-xs font-bold text-slate-500">#${p.id}</td>
        <td class="py-3 px-4">
          <div class="font-bold text-slate-900 hover:text-indigo-600 cursor-pointer" onclick="showProductDetail(${p.id})">
            ${escapeHtml(p.nombre)}
          </div>
          <div class="text-xs text-slate-400 line-clamp-1 max-w-xs">${escapeHtml(p.descripcion || 'Sin descripción')}</div>
        </td>
        <td class="py-3 px-4">
          <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            ${escapeHtml(p.categoria_nombre || 'Sin categoría')}
          </span>
        </td>
        <td class="py-3 px-4 font-bold text-slate-900">$${formatPrice(p.precio)}</td>
        <td class="py-3 px-4">
          <span class="px-2.5 py-0.5 rounded-full text-xs ${stockBadgeClass}">
            ${stockBadgeText}
          </span>
        </td>
        <td class="py-3 px-4 text-xs font-semibold text-slate-600">${p.stock_min}</td>
        <td class="py-3 px-4">${statusBadge}</td>
        <td class="py-3 px-4 text-right space-x-1 whitespace-nowrap">
          <button onclick="showProductDetail(${p.id})" title="Ver detalles y movimientos" 
                  class="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
            <i class="fa-solid fa-eye text-sm"></i>
          </button>
          <button onclick="openEntradaModal(null, ${p.id})" title="Registrar entrada de stock" 
                  class="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all">
            <i class="fa-solid fa-truck-ramp-box text-sm"></i>
          </button>
          <button onclick="openProductModal(${p.id})" title="Editar producto" 
                  class="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all">
            <i class="fa-solid fa-pen-to-square text-sm"></i>
          </button>
          <button onclick="deleteProduct(${p.id}, '${escapeHtml(p.nombre)}')" title="Eliminar producto" 
                  class="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
            <i class="fa-solid fa-trash text-sm"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// ==========================================
// RENDER: CATEGORÍAS
// ==========================================
function filterCategories() {
  const query = (document.getElementById('category-search')?.value || '').toLowerCase().trim();

  state.filteredCategories = state.categorias.filter(c => {
    return !query || 
      c.nombre.toLowerCase().includes(query) || 
      (c.descripcion && c.descripcion.toLowerCase().includes(query));
  });

  renderCategoriesGrid(state.filteredCategories);
}

function renderCategoriesGrid(categories = state.categorias) {
  const grid = document.getElementById('categories-grid');
  if (!grid) return;

  if (categories.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
        <i class="fa-solid fa-tags text-3xl mb-2 text-slate-300"></i>
        <p class="font-semibold text-slate-700">No se encontraron categorías</p>
        <p class="text-xs text-slate-400 mt-1">Crea una nueva categoría para organizar tus productos.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = categories.map(c => {
    const prodsCount = state.productos.filter(p => p.categoria_id === c.id).length;
    return `
      <div class="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
        <div>
          <div class="flex items-start justify-between gap-3 mb-3">
            <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg font-bold">
              <i class="fa-solid fa-folder-tree"></i>
            </div>
            <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
              ${prodsCount} ${prodsCount === 1 ? 'producto' : 'productos'}
            </span>
          </div>

          <h3 class="text-lg font-bold text-slate-900">${escapeHtml(c.nombre)}</h3>
          <p class="text-xs text-slate-500 mt-1.5 leading-relaxed">
            ${escapeHtml(c.descripcion || 'Sin descripción detallada.')}
          </p>
        </div>

        <div class="flex items-center justify-between pt-5 border-t border-slate-100 mt-5">
          <span class="text-xs font-mono text-slate-400">ID: #${c.id}</span>
          <div class="space-x-1">
            <button onclick="openCategoryModal(${c.id})" class="px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
              <i class="fa-solid fa-pen-to-square"></i> Editar
            </button>
            <button onclick="deleteCategory(${c.id}, '${escapeHtml(c.nombre)}', ${prodsCount})" class="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
              <i class="fa-solid fa-trash"></i> Eliminar
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ==========================================
// RENDER: ENTRADAS
// ==========================================
function filterEntradas() {
  const query = (document.getElementById('entrada-search')?.value || '').toLowerCase().trim();
  const prodFilter = document.getElementById('entrada-filter-prod')?.value || '';

  state.filteredEntradas = state.entradas.filter(e => {
    const matchQuery = !query ||
      (e.factura && e.factura.toLowerCase().includes(query)) ||
      (e.stand && e.stand.toLowerCase().includes(query)) ||
      (e.ubicacion && e.ubicacion.toLowerCase().includes(query)) ||
      (e.producto_nombre && e.producto_nombre.toLowerCase().includes(query));

    const matchProd = !prodFilter || String(e.producto_id) === String(prodFilter);

    return matchQuery && matchProd;
  });

  renderEntradasTable(state.filteredEntradas);
}

function resetEntradaFilters() {
  if (document.getElementById('entrada-search')) document.getElementById('entrada-search').value = '';
  if (document.getElementById('entrada-filter-prod')) document.getElementById('entrada-filter-prod').value = '';
  filterEntradas();
}

function renderEntradasTable(entradas = state.entradas) {
  const tbody = document.getElementById('entradas-table-body');
  const countBadge = document.getElementById('entradas-count-badge');
  if (!tbody) return;

  if (countBadge) {
    countBadge.textContent = `Mostrando ${entradas.length} de ${state.entradas.length} entradas registradas`;
  }

  if (entradas.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center py-12 text-slate-400">
          <i class="fa-solid fa-truck-ramp-box text-3xl mb-2 block text-slate-300"></i>
          <p class="font-semibold text-slate-700">No se encontraron entradas de inventario</p>
          <p class="text-xs text-slate-400 mt-1">Registra la llegada de nuevos productos al almacén.</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = entradas.map(e => `
    <tr class="table-hover-row border-b border-slate-100 transition-colors">
      <td class="py-3 px-4 font-mono text-xs font-bold text-slate-500">#${e.id}</td>
      <td class="py-3 px-4 text-slate-600 text-xs">${formatDate(e.fecha)}</td>
      <td class="py-3 px-4">
        <span class="font-bold text-slate-900 block">${escapeHtml(e.producto_nombre || 'Producto #' + e.producto_id)}</span>
        <span class="text-xs text-slate-400">ID Producto: #${e.producto_id}</span>
      </td>
      <td class="py-3 px-4">
        <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
          +${e.cantidad} unid.
        </span>
      </td>
      <td class="py-3 px-4 font-mono text-xs text-slate-600 font-semibold">
        ${escapeHtml(e.factura || 'Sin Factura')}
      </td>
      <td class="py-3 px-4">
        <span class="px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          ${escapeHtml(e.stand || '-')}
        </span>
      </td>
      <td class="py-3 px-4 text-xs text-slate-600">
        ${escapeHtml(e.ubicacion || '-')}
      </td>
      <td class="py-3 px-4 text-right space-x-1 whitespace-nowrap">
        <button onclick="openEntradaModal(${e.id})" title="Editar entrada" 
                class="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all">
          <i class="fa-solid fa-pen-to-square text-sm"></i>
        </button>
        <button onclick="deleteEntrada(${e.id})" title="Eliminar entrada" 
                class="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
          <i class="fa-solid fa-trash text-sm"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

// ==========================================
// DROPDOWN POPULATORS
// ==========================================
function populateCategoryDropdowns() {
  const selects = ['product-filter-cat', 'prod-categoria'];
  selects.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;

    const currentValue = el.value;
    const isFilter = id === 'product-filter-cat';

    let html = isFilter ? '<option value="">Todas las categorías</option>' : '<option value="">Selecciona una categoría...</option>';
    html += state.categorias.map(c => `
      <option value="${c.id}">${escapeHtml(c.nombre)}</option>
    `).join('');

    el.innerHTML = html;
    if (currentValue) el.value = currentValue;
  });
}

function populateProductDropdowns() {
  const selects = ['entrada-filter-prod', 'ent-producto-id'];
  selects.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;

    const currentValue = el.value;
    const isFilter = id === 'entrada-filter-prod';

    let html = isFilter ? '<option value="">Todos los productos</option>' : '<option value="">Selecciona el producto...</option>';
    html += state.productos.map(p => `
      <option value="${p.id}">${escapeHtml(p.nombre)} (Stock actual: ${p.stock_actual})</option>
    `).join('');

    el.innerHTML = html;
    if (currentValue) el.value = currentValue;
  });
}

// ==========================================
// CRUD: PRODUCTOS
// ==========================================
function openProductModal(productId = null) {
  const modal = document.getElementById('modal-producto');
  const title = document.getElementById('modal-product-title');
  const form = document.getElementById('form-producto');
  if (!modal || !form) return;

  form.reset();
  document.getElementById('prod-id').value = '';

  if (productId) {
    const prod = state.productos.find(p => p.id === productId);
    if (prod) {
      title.innerHTML = `<i class="fa-solid fa-pen-to-square text-amber-500"></i> Editar Producto #${prod.id}`;
      document.getElementById('prod-id').value = prod.id;
      document.getElementById('prod-nombre').value = prod.nombre || '';
      document.getElementById('prod-categoria').value = prod.categoria_id || '';
      document.getElementById('prod-precio').value = prod.precio || '';
      document.getElementById('prod-stock-min').value = prod.stock_min ?? 5;
      document.getElementById('prod-descripcion').value = prod.descripcion || '';
      document.getElementById('prod-disponible').checked = Boolean(prod.disponible);
    }
  } else {
    title.innerHTML = `<i class="fa-solid fa-box text-indigo-600"></i> Nuevo Producto`;
    document.getElementById('prod-stock-min').value = 5;
    document.getElementById('prod-disponible').checked = true;
  }

  modal.classList.add('open');
}

function closeProductModal() {
  document.getElementById('modal-producto')?.classList.remove('open');
}

async function handleProductSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('prod-id').value;
  const nombre = document.getElementById('prod-nombre').value.trim();
  const categoria_id = parseInt(document.getElementById('prod-categoria').value);
  const precio = parseFloat(document.getElementById('prod-precio').value);
  const stock_min = parseInt(document.getElementById('prod-stock-min').value) || 0;
  const descripcion = document.getElementById('prod-descripcion').value.trim();
  const disponible = document.getElementById('prod-disponible').checked;

  if (!nombre) {
    showToast('warning', 'El nombre del producto es obligatorio');
    return;
  }
  if (!categoria_id) {
    showToast('warning', 'Debes seleccionar una categoría');
    return;
  }
  if (isNaN(precio) || precio <= 0) {
    showToast('warning', 'El precio debe ser un número mayor a cero');
    return;
  }

  const payload = { nombre, categoria_id, precio, stock_min, descripcion, disponible };

  try {
    if (id) {
      await apiRequest(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      showToast('success', 'Producto actualizado correctamente');
    } else {
      await apiRequest('/products', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      showToast('success', 'Producto registrado exitosamente');
    }

    closeProductModal();
    await fetchAllData();
  } catch (error) {
    showToast('error', error.message);
  }
}

async function deleteProduct(id, name) {
  const result = await Swal.fire({
    title: '¿Eliminar producto?',
    text: `¿Seguro que deseas eliminar "${name}"? Esta acción no se puede deshacer.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  });

  if (!result.isConfirmed) return;

  try {
    await apiRequest(`/products/${id}`, { method: 'DELETE' });
    showToast('success', 'Producto eliminado exitosamente');
    await fetchAllData();
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'No se pudo eliminar',
      text: error.message,
      confirmButtonColor: '#4f46e5'
    });
  }
}

// ==========================================
// CRUD: CATEGORÍAS
// ==========================================
function openCategoryModal(categoryId = null) {
  const modal = document.getElementById('modal-categoria');
  const title = document.getElementById('modal-category-title');
  const form = document.getElementById('form-categoria');
  if (!modal || !form) return;

  form.reset();
  document.getElementById('cat-id').value = '';

  if (categoryId) {
    const cat = state.categorias.find(c => c.id === categoryId);
    if (cat) {
      title.innerHTML = `<i class="fa-solid fa-pen-to-square text-amber-500"></i> Editar Categoría #${cat.id}`;
      document.getElementById('cat-id').value = cat.id;
      document.getElementById('cat-nombre').value = cat.nombre || '';
      document.getElementById('cat-descripcion').value = cat.descripcion || '';
    }
  } else {
    title.innerHTML = `<i class="fa-solid fa-tags text-indigo-600"></i> Nueva Categoría`;
  }

  modal.classList.add('open');
}

function closeCategoryModal() {
  document.getElementById('modal-categoria')?.classList.remove('open');
}

async function handleCategorySubmit(e) {
  e.preventDefault();
  const id = document.getElementById('cat-id').value;
  const nombre = document.getElementById('cat-nombre').value.trim();
  const descripcion = document.getElementById('cat-descripcion').value.trim();

  if (!nombre) {
    showToast('warning', 'El nombre de la categoría es obligatorio');
    return;
  }
  if (!descripcion) {
    showToast('warning', 'La descripción es obligatoria');
    return;
  }

  const payload = { nombre, descripcion };

  try {
    if (id) {
      await apiRequest(`/categorias/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      showToast('success', 'Categoría actualizada correctamente');
    } else {
      await apiRequest('/categorias', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      showToast('success', 'Categoría creada exitosamente');
    }

    closeCategoryModal();
    await fetchAllData();
  } catch (error) {
    showToast('error', error.message);
  }
}

async function deleteCategory(id, name, productsCount) {
  if (productsCount > 0) {
    Swal.fire({
      icon: 'info',
      title: 'Categoría en uso',
      text: `No puedes eliminar la categoría "${name}" porque contiene ${productsCount} producto(s) asignado(s). Primero debes reasignar o eliminar esos productos.`,
      confirmButtonColor: '#4f46e5'
    });
    return;
  }

  const result = await Swal.fire({
    title: '¿Eliminar categoría?',
    text: `¿Seguro que deseas eliminar la categoría "${name}"?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  });

  if (!result.isConfirmed) return;

  try {
    await apiRequest(`/categorias/${id}`, { method: 'DELETE' });
    showToast('success', 'Categoría eliminada');
    await fetchAllData();
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error.message,
      confirmButtonColor: '#4f46e5'
    });
  }
}

// ==========================================
// CRUD: ENTRADAS
// ==========================================
function openEntradaModal(entradaId = null, preselectedProductId = null) {
  const modal = document.getElementById('modal-entrada');
  const title = document.getElementById('modal-entrada-title');
  const form = document.getElementById('form-entrada');
  if (!modal || !form) return;

  form.reset();
  document.getElementById('ent-id').value = '';

  if (entradaId) {
    const ent = state.entradas.find(e => e.id === entradaId);
    if (ent) {
      title.innerHTML = `<i class="fa-solid fa-pen-to-square text-amber-500"></i> Editar Entrada #${ent.id}`;
      document.getElementById('ent-id').value = ent.id;
      document.getElementById('ent-producto-id').value = ent.producto_id || '';
      document.getElementById('ent-cantidad').value = ent.cantidad || '';
      document.getElementById('ent-factura').value = ent.factura || '';
      document.getElementById('ent-stand').value = ent.stand || '';
      document.getElementById('ent-ubicacion').value = ent.ubicacion || '';
    }
  } else {
    title.innerHTML = `<i class="fa-solid fa-truck-ramp-box text-emerald-600"></i> Registrar Entrada de Inventario`;
    if (preselectedProductId) {
      document.getElementById('ent-producto-id').value = preselectedProductId;
    }
  }

  modal.classList.add('open');
}

function closeEntradaModal() {
  document.getElementById('modal-entrada')?.classList.remove('open');
}

async function handleEntradaSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('ent-id').value;
  const entra_producto_id = parseInt(document.getElementById('ent-producto-id').value);
  const entra_cantidad = parseInt(document.getElementById('ent-cantidad').value);
  const entra_factura = document.getElementById('ent-factura').value.trim();
  const entra_stand = document.getElementById('ent-stand').value.trim();
  const entra_ubicacion = document.getElementById('ent-ubicacion').value.trim();

  if (!entra_producto_id) {
    showToast('warning', 'Selecciona un producto');
    return;
  }
  if (isNaN(entra_cantidad) || entra_cantidad <= 0) {
    showToast('warning', 'La cantidad debe ser mayor a 0');
    return;
  }

  const payload = {
    entra_producto_id,
    entra_cantidad,
    entra_factura,
    entra_stand,
    entra_ubicacion
  };

  try {
    if (id) {
      await apiRequest(`/entradas/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      showToast('success', 'Entrada actualizada correctamente');
    } else {
      await apiRequest('/entradas', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      showToast('success', `Entrada registrada: +${entra_cantidad} unidades añadidas al stock`);
    }

    closeEntradaModal();
    await fetchAllData();
  } catch (error) {
    showToast('error', error.message);
  }
}

async function deleteEntrada(id) {
  const result = await Swal.fire({
    title: '¿Eliminar entrada?',
    text: `Al eliminar este movimiento se descontarán las unidades del inventario calculado.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  });

  if (!result.isConfirmed) return;

  try {
    await apiRequest(`/entradas/${id}`, { method: 'DELETE' });
    showToast('success', 'Entrada eliminada');
    await fetchAllData();
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error.message,
      confirmButtonColor: '#4f46e5'
    });
  }
}

// ==========================================
// MODAL: DETALLE DE PRODUCTO
// ==========================================
function showProductDetail(productId) {
  const prod = state.productos.find(p => p.id === productId);
  if (!prod) return;

  const modal = document.getElementById('modal-detalle-producto');
  if (!modal) return;

  document.getElementById('detail-category-badge').textContent = prod.categoria_nombre || 'General';
  document.getElementById('detail-product-name').textContent = prod.nombre;
  document.getElementById('detail-product-price').textContent = `$${formatPrice(prod.precio)}`;
  document.getElementById('detail-product-stock').textContent = `${prod.stock_actual} unid.`;
  document.getElementById('detail-product-stockmin').textContent = `${prod.stock_min} unid.`;
  document.getElementById('detail-product-desc').textContent = prod.descripcion || 'Sin descripción detallada registrada.';

  const statusEl = document.getElementById('detail-product-status');
  if (statusEl) {
    statusEl.innerHTML = prod.disponible
      ? `<span class="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-semibold"><i class="fa-solid fa-check"></i> Disponible</span>`
      : `<span class="text-xs px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-semibold"><i class="fa-solid fa-ban"></i> Inactivo</span>`;
  }

  // Quick entrada button in modal
  const quickBtn = document.getElementById('btn-quick-entrada');
  if (quickBtn) {
    quickBtn.onclick = () => {
      closeDetailModal();
      openEntradaModal(null, prod.id);
    };
  }

  // Product Entradas List
  const entradasBody = document.getElementById('detail-product-entradas-body');
  if (entradasBody) {
    const prodEntradas = state.entradas.filter(e => e.producto_id === prod.id);
    if (prodEntradas.length === 0) {
      entradasBody.innerHTML = `
        <tr>
          <td colspan="4" class="p-4 text-center text-slate-400">
            No se han registrado entradas para este producto aún.
          </td>
        </tr>
      `;
    } else {
      entradasBody.innerHTML = prodEntradas.map(e => `
        <tr class="hover:bg-slate-50">
          <td class="p-2 font-mono text-slate-500">${formatDate(e.fecha)}</td>
          <td class="p-2 font-bold text-emerald-600">+${e.cantidad}</td>
          <td class="p-2 font-mono">${escapeHtml(e.factura || '-')}</td>
          <td class="p-2 text-slate-600">${escapeHtml(e.ubicacion ? `${e.ubicacion} (${e.stand})` : e.stand || '-')}</td>
        </tr>
      `).join('');
    }
  }

  modal.classList.add('open');
}

function closeDetailModal() {
  document.getElementById('modal-detalle-producto')?.classList.remove('open');
}

// ==========================================
// MODAL: CONFIGURACIÓN DE API
// ==========================================
function openApiConfigModal() {
  const modal = document.getElementById('modal-api-config');
  const input = document.getElementById('api-base-url-input');
  const diagStatus = document.getElementById('api-diag-status');
  const swaggerLink = document.getElementById('api-diag-swagger');

  const currentUrl = CONFIG.getApiBaseUrl();
  if (input) input.value = currentUrl;
  if (diagStatus) {
    diagStatus.textContent = state.isOnline ? '🟢 Conectado' : '🔴 Sin conexión';
    diagStatus.className = state.isOnline ? 'font-bold text-emerald-600' : 'font-bold text-rose-600';
  }
  if (swaggerLink) {
    swaggerLink.href = `${currentUrl}/apidocs`;
  }

  modal?.classList.add('open');
}

function closeApiConfigModal() {
  document.getElementById('modal-api-config')?.classList.remove('open');
}

async function saveApiConfig() {
  const input = document.getElementById('api-base-url-input');
  if (!input) return;

  const newUrl = input.value.trim();
  if (!newUrl) {
    showToast('warning', 'La URL no puede estar vacía');
    return;
  }

  CONFIG.setApiBaseUrl(newUrl);

  // Update Swagger link in navbar
  const swaggerNav = document.getElementById('nav-swagger');
  if (swaggerNav) swaggerNav.href = `${newUrl}/apidocs`;

  showToast('info', 'Probando conexión...');
  closeApiConfigModal();

  try {
    await fetchAllData();
    showToast('success', 'Conexión establecida con éxito');
  } catch (error) {
    showToast('error', error.message);
  }
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================
function formatPrice(val) {
  const num = parseFloat(val);
  return isNaN(num) ? '0.00' : num.toFixed(2);
}

function formatDate(isoDate) {
  if (!isoDate) return '-';
  try {
    const parts = isoDate.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return isoDate;
  } catch {
    return isoDate;
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function showToast(icon, message) {
  Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3500,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer);
      toast.addEventListener('mouseleave', Swal.resumeTimer);
    }
  }).fire({
    icon: icon,
    title: message
  });
}

// Close modals on escape key or clicking backdrop
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeProductModal();
    closeCategoryModal();
    closeEntradaModal();
    closeDetailModal();
    closeApiConfigModal();
  }
});

document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) {
      closeProductModal();
      closeCategoryModal();
      closeEntradaModal();
      closeDetailModal();
      closeApiConfigModal();
    }
  });
});

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
  // Update swagger link href
  const swaggerNav = document.getElementById('nav-swagger');
  if (swaggerNav) swaggerNav.href = `${CONFIG.getApiBaseUrl()}/apidocs`;

  // Fetch all initial data
  fetchAllData();
});

