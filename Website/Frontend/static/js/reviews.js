document.addEventListener("DOMContentLoaded", () => {
    console.log("✅ Reviews page loaded - comments disabled");

    // If needed in the future: Toast Notification Helper
    function showToast(message, type = "success") {
        const toast = document.createElement("div");
        toast.classList.add("toast", type);
        toast.textContent = message;
        toast.setAttribute("role", "alert");
        toast.setAttribute("aria-live", "assertive");
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add("show"), 100);
        setTimeout(() => {
            toast.classList.remove("show");
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
});
