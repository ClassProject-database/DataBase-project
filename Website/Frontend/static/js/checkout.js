document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const cartListEl        = document.getElementById("cart-items");
  const subtotalEl        = document.getElementById("subtotal");
  const discountCodeEl    = document.getElementById("discount-code-text");
  const discountPercentEl = document.getElementById("discount-percent");
  const taxPercentEl      = document.getElementById("tax-percent");
  const totalPriceEl      = document.getElementById("total-price");
  const form              = document.getElementById("checkout-form");
  const msgDiv            = document.getElementById("checkout-message");
  const submitBtn         = document.getElementById("submit-button");

  if (!form || !submitBtn) {
    console.error("checkout.js: missing #checkout-form or submit button");
    return;
  }

  // Helper to show either your global toast or fallback to inline message
  const toastMsg = (text, type = "success") => {
    if (window.showToast) return window.showToast(text, type);
    msgDiv.textContent = text;
    msgDiv.className = type === "error" ? "text-danger" : "text-success";
  };

  // Clear validation state
  const clearError = el => el.classList.remove("is-invalid");
  // Mark invalid + show message
  const showError = (el, message) => {
    el.classList.add("is-invalid");
    const fb = el.nextElementSibling;
    if (fb) fb.textContent = message;
  };

  let isSubmitting = false;
  const resetSubmit = () => {
    isSubmitting = false;
    submitBtn.disabled = false;
  };

  // ————— Populate the order summary —————
  const populateSummary = () => {
    const cart    = JSON.parse(localStorage.getItem("cart")           || "[]");
    const pricing = JSON.parse(localStorage.getItem("pricing_summary") || "{}");

    subtotalEl.textContent        = pricing.subtotal           || "0.00";
    discountCodeEl.textContent    = pricing.discount_code      || "None";
    discountPercentEl.textContent = (pricing.discount_percent || "0") + "%";
    taxPercentEl.textContent      = (pricing.tax_percent     || "0") + "%";
    totalPriceEl.textContent      = pricing.final_total       || "0.00";

    if (cart.length) {
      cartListEl.innerHTML = cart.map(item => `
        <li class="list-group-item bg-transparent text-white d-flex justify-content-between">
          <span>${item.name}</span><span>$${(+item.price).toFixed(2)}</span>
        </li>`).join("");
    } else {
      cartListEl.innerHTML = `
        <li class="list-group-item bg-transparent text-muted text-center">
          Your cart is empty.
        </li>`;
    }
  };

  populateSummary();

  // ————— Handle form submission —————
  form.addEventListener("submit", async e => {
    e.preventDefault();
    if (isSubmitting) return;
    isSubmitting = true;
    submitBtn.disabled = true;
    msgDiv.textContent = "";

    toastMsg("Processing…", "info");

    // Grab inputs
    const cardHolderEl = document.getElementById("cardHolder");
    const cardNumberEl = document.getElementById("cardNumber");
    const expirationEl = document.getElementById("expiration");
    const cvvEl        = document.getElementById("cvv");

    [cardHolderEl, cardNumberEl, expirationEl, cvvEl].forEach(clearError);

    // Load fresh data
    const cart    = JSON.parse(localStorage.getItem("cart")           || "[]");
    const pricing = JSON.parse(localStorage.getItem("pricing_summary") || "{}");

    if (!cart.length) {
      toastMsg("Your cart is empty.", "error");
      return resetSubmit();
    }

    // Validate
    let valid = true;
    if (!cardHolderEl.value.trim())                        { showError(cardHolderEl, "Name required");         valid = false; }
    if (!/^\d{13,19}$/.test(cardNumberEl.value.trim()))    { showError(cardNumberEl, "13–19 digits");         valid = false; }
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expirationEl.value.trim())) {
      showError(expirationEl, "MM/YY");                    valid = false;
    }
    if (!/^\d{3,4}$/.test(cvvEl.value.trim()))             { showError(cvvEl, "3–4 digits");                  valid = false; }

    if (!valid) {
      toastMsg("Please fix the highlighted fields.", "error");
      return resetSubmit();
    }

    // Build payload
    const payload = {
      cart,
      amount:            pricing.final_total,
      discount_code:     pricing.discount_code,
      card_holder_name:  cardHolderEl.value.trim(),
      card_number:       cardNumberEl.value.trim(),
      expiration:        expirationEl.value.trim()
    };

    try {
      const res  = await fetch("/api/checkout", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        toastMsg("🎉 Purchase complete! Redirecting…", "success");
        localStorage.clear();
        setTimeout(() => window.location.href = "/user_Rentals", 1200);
      } else {
        throw new Error(data.error || "Checkout failed");
      }
    } catch (err) {
      console.error("checkout.js error:", err);
      toastMsg(err.message || "Something went wrong.", "error");
      resetSubmit();
    }
  });
});
