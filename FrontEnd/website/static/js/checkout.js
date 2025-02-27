document.addEventListener("DOMContentLoaded", function () {
    console.log("📌 Checkout page loaded!");

    const checkoutForm = document.getElementById("checkout-form");
    const messageDiv = document.getElementById("checkout-message");
    const submitButton = checkoutForm.querySelector("button[type='submit']");
    let isSubmitting = false; // ✅ Add a flag for submission status

    if (!checkoutForm) {
        console.error("❌ Checkout form not found!");
        return;
    }

    // ✅ Handle form submission only once
    checkoutForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        // ✅ Prevent duplicate form submissions
        if (submitButton.disabled || isSubmitting) return;
        submitButton.disabled = true;
        isSubmitting = true; // ✅ Set the flag to true

        messageDiv.textContent = "Processing checkout...";
        messageDiv.style.color = "blue";

        // ✅ Declare `valid` at the start
        let valid = true;

        // ✅ Get form values
        const cardNumber = document.getElementById("card-number").value.trim();
        const expiryDate = document.getElementById("expiry-date").value.trim();
        const cvv = document.getElementById("cvv").value.trim();
        const discountCode = document.getElementById("discount-code").value.trim();

<<<<<<< HEAD
        // ✅ Retrieve cart from localStorage
=======
        //  validation for payment info
        if (!cardNumber || !expiryDate || !cvv) {
            messageDiv.textContent = "Please enter all required payment details.";
            messageDiv.style.color = "red";
            return;
        }

        // Retrieve cart data from localStorage
>>>>>>> 71555c479a176f58de49488e65f7b1983e002b71
        const cart = JSON.parse(localStorage.getItem("cart")) || [];
        if (cart.length === 0) {
            showErrorGlobal("Your cart is empty. Add items before checkout.");
            return;
        }

<<<<<<< HEAD
        // ✅ Calculate total amount
        const totalAmount = cart.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0).toFixed(2);
=======
        // Calculate total amount
        const totalAmount = cart.reduce((sum, item) => sum + parseFloat(item.price), 0).toFixed(2);
>>>>>>> 71555c479a176f58de49488e65f7b1983e002b71

        // ✅ Validation Functions
        function showError(field, message) {
            field.classList.add("is-invalid");
            if (field.nextElementSibling) field.nextElementSibling.textContent = message;
            valid = false;
        }

        function clearError(field) {
            field.classList.remove("is-invalid");
            if (field.nextElementSibling) field.nextElementSibling.textContent = "";
        }

        function showErrorGlobal(message) {
            messageDiv.textContent = message;
            messageDiv.style.color = "red";
            submitButton.disabled = false;
            valid = false;
        }

        // ✅ Validate Credit Card (13-19 digits)
        if (!/^\d{13,19}$/.test(cardNumber)) {
            showError(document.getElementById("card-number"), "Invalid card number.");
        } else {
            clearError(document.getElementById("card-number"));
        }

        // ✅ Validate Expiry Date (MM/YY)
        if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiryDate)) {
            showError(document.getElementById("expiry-date"), "Invalid expiry date.");
        } else {
            clearError(document.getElementById("expiry-date"));
        }

        // ✅ Validate CVV (3-4 digits)
        if (!/^\d{3,4}$/.test(cvv)) {
            showError(document.getElementById("cvv"), "Invalid CVV.");
        } else {
            clearError(document.getElementById("cvv"));
        }

        if (!valid) {
            showErrorGlobal("⚠️ Please correct the highlighted fields.");
            isSubmitting = false; // ✅ Reset the flag on error
            return;
        }

        // ✅ Checkout Data
        const checkoutData = {
            cart: cart,
            amount: totalAmount,
            payment_method: "Card",
            discount_code: discountCode
        };

        console.log("📤 Sending checkout data:", checkoutData);

        try {
            const response = await fetch("/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(checkoutData)
            });

            if (!response.ok) throw new Error(`Server responded with ${response.status}`);

            const data = await response.json();
            console.log("📩 Checkout Response:", data);

            if (data.success) {
                messageDiv.textContent = "✅ Checkout successful! Redirecting...";
                messageDiv.style.color = "green";
                localStorage.removeItem("cart"); // ✅ Clear cart after checkout
                // ✅ Redirect immediately
                window.location.href = "/user_rentals";

            } else {
                showErrorGlobal("Checkout failed: " + (data.error || "Unknown error"));
                isSubmitting = false; // ✅ Reset the flag on error

            }
        } catch (error) {
            console.error("❌ Checkout Error:", error);
            showErrorGlobal("An error occurred during checkout. Please try again.");
            isSubmitting = false; // ✅ Reset the flag on error

        } finally {
            if (!data.success) {
                submitButton.disabled = false; // ✅ Enable the button again only if the request failed
            }
        }
    });
});