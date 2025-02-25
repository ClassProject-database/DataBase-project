document.addEventListener("DOMContentLoaded", function() {
    console.log("Login page loaded!");

    // Example: Show an alert if there is a flash message
    let alerts = document.querySelectorAll(".alert");
    if (alerts.length > 0) {
        setTimeout(() => {
            alerts.forEach(alert => alert.style.display = "none");
        }, 3000);
    }
});
