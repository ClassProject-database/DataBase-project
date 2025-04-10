// document.addEventListener("DOMContentLoaded", function () {
//     const darkModeToggle = document.getElementById("darkModeToggle");
//     const darkModeIcon = darkModeToggle?.querySelector("i");

//     if (localStorage.getItem("darkMode") === "enabled") {
//         document.documentElement.classList.add("dark-mode");
//         darkModeIcon?.classList.replace("fa-moon", "fa-sun");
//         darkModeToggle?.classList.replace("btn-outline-dark", "btn-outline-light");
//     }

//     // Toggle dark mode on button click
//     darkModeToggle?.addEventListener("click", () => {
//         document.documentElement.classList.toggle("dark-mode");

//         if (document.documentElement.classList.contains("dark-mode")) {
//             localStorage.setItem("darkMode", "enabled");
//             darkModeIcon?.classList.replace("fa-moon", "fa-sun");
//             darkModeToggle?.classList.replace("btn-outline-dark", "btn-outline-light");
//         } else {
//             localStorage.setItem("darkMode", "disabled");
//             darkModeIcon?.classList.replace("fa-sun", "fa-moon");
//             darkModeToggle?.classList.replace("btn-outline-light", "btn-outline-dark");
//         }
//     });
// });
