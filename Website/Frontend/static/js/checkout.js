document.addEventListener("DOMContentLoaded", () => {

  const messageDiv = document.getElementById("checkout-message");
  function showMessage(msg, type = "error") {
    messageDiv.textContent = msg;
    messageDiv.className = `checkout-message mt-3 text-center ${type}`;
  }

  function loadSummary() {
    const cart    = JSON.parse(localStorage.getItem("cart")            || "[]" );
    const pricing = JSON.parse(localStorage.getItem("pricing_summary") || "{}");

    // items
    const ul = document.getElementById("cart-items");
    if (!cart.length) {
      ul.innerHTML = `<li class="list-group-item bg-transparent text-muted text-center">
                        Your cart is empty.
                      </li>`;
    } else {
      ul.innerHTML = cart.map(item =>
        `<li class="list-group-item bg-transparent d-flex justify-content-between">
           <span>${item.name}</span>
           <span>$${(+item.price).toFixed(2)}</span>
         </li>`
      ).join("");
    }

    // numbers
    document.getElementById("subtotal").textContent      = pricing.subtotal      || "0.00";
    document.getElementById("discount-code-text").textContent = pricing.discount_code || "None";
    document.getElementById("discount-percent").textContent   = (pricing.discount_percent || "0") + "%";
    document.getElementById("tax-percent").textContent        = (pricing.tax_percent      || "0") + "%";
    document.getElementById("total-price").textContent        = pricing.final_total  || "0.00";
  }

  loadSummary();

  const form         = document.getElementById("checkout-form");
  const submitButton = document.getElementById("submit-button");
  if (!form || !submitButton) return;

  function validateField(el, pattern, errMsg) 
  {
    el.classList.remove("is-invalid");
    if (!pattern.test(el.value.trim())) {
      el.classList.add("is-invalid");
      el.nextElementSibling.textContent = errMsg;
      return false;
    }
    return true;
  }

  form.addEventListener("submit", async e => {
    e.preventDefault();
    showMessage("", "");       
    submitButton.disabled = true;

    // grab fields
    const cardHolderEl = document.getElementById("cardHolder");
    const cardNumberEl = document.getElementById("cardNumber");
    const expiryEl     = document.getElementById("expiration");
    const cvvEl        = document.getElementById("cvv");

    let ok = true;
    ok = validateField(cardHolderEl, /.+/,              "Enter the name on your card.")         && ok;
    ok = validateField(cardNumberEl, /^\d{13,19}$/,      "Enter a valid 13–19 digit card number.")&& ok;
    ok = validateField(expiryEl,     /^(0[1-9]|1[0-2])\/\d{2}$/,
                       "Enter a valid expiration date MM/YY.")                  && ok;
    ok = validateField(cvvEl,        /^\d{3,4}$/,        "Enter a valid 3–4 digit CVV.")        && ok;

    if (!ok) {
      showMessage("Please fix the highlighted fields.", "error");
      submitButton.disabled = false;
      return;
    }

    // collect payload
    const cart    = JSON.parse(localStorage.getItem("cart")            || "[]" );
    const pricing = JSON.parse(localStorage.getItem("pricing_summary") || "{}");
    if (!cart.length) {
      showMessage("Your cart is empty.", "error");
      submitButton.disabled = false;
      return;
    }

    const payload = {
      cart,
      amount:       pricing.final_total,
      discount_code: pricing.discount_code,
      card_holder_name: cardHolderEl.value.trim(),
      card_number:      cardNumberEl.value.trim(),
      expiration:       expiryEl.value.trim()
    };

    try {
      const res  = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload)
      });
      const text = await res.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error("Non‑JSON response:", text);
        showMessage("Server error. Please try again later.", "error");
        submitButton.disabled = false;
        return;
      }

      if (!res.ok || !data.success) {
        showMessage(data.error || `Error ${res.status}`, "error");
        submitButton.disabled = false;
        return;
      }

      // success!
      showMessage("Purchase complete! Redirecting...", "success");
      localStorage.clear();
      setTimeout(() => window.location.href = "/user_Rentals", 1500);

    } catch (err) {
      console.error("Checkout exception:", err);
      showMessage("Network error. Please try again.", "error");
      submitButton.disabled = false;
    }
  });
});
