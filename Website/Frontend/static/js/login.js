document.addEventListener("DOMContentLoaded", () => {
    console.log("Login page loaded!");

    const alerts = document.querySelectorAll(".alert");
    if (alerts.length > 0) {
        setTimeout(() => {
            alerts.forEach(alert => {
                alert.classList.add("fade-out");
                alert.addEventListener("transitionend", () => {
                    alert.remove();
                });
            });
        }, 3000);
    }
});
