// Toast Notification 
window.showToast = function (message, type = "success") {
    const toast = document.createElement("div");
    toast.classList.add("toast-message", type);
    toast.textContent = message;
    
    toast.setAttribute("role", "alert");
    toast.setAttribute("aria-live", "assertive");

    document.body.appendChild(toast);

    const fadeInDelay = 100;
    const displayDuration = 3000;
    const fadeOutDuration = 300;

    setTimeout(() => toast.classList.add("show"), fadeInDelay);
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), fadeOutDuration);
    }, displayDuration);
};
