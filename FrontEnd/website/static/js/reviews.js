document.addEventListener("DOMContentLoaded", function () {
    console.log("Reviews page loaded successfully!");

    // Add animations (Optional)
    document.querySelectorAll(".review-item").forEach(item => {
        item.addEventListener("mouseenter", function () {
            this.style.boxShadow = "0px 4px 10px rgba(0, 0, 0, 0.2)";
        });
        item.addEventListener("mouseleave", function () {
            this.style.boxShadow = "none";
        });
    });
});
