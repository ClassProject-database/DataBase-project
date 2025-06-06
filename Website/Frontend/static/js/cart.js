console.log("cart.js loaded!");

// Add to Cart
window.addToCart = function (movie_id, name, price) {
  if (!movie_id || !name || isNaN(price)) {
    console.error("Invalid item data:", { movie_id, name, price });
    return;
  }

  try {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    if (cart.some(item => item.movie_id === movie_id)) {
      window.showToast(`${name} is already in your cart.`, "error");
      return;
    }

    cart.push({ movie_id, name, price: parseFloat(price) });
    localStorage.setItem("cart", JSON.stringify(cart));

    updateCartBadge();
    updateCartList();
    window.showToast(`${name} added to cart!`, "success");

  } catch (err) {
    console.error("Error adding to cart:", err);
  }
};

// Update badge in navbar
function updateCartBadge() {
  try {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const badge = document.querySelector(".cart-badge");
    if (badge) badge.innerText = cart.length;
  } catch (err) {
    console.error("Error updating cart badge:", err);
  }
}

// Discount logic
function getDiscountRate(code) {
  switch ((code || "").toUpperCase().trim()) {
    case "VIP": return 0.20;
    case "ADMIN": return 1.00;
    default: return 0;
  }
}

function updateCartList() {
  try {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const cartList = document.getElementById("cart-items");
    const totalPriceEl = document.getElementById("total-price");
    const totalItemsEl = document.getElementById("total-items");

    if (!cartList) return;

    cartList.innerHTML = "";
    let total = 0;

    if (!cart.length) {
      cartList.innerHTML = `<li class="list-group-item text-center">Your cart is empty.</li>`;
    } else {
      cart.forEach((item, i) => {
        total += item.price;
        cartList.innerHTML += `
          <li class="list-group-item d-flex justify-content-between align-items-center">
            <div><strong>${item.name}</strong> - $${item.price.toFixed(2)}</div>
            <button class="btn btn-sm btn-danger remove-btn" data-id="${item.movie_id}">Remove</button>
          </li>`;
      });
    }

    const discountCode = localStorage.getItem("discount_code") || "";
    const discountRate = getDiscountRate(discountCode);
    const taxRate = 0.08;

    const discountAmount = total * discountRate;
    const subtotal = total;
    const totalAfterDiscount = subtotal - discountAmount;
    const taxedTotal = totalAfterDiscount * (1 + taxRate);

    localStorage.setItem("pricing_summary", JSON.stringify({
      subtotal: subtotal.toFixed(2),
      discount_code: discountCode,
      discount_percent: (discountRate * 100).toFixed(0),
      tax_percent: (taxRate * 100).toFixed(0),
      final_total: taxedTotal.toFixed(2)
    }));

    if (totalItemsEl) totalItemsEl.innerText = cart.length;
    if (totalPriceEl) totalPriceEl.innerText = taxedTotal.toFixed(2);

  } catch (err) {
    console.error("Error updating cart list:", err);
  }
}

// Remove from cart
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".remove-btn");
  if (!btn) return;

    const id = btn.dataset.id;
    let cart = JSON.parse(localStorage.getItem("cart") || "[]");

    cart = cart.filter(item => item.movie_id !== id);
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartList();
    updateCartBadge();
    window.showToast("Item removed from your cart.", "success");

});

document.addEventListener("DOMContentLoaded", () => {
  updateCartBadge();
  updateCartList();

  const discountInput = document.getElementById("discount-code");
  if (discountInput) {
    discountInput.value = localStorage.getItem("discount_code") || "";
    discountInput.addEventListener("input", function () {
      localStorage.setItem("discount_code", this.value.trim().toUpperCase());
      updateCartList();
    });
  }

  const clearBtn = document.getElementById("clear-cart-btn");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      localStorage.removeItem("cart");
      updateCartList();
      updateCartBadge();
      window.showToast("🧹 Cart cleared.", "success");
    });
  }

  const checkoutBtn = document.getElementById("checkout-btn");
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", () => {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      if (!cart.length) {
        window.showToast("Your cart is empty.", "error");
      } else {
        window.location.href = "/checkout";
      }
    });
  }
});

document.addEventListener("click", (event) => {
  const btn = event.target.closest(".add-to-cart-btn");
  if (!btn) return;

  const movieId = btn.dataset.movieId;
  const title = btn.dataset.title;
  const price = btn.dataset.price;

  if (!movieId || !title || !price) {
    console.error("Missing button data attributes.");
    return;
  }

  if (typeof addToCart === "function") {
    addToCart(movieId, title, price);
  }
});
