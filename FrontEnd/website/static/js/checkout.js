document.addEventListener("DOMContentLoaded", function () {
    const checkoutForm = document.getElementById("checkout-form");
    const messageDiv = document.getElementById("checkout-message");

    checkoutForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        // Retrieve payment form data
        const cardNumber = document.getElementById("card-number").value.trim();
        const expiryDate = document.getElementById("expiry-date").value.trim();
        const cvv = document.getElementById("cvv").value.trim();
        const discountCode = document.getElementById("discount-code").value.trim();

        //  validation for payment info
        if (!cardNumber || !expiryDate || !cvv) {
            messageDiv.textContent = "Please enter all required payment details.";
            messageDiv.style.color = "red";
            return;
        }

        // Retrieve cart data from localStorage
        const cart = JSON.parse(localStorage.getItem("cart")) || [];
        if (cart.length === 0) {
            messageDiv.textContent = "Your cart is empty. Add items before checkout.";
            messageDiv.style.color = "red";
            return;
        }

        // Calculate total amount
        const totalAmount = cart.reduce((sum, item) => sum + parseFloat(item.price), 0).toFixed(2);

        // Prepare checkout data
        const checkoutData = {
            cart: cart,
            amount: totalAmount,
            payment_method: "Card", // In our simulation, always "Card"
            discount_code: discountCode
        };

        console.log("Sending checkout data:", checkoutData);

        try {
            const response = await fetch("/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(checkoutData)
            });

            // Try to parse the response as JSON
            const data = await response.json();
            console.log("Checkout Response:", data);

            if (data.success) {
                messageDiv.textContent = "Checkout successful! Redirecting to your rentals...";
                messageDiv.style.color = "green";
                localStorage.removeItem("cart"); // Clear cart after checkout
                setTimeout(() => {
                    window.location.href = "/user_rentals";
                }, 4000);
            } else {
                messageDiv.textContent = "Checkout failed: " + data.error;
                messageDiv.style.color = "red";
            }
        } catch (error) {
            console.error("Checkout Error:", error);
            messageDiv.textContent = "An error occurred during checkout.";
            messageDiv.style.color = "red";
        }
    });
});
