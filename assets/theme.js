/**
 * CHAR CHAAND HAUTE COUTURE — CORE SHOPIFY THEME JS
 */

document.addEventListener('DOMContentLoaded', () => {
  initCart();
  initWishlist();
  initMobileMenu();
});

// Toast Notification
function showToast(message) {
  let toast = document.getElementById('char-chaand-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'char-chaand-toast';
    toast.className = 'char-chaand-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// ==========================================
// 1. SHOPIFY CART API & DRAWER
// ==========================================
function initCart() {
  document.querySelectorAll('form[action*="/cart/add"]').forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector('[type="submit"]');
      const originalText = submitBtn ? submitBtn.innerText : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = 'SECURING CONSIGNMENT...';
      }

      try {
        const formData = new FormData(form);
        const response = await fetch('/cart/add.js', {
          method: 'POST',
          body: formData,
          headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });
        const item = await response.json();
        
        if (response.ok) {
          showToast(`Added to Consignment Bag: ${item.title || 'Piece'}`);
          await updateCartDrawer();
          openCartDrawer();
        } else {
          showToast(item.description || 'Unable to add item');
        }
      } catch (err) {
        console.error('Cart add error:', err);
        // Fallback standard submit if AJAX fails
        form.submit();
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerText = originalText;
        }
      }
    });
  });

  // Cart drawer triggers
  document.querySelectorAll('[data-cart-drawer-trigger]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openCartDrawer();
    });
  });

  const closeBtn = document.getElementById('cart-drawer-close');
  if (closeBtn) closeBtn.addEventListener('click', closeCartDrawer);

  const overlay = document.getElementById('cart-drawer-overlay');
  if (overlay) overlay.addEventListener('click', closeCartDrawer);
}

