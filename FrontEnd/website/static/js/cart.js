console.log("cart.js loaded!");

// Adds an item to the cart
window.addToCart = function (name, price) {
    try {
        let cart = JSON.parse(localStorage.getItem("cart")) || [];
        cart.push({ name: name, price: parseFloat(price) });
        localStorage.setItem("cart", JSON.stringify(cart));

        updateCartBadge();
        updateCartList();
        showModal(`${name} has been added to your cart!`);
    } catch (error) {
        console.error("Error adding item to cart:", error);
    }
};

// Updates the cart badge count
function updateCartBadge() {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    let cartBadge = document.querySelector(".cart-badge");
    if (cartBadge) {
        cartBadge.innerText = cart.length;
    }
}

// Updates the cart list display
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

// Removes item from the cart
document.addEventListener("click", function (event) {
    if (event.target.classList.contains("remove-btn")) {
        let index = event.target.getAttribute("data-index");
        let cart = JSON.parse(localStorage.getItem("cart")) || [];
        cart.splice(index, 1);
        localStorage.setItem("cart", JSON.stringify(cart));
        updateCartList();
        updateCartBadge();
        showModal("Item removed from your cart!");
    }
});

// Clears the entire cart
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
            showModal("Your cart has been cleared.");
        });
    }
});

// Function to show the custom modal alert
function showModal(message) {
    const overlay = document.getElementById('customModalOverlay');
    const messageDiv = document.getElementById('customModalMessage');
    const okButton = document.getElementById('customModalOkBtn');

    if (!overlay || !messageDiv || !okButton) {
        console.error("Modal elements not found in the DOM.");
        return;
    }

    messageDiv.textContent = message;
    overlay.classList.add('show');

    // ✅ Remove old click event before adding a new one (fixes multiple clicks issue)
    okButton.replaceWith(okButton.cloneNode(true)); 
    document.getElementById('customModalOkBtn').addEventListener("click", function () {
        overlay.classList.remove('show');
    });
}
