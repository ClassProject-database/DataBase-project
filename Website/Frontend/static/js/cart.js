console.log("cart.js loaded!");

window.addToCart = function (movie_id, name, price) {
    console.log("Adding to cart:", movie_id, name, price);
    try {
        if (!movie_id || !name || isNaN(price)) {
            console.error("Invalid item data", { movie_id, name, price });
            return;
        }
        let cart = JSON.parse(localStorage.getItem("cart")) || [];
        if (cart.some(item => item.movie_id === movie_id)) {
            console.warn(`Movie ID ${movie_id} is already in the cart.`);
            return;
        }
        cart.push({ movie_id, name, price: parseFloat(price) });
        localStorage.setItem("cart", JSON.stringify(cart));
        updateCartBadge();
        updateCartList();
        showModal(`${name} has been added to your cart!`);
    } catch (err) {
        console.error("Error adding to cart:", err);
    }
};


function updateCartBadge() {
    try {
        const cart = JSON.parse(localStorage.getItem("cart")) || [];
        const badge = document.querySelector(".cart-badge");
        if (badge) badge.innerText = cart.length;
    } catch (err) {
        console.error("Error updating cart badge:", err);
    }
}


 
function getDiscountRate(code) {
    switch ((code || "").toUpperCase().trim()) {
        case "VIP": return 0.20;
        case "ADMIN": return 1.00;
        default: return 0;
    }
}

function updateCartList() {
    try {
        const cart = JSON.parse(localStorage.getItem("cart")) || [];
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
                        <button class="btn btn-sm btn-danger remove-btn" data-index="${i}">Remove</button>
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

        // Save pricing summary
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

// Remove item from cart 
document.addEventListener("click", function (e) {
    if (!e.target.classList.contains("remove-btn")) return;
    const i = parseInt(e.target.getAttribute("data-index"));
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    if (i >= 0 && i < cart.length) {
        cart.splice(i, 1);
        localStorage.setItem("cart", JSON.stringify(cart));
        updateCartList();
        updateCartBadge();
        showModal("🗑️ Item removed from your cart.");
    }
});

function showModal(message) {
    const overlay = document.getElementById("customModalOverlay");
    const messageDiv = document.getElementById("customModalMessage");
    const okBtn = document.getElementById("customModalOkBtn");
    if (!overlay || !messageDiv || !okBtn) return;
    messageDiv.textContent = message;
    overlay.classList.add("show");
    okBtn.onclick = () => overlay.classList.remove("show");
}


document.addEventListener("DOMContentLoaded", function () {
    updateCartBadge();
    updateCartList();

    const discountInput = document.getElementById("discount-code");
    if (discountInput) {
        const saved = localStorage.getItem("discount_code") || "";
        discountInput.value = saved;
        discountInput.addEventListener("input", function () {
            localStorage.setItem("discount_code", this.value.trim().toUpperCase());
            updateCartList();
        });
    }

    const clearCartBtn = document.getElementById("clear-cart-btn");
    if (clearCartBtn) {
        clearCartBtn.addEventListener("click", function () {
            localStorage.removeItem("cart");
            updateCartList();
            updateCartBadge();
            showModal(" Cart cleared.");
        });
    }

    const checkoutBtn = document.getElementById("checkout-btn");
    if (checkoutBtn) {
        checkoutBtn.addEventListener("click", function () {
            const cart = JSON.parse(localStorage.getItem("cart")) || [];
            if (!cart.length) {
                showModal(" Your cart is empty. Add something first!");
                return;
            }
            window.location.href = "/checkout";
        });
    }
});
document.addEventListener("click", (event) => {
    // Check if the click
    const btn = event.target.closest(".add-to-cart-btn");
    if (!btn) return; // Not a cart button, ignore.

    const movieId = JSON.parse(btn.dataset.movieId);
    const title = JSON.parse(btn.dataset.movieTitle);
    const price = JSON.parse(btn.dataset.moviePrice);
    console.log("Delegated add-to-cart click:", movieId, title, price);

    if (typeof addToCart === "function") {
        addToCart(movieId, title, price);
    } else {
        console.warn("addToCart function is not defined.");
    }
});

