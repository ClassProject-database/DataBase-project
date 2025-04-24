document.addEventListener("DOMContentLoaded", () => {
    console.log("Login page loaded!");
  
    document.querySelectorAll(".alert").forEach(alert => {
      setTimeout(() => {
        alert.classList.add("fade-out");
        alert.addEventListener("transitionend", () => alert.remove());
      }, 3000);
    });
  
    // Clear the discount code from localStorage
    localStorage.removeItem("discount_code");
  });
  