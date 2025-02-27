// ✅ Global Toast Notification Function
window.showToast = function (message, type = "success") {
    const toast = document.createElement("div");
    toast.classList.add("toast-message", type);
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add("show"), 100);
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};