function openCartDrawer() {
  const drawer = document.getElementById('cart-drawer');
  const overlay = document.getElementById('cart-drawer-overlay');
  if (drawer && overlay) {
    updateCartDrawer();
    drawer.classList.add('active');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeCartDrawer() {
  const drawer = document.getElementById('cart-drawer');
  const overlay = document.getElementById('cart-drawer-overlay');
  if (drawer && overlay) {
    drawer.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }
}

async function updateCartDrawer() {
  try {
    const res = await fetch('/cart.js');
    const cart = await res.json();
    
    // Update badge count
    document.querySelectorAll('.cart-count-badge').forEach(badge => {
      badge.textContent = cart.item_count;
      badge.style.display = cart.item_count > 0 ? 'flex' : 'none';
    });

    const itemsContainer = document.getElementById('cart-drawer-items');
    const subtotalEl = document.getElementById('cart-drawer-subtotal');
    
    if (subtotalEl) {
      const formattedPrice = (cart.total_price / 100).toLocaleString('en-IN', {
        style: 'currency',
        currency: cart.currency || 'INR',
        maximumFractionDigits: 0
      });
      subtotalEl.textContent = formattedPrice;
    }

    if (itemsContainer) {
      if (cart.items.length === 0) {
        itemsContainer.innerHTML = `
          <div class="py-16 text-center text-[#706465] space-y-3">
            <span class="text-3xl">🛍️</span>
            <p class="text-xs uppercase tracking-widest font-medium">Your consignment bag is empty.</p>
            <a href="/collections/all" class="inline-block mt-2 px-6 py-2.5 bg-[#4A0E17] text-[#FAF7F2] text-[10px] uppercase tracking-widest font-semibold rounded-sm hover:bg-[#3B0A11] transition-all">Explore Collections</a>
          </div>
        `;
      } else {
        itemsContainer.innerHTML = cart.items.map(item => `
          <div class="flex gap-4 py-4 border-b border-[#EDE4D8] items-center text-xs">
            <div class="w-16 h-20 bg-[#F5ECE1] rounded-sm overflow-hidden flex-shrink-0">
              <img src="${item.image}" alt="${item.title}" class="w-full h-full object-cover">
            </div>
            <div class="flex-1 min-w-0 space-y-1">
              <h4 class="font-medium text-[#1F1617] truncate">${item.product_title}</h4>
              ${item.variant_title ? `<p class="text-[10px] text-[#706465]">${item.variant_title}</p>` : ''}
              <p class="text-[11px] text-[#4A0E17] font-semibold">${(item.price / 100).toLocaleString('en-IN', { style: 'currency', currency: cart.currency || 'INR', maximumFractionDigits: 0 })}</p>
              <div class="flex items-center gap-2 pt-1">
                <button type="button" class="w-5 h-5 border border-[#EDE4D8] rounded flex items-center justify-center text-[10px] hover:border-[#4A0E17]" onclick="changeItemQty('${item.key}', ${item.quantity - 1})">-</button>
                <span class="text-[11px] px-1">${item.quantity}</span>
                <button type="button" class="w-5 h-5 border border-[#EDE4D8] rounded flex items-center justify-center text-[10px] hover:border-[#4A0E17]" onclick="changeItemQty('${item.key}', ${item.quantity + 1})">+</button>
                <button type="button" class="text-[10px] text-[#BA1A1A] underline ml-auto uppercase tracking-wider" onclick="changeItemQty('${item.key}', 0)">Remove</button>
              </div>
            </div>
          </div>
        `).join('');
      }
    }
  } catch (err) {
    console.error('Error fetching cart:', err);
  }
}

async function changeItemQty(key, quantity) {
  try {
    await fetch('/cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      body: JSON.stringify({ id: key, quantity: quantity })
    });
    await updateCartDrawer();
  } catch (err) {
    console.error('Error updating quantity:', err);
  }
}

// ==========================================
// 2. CLIENT-SIDE WISHLIST WITH LOCALSTORAGE
// ==========================================
function getWishlist() {
  try {
    return JSON.parse(localStorage.getItem('char_chaand_wishlist') || '[]');
  } catch {
    return [];
  }
}

function setWishlist(list) {
  localStorage.setItem('char_chaand_wishlist', JSON.stringify(list));
  updateWishlistUI();
}

function toggleWishlistItem(handle, title, price, image, url) {
  let list = getWishlist();
  const index = list.findIndex(i => i.handle === handle);
  if (index > -1) {
    list.splice(index, 1);
    setWishlist(list);
    showToast(`Removed from Saved Creations: ${title}`);
    return false;
  } else {
    list.push({ handle, title, price, image, url, date: new Date().toLocaleDateString() });
    setWishlist(list);
    showToast(`Saved to Atelier Wishlist: ${title}`);
    return true;
  }
}

function updateWishlistUI() {
  const list = getWishlist();
  // Update wishlist badges
  document.querySelectorAll('.wishlist-count-badge').forEach(badge => {
    badge.textContent = list.length;
    badge.style.display = list.length > 0 ? 'flex' : 'none';
  });

  // Toggle active class on wishlist buttons
  document.querySelectorAll('[data-wishlist-handle]').forEach(btn => {
    const handle = btn.getAttribute('data-wishlist-handle');
    const isSaved = list.some(i => i.handle === handle);
    btn.classList.toggle('text-[#BA1A1A]', isSaved);
    btn.classList.toggle('fill-current', isSaved);
  });
}

function initWishlist() {
  document.querySelectorAll('[data-wishlist-btn]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const handle = btn.getAttribute('data-wishlist-handle');
      const title = btn.getAttribute('data-wishlist-title') || 'Product';
      const price = btn.getAttribute('data-wishlist-price') || '';
      const image = btn.getAttribute('data-wishlist-image') || '';
      const url = btn.getAttribute('data-wishlist-url') || '';
      toggleWishlistItem(handle, title, price, image, url);
    });
  });
  updateWishlistUI();
}

// ==========================================
// 3. MOBILE MENU
// ==========================================
function initMobileMenu() {
  const toggle = document.getElementById('mobile-menu-toggle');
  const menu = document.getElementById('mobile-menu-drawer');
  const close = document.getElementById('mobile-menu-close');
  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      menu.classList.toggle('hidden');
    });
  }
  if (close && menu) {
    close.addEventListener('click', () => {
      menu.classList.add('hidden');
    });
  }
}
