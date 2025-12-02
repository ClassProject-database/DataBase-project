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

    // Password toggle functionality
    const togglePassword = document.getElementById("togglePassword");
    const passwordInput = document.getElementById("floatingPassword");
    const toggleIcon = document.getElementById("toggleIcon");

    if (togglePassword && passwordInput && toggleIcon) {
      togglePassword.addEventListener("click", () => {
        const type = passwordInput.type === "password" ? "text" : "password";
        passwordInput.type = type;
        
        // Toggle icon
        if (type === "password") {
          toggleIcon.classList.remove("fa-eye-slash");
          toggleIcon.classList.add("fa-eye");
        } else {
          toggleIcon.classList.remove("fa-eye");
          toggleIcon.classList.add("fa-eye-slash");
        }
      });
    }
  });
  