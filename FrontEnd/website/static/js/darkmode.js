document.addEventListener("DOMContentLoaded", function () {
    // Check if Dark Mode is enabled and apply it
    if (localStorage.getItem("darkMode") === "true") {
        document.body.classList.add("dark-mode");
    }

    // Find the button and attach the event listener
    const darkModeButton = document.getElementById("darkModeToggle");
    if (darkModeButton) {
        darkModeButton.addEventListener("click", toggleDarkMode);
    } else {
        console.error("Dark mode button not found!");
    }
});

function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");

    // Store user preference in localStorage
    const isDarkMode = document.body.classList.contains("dark-mode");
    localStorage.setItem("darkMode", isDarkMode);
}
