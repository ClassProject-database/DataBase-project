document.addEventListener("DOMContentLoaded", function () {
    console.log(" Checkout page loaded!");

    const checkoutForm = document.getElementById("checkout-form");
    const messageDiv = document.getElementById("checkout-message");
    const submitButton = checkoutForm?.querySelector("button[type='submit']");
    const receiptModal = new bootstrap.Modal(document.getElementById("receiptModal"));
    const receiptDetails = document.getElementById("receiptDetails");
    const closeReceiptBtn = document.getElementById("closeReceiptBtn");
    let isSubmitting = false;

    if (!checkoutForm || !submitButton) {
        console.error(" Missing checkout form or submit button.");
        return;
    }

    // === Helpers ===
    const showError = (field, msg) => {
        field.classList.add("is-invalid");
        if (field.nextElementSibling) field.nextElementSibling.textContent = msg;
    };

    const clearError = (field) => {
        field.classList.remove("is-invalid");
        if (field.nextElementSibling) field.nextElementSibling.textContent = "";
    };

    const showErrorGlobal = (msg, color = "red") => {
        messageDiv.textContent = msg;
        messageDiv.style.color = color;
    };

    const resetState = () => {
        isSubmitting = false;
        submitButton.disabled = false;
    };

    // === Submit Handler ===
    checkoutForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        submitButton.disabled = true;
        isSubmitting = true;
        showErrorGlobal("Processing checkout...", "blue");

        // Form Fields
        const cardNumberEl = document.getElementById("cardNumber");
        const cardHolderEl = document.getElementById("cardHolder");
        const expiryDateEl = document.getElementById("expiration");
        const cvvEl = document.getElementById("cvv");

        const cardNumber = cardNumberEl.value.trim();
        const cardHolder = cardHolderEl.value.trim();
        const expiryDate = expiryDateEl.value.trim();
        const cvv = cvvEl.value.trim();

        // Clear old errors
        [cardNumberEl, cardHolderEl, expiryDateEl, cvvEl].forEach(clearError);

        // Get cart & pricing
        const cart = JSON.parse(localStorage.getItem("cart")) || [];
        const pricing = JSON.parse(localStorage.getItem("pricing_summary") || "{}");

        if (!cart.length) {
            showErrorGlobal(" Your cart is empty.");
            resetState();
            return;
        }

        let valid = true;

        if (!cardHolder) {
            showError(cardHolderEl, " Enter the name on your card.");
            valid = false;
        }

        if (!/^\d{13,19}$/.test(cardNumber)) {
            showError(cardNumberEl, " Enter a valid 13-19 digit card number.");
            valid = false;
        }

        if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiryDate)) {
            showError(expiryDateEl, " Enter a valid expiration date (MM/YY).");
            valid = false;
        }

        if (!/^\d{3,4}$/.test(cvv)) {
            showError(cvvEl, " Enter a valid 3-4 digit CVV.");
            valid = false;
        }

        if (!valid) {
            showErrorGlobal(" Please fix the highlighted fields.");
            resetState();
            return;
        }

        const payload = {
            cart,
            amount: pricing.final_total,
            discount_code: pricing.discount_code,
            card_holder_name: cardHolder,
            card_number: cardNumber,
            expiration: expiryDate
        };

        console.log(" Sending checkout payload:", payload);

        try {
            const res = await fetch("/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            console.log(" Server Response:", data);

            if (data.success) {
                // Show receipt
                const itemList = cart.map(item => `<li>${item.name} - $${(+item.price).toFixed(2)}</li>`).join("");
                receiptDetails.innerHTML = `
                    <p><strong>Items Rented:</strong></p>
                    <ul>${itemList}</ul>
                    <p><strong>Subtotal:</strong> $${pricing.subtotal}</p>
                    <p><strong>Discount Code:</strong> ${pricing.discount_code || "None"}</p>
                    <p><strong>Discount:</strong> ${pricing.discount_percent || 0}%</p>
                    <p><strong>Tax:</strong> ${pricing.tax_percent || 8}+%</p>
                    <p><strong>Total Charged:</strong> <span class="text-success">$${pricing.final_total}+%</span></p>
                `;
                receiptModal.show();

                closeReceiptBtn.onclick = () => {
                    localStorage.removeItem("cart");
                    localStorage.removeItem("discount_code");
                    localStorage.removeItem("pricing_summary");
                    receiptModal.hide();
                    window.location.href = "/user_rentals";
                };
            } else {
                showErrorGlobal(" " + (data.error || "Checkout failed."));
                resetState();
            }
        } catch (err) {
            console.error(" Checkout Error:", err);
            showErrorGlobal(" Something went wrong. Please try again.");
            resetState();
        }
    });
});
