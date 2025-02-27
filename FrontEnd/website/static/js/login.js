document.addEventListener("DOMContentLoaded", () => {
    console.log("Login page loaded!");

    const alerts = document.querySelectorAll(".alert");
    if (alerts.length > 0) {
        // Wait 3 seconds before starting fade out
        setTimeout(() => {
            alerts.forEach(alert => {
                // Add a class to trigger the CSS fade-out transition
                alert.classList.add("fade-out");
                // Listen for the end of the transition and then remove the element
                alert.addEventListener("transitionend", () => {
                    alert.remove();
                });
            });
        }, 3000);
    }
});
