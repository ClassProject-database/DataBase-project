document.addEventListener("DOMContentLoaded", () => {
    console.log("Checkout page loaded!");
  
    const form = document.getElementById("checkout-form");
    const messageDiv = document.getElementById("checkout-message");
    const submitBtn = form?.querySelector("button[type='submit']");
    const receiptModal = new bootstrap.Modal(document.getElementById("receiptModal"));
    const receiptDetails = document.getElementById("receiptDetails");
    const closeReceiptBtn = document.getElementById("closeReceiptBtn");
  
    if (!form || !submitBtn) {
      console.error("Missing form or submit button.");
      return;
    }
  
    let isSubmitting = false;
  
    const clearError = (input) => input.classList.remove("is-invalid");
  
    const showError = (input, message) => {
      input.classList.add("is-invalid");
      const feedback = input.nextElementSibling;
      if (feedback) feedback.textContent = message;
    };
  
    const showMessage = (msg, type = "info") => {
      if (window.showToast) {
        window.showToast(msg, type);
      } else {
        messageDiv.textContent = msg;
        messageDiv.style.color = type === "error" ? "red" : "green";
      }
    };
  
    const resetSubmit = () => {
      isSubmitting = false;
      submitBtn.disabled = false;
    };
  
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (isSubmitting) return;
  
      submitBtn.disabled = true;
      isSubmitting = true;
  
      showMessage("Processing checkout...", "info");
  
      const cardHolderEl = document.getElementById("cardHolder");
      const cardNumberEl = document.getElementById("cardNumber");
      const expirationEl = document.getElementById("expiration");
      const cvvEl = document.getElementById("cvv");
  
      const cardHolder = cardHolderEl.value.trim();
      const cardNumber = cardNumberEl.value.trim();
      const expiration = expirationEl.value.trim();
      const cvv = cvvEl.value.trim();
  
      [cardHolderEl, cardNumberEl, expirationEl, cvvEl].forEach(clearError);
  
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      const pricing = JSON.parse(localStorage.getItem("pricing_summary") || "{}");
  
      if (!cart.length) {
        showMessage("Your cart is empty.", "error");
        resetSubmit();
        return;
      }
  
      let valid = true;
  
      if (!cardHolder) {
        showError(cardHolderEl, "Enter the name on your card.");
        valid = false;
      }
  
      if (!/^\d{13,19}$/.test(cardNumber)) {
        showError(cardNumberEl, "Enter a valid 13–19 digit card number.");
        valid = false;
      }
  
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiration)) {
        showError(expirationEl, "Enter a valid expiration (MM/YY).");
        valid = false;
      }
  
      if (!/^\d{3,4}$/.test(cvv)) {
        showError(cvvEl, "Enter a valid 3 or 4-digit CVV.");
        valid = false;
      }
  
      if (!valid) {
        showMessage("Please fix the highlighted fields.", "error");
        resetSubmit();
        return;
      }
  
      const payload = {
        cart,
        amount: pricing.final_total,
        discount_code: pricing.discount_code,
        card_holder_name: cardHolder,
        card_number: cardNumber,
        expiration
      };
  
      console.log("Submitting checkout payload:", payload);
  
      try {
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
  
        const data = await res.json();
        console.log("Server response:", data);
  
        if (data.success) {
          //  receipt
          const itemList = cart.map(item => `
            <li>${item.name} - $${(+item.price).toFixed(2)}</li>`).join("");
  
          receiptDetails.innerHTML = `
            <p><strong>Items Rented:</strong></p>
            <ul>${itemList}</ul>
            <p><strong>Subtotal:</strong> $${pricing.subtotal}</p>
            <p><strong>Discount Code:</strong> ${pricing.discount_code || "None"}</p>
            <p><strong>Discount:</strong> ${pricing.discount_percent || 0}%</p>
            <p><strong>Tax:</strong> ${pricing.tax_percent || 8}%</p>
            <p><strong>Total Charged:</strong> <span class="text-success fw-bold">$${pricing.final_total}</span></p>
          `;
  
          receiptModal.show();
  
          closeReceiptBtn.onclick = () => {
            localStorage.clear();
            receiptModal.hide();
            window.location.href = "/user_Rentals";
          };
  
        } else {
          showMessage(data.error || "Checkout failed.", "error");
          resetSubmit();
        }
  
      } catch (err) {
        console.error("Checkout error:", err);
        showMessage("Something went wrong. Please try again.", "error");
        resetSubmit();
      }
    });
  });
  