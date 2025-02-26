console.log("cart.js loaded!");

// ✅ Adds an item to the cart
window.addToCart = function (movie_id, name, price) {
    console.log("🛒 addToCart called with:", movie_id, name, price);
    try {
        if (!movie_id || !name || isNaN(price)) {
            console.error("❌ Invalid item data:", { movie_id, name, price });
            return;
        }
        let cart = JSON.parse(localStorage.getItem("cart")) || [];
        // Check for duplicate:
        if (cart.some(item => item.movie_id === movie_id)) {
            console.warn(`Item with movie_id ${movie_id} already in cart.`);
            return;
        }
        cart.push({ movie_id, name, price: parseFloat(price) });
        localStorage.setItem("cart", JSON.stringify(cart));

        updateCartBadge();
        updateCartList();
        showModal(`${name} has been added to your cart!`);
    } catch (error) {
        console.error("❌ Error adding item to cart:", error);
    }
};



// ✅ Updates the cart badge count
function updateCartBadge() {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    let cartBadge = document.querySelector(".cart-badge");
    if (cartBadge) cartBadge.innerText = cart.length;
}

// ✅ Updates the cart list display
function updateCartList() {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    let cartList = document.getElementById("cart-items");
    if (!cartList) return;

    cartList.innerHTML = ""; // Clear existing content
    let total = 0;

    if (cart.length === 0) {
        cartList.innerHTML = `<li class="list-group-item text-center">Your cart is empty.</li>`;
    } else {
        cart.forEach((item, index) => {
            total += item.price;
            let listItem = document.createElement("li");
            listItem.className = "list-group-item d-flex justify-content-between align-items-center";
            listItem.innerHTML = `
                <div>
                    <strong>${item.name}</strong> - $${item.price.toFixed(2)}
                </div>
                <button class="btn btn-sm btn-danger remove-btn" data-index="${index}">Remove</button>
            `;
            cartList.appendChild(listItem);
        });
    }

    let totalPriceElement = document.getElementById("total-price");
    let totalItemsElement = document.getElementById("total-items");
    if (totalItemsElement) totalItemsElement.innerText = cart.length;
    if (totalPriceElement) totalPriceElement.innerText = total.toFixed(2);
}

// ✅ Removes item from the cart
document.addEventListener("click", function (event) {
    if (event.target.classList.contains("remove-btn")) {
        let index = parseInt(event.target.getAttribute("data-index"));
        let cart = JSON.parse(localStorage.getItem("cart")) || [];

        if (index >= 0 && index < cart.length) {
            cart.splice(index, 1);
            localStorage.setItem("cart", JSON.stringify(cart));
            updateCartList();
            updateCartBadge();
            showModal("🛒 Item removed from your cart!");
        }
    }
});

// ✅ Clears the entire cart
document.addEventListener("DOMContentLoaded", function () {
    console.log("cart.js initialized...");
    updateCartBadge();
    updateCartList();

    let clearCartBtn = document.getElementById("clear-cart-btn");
    if (clearCartBtn) {
        clearCartBtn.addEventListener("click", function () {
            localStorage.removeItem("cart");
            updateCartList();
            updateCartBadge();
            showModal("🛒 Your cart has been cleared.");
        });
    }

    let checkoutBtn = document.getElementById("checkout-btn");
    if (checkoutBtn) {
        checkoutBtn.addEventListener("click", async function () {
            let cart = JSON.parse(localStorage.getItem("cart")) || [];
            let totalPrice = parseFloat(document.getElementById("total-price").innerText);
            let discountCode = document.getElementById("discount-code")?.value || "";

            if (cart.length === 0) {
                showModal("🚫 Your cart is empty. Add items before proceeding.");
                return;
            }

            console.log("📤 Sending checkout request...", { cart, totalPrice, discountCode });

            try {
                const response = await fetch("/api/checkout", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        cart,
                        amount: totalPrice,  // ✅ Make sure this is a number
                        payment_method: "Card", 
                        discount_code: discountCode
                    })
                });

                const data = await response.json();
                console.log("📩 Checkout Response:", data);

                if (data.success) {
                    showModal("✅ Checkout successful! Redirecting...");
                    localStorage.removeItem("cart");  // Clear cart after checkout
                    setTimeout(() => { window.location.href = "/user_rentals"; }, 2000);
                } else {
                    showModal("❌ Error: " + data.error);
                }
            } catch (error) {
                console.error("❌ Checkout Error:", error);
                showModal("❌ Error processing checkout.");
            }
        });
    }
});

function showModal(message) {
    const overlay = document.getElementById('customModalOverlay');
    const messageDiv = document.getElementById('customModalMessage');
    const okButton = document.getElementById('customModalOkBtn');

    if (!overlay || !messageDiv || !okButton) {
        console.error("Modal elements not found in the DOM.");
        return;
    }

    // Set the message
    messageDiv.textContent = message;
    // Display the modal overlay
    overlay.classList.add('show');

    // Reassign the click handler on the OK button to close the modal
    okButton.onclick = function () {
        overlay.classList.remove('show');
    };
}

