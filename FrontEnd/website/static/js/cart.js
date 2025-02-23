console.log("cart.js loaded!");

// ✅ Define `addToCart` globally so it's accessible everywhere
window.addToCart = function (name, price) {
    try {
        let cart = JSON.parse(localStorage.getItem("cart")) || [];
        let newItem = { name: name, price: parseFloat(price) };
        cart.push(newItem);
        localStorage.setItem("cart", JSON.stringify(cart));

        updateCartBadge();
        // Only update the cart list if the element exists
        if (document.getElementById("cart-items")) {
            updateCartList();
        }
        alert(`${name} has been added to your cart!`);
    } catch (error) {
        console.error("Error adding item to cart:", error);
    }
};


// ✅ Update Cart Badge Count
function updateCartBadge() {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    let cartBadge = document.querySelector(".cart-badge");
    if (cartBadge) {
        cartBadge.innerText = cart.length;
    }
}

// ✅ Update Cart List Display
function updateCartList() {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    let cartList = document.getElementById("cart-items");
    if (!cartList) {
        // Optionally, simply return if the element is not found
        return;
    }
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


// ✅ Remove Item from Cart
document.addEventListener("click", function (event) {
    if (event.target.classList.contains("remove-btn")) {
        let index = event.target.getAttribute("data-index");
        let cart = JSON.parse(localStorage.getItem("cart")) || [];
        cart.splice(index, 1);
        localStorage.setItem("cart", JSON.stringify(cart));
        updateCartList();
        updateCartBadge();
    }
});

// ✅ Clear Cart Function
document.addEventListener("DOMContentLoaded", function () {
    let clearCartBtn = document.getElementById("clear-cart-btn");
    if (clearCartBtn) {
        clearCartBtn.addEventListener("click", function () {
            localStorage.removeItem("cart");
            updateCartList();
            updateCartBadge();
        });
    }
});

// ✅ Load Cart Display on Page Load
document.addEventListener("DOMContentLoaded", function () {
    console.log("cart.js script initialized...");
    updateCartBadge();
    updateCartList();
});
