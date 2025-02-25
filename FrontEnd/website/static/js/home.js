document.addEventListener("DOMContentLoaded", function () {
    fetchMovies();
    setupCarousel();
    setupDarkMode();
});

// ✅ Fetch Movies & Populate Carousel
async function fetchMovies() {
    try {
        const response = await fetch('/api/movies');
        const movies = await response.json();

        const carouselTrack = document.querySelector(".carousel-track");
        if (!carouselTrack) return; // ✅ Prevent error if carousel is missing

        carouselTrack.innerHTML = "";

        movies.slice(0, 10).forEach(movie => {
            let movieCard = document.createElement("div");
            movieCard.classList.add("movie-card");

            movieCard.innerHTML = `
                <img src="${movie.image ? "/static/images/" + movie.image : "/static/images/default.jpg"}" 
                     alt="${movie.title}" 
                     onerror="this.onerror=null; this.src='/static/images/default.jpg';">
                <p>${movie.title}</p>
            `;

            movieCard.addEventListener("click", function () {
                window.location.href = `/movie/${movie.movie_id}`;
            });

            carouselTrack.appendChild(movieCard);
        });
    } catch (error) {
        console.error("❌ Error fetching movies:", error);
    }
}

// ✅ Setup Carousel Navigation
function setupCarousel() {
    const prevBtn = document.querySelector('.prev');
    const nextBtn = document.querySelector('.next');
    const carouselTrack = document.querySelector('.carousel-track');

    if (!carouselTrack || !prevBtn || !nextBtn) return; // ✅ Prevent errors

    prevBtn.addEventListener("click", () => {
        carouselTrack.scrollBy({ left: -200, behavior: "smooth" });
    });

    nextBtn.addEventListener("click", () => {
        carouselTrack.scrollBy({ left: 200, behavior: "smooth" });
    });
}

// ✅ Dark Mode Toggle
function setupDarkMode() {
    const darkModeToggle = document.getElementById("darkModeToggle");
    if (!darkModeToggle) return;

    darkModeToggle.addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");
        localStorage.setItem("darkMode", document.body.classList.contains("dark-mode") ? "enabled" : "disabled");
    });

    // ✅ Persist Dark Mode Across Sessions
    if (localStorage.getItem("darkMode") === "enabled") {
        document.body.classList.add("dark-mode");
    }
}
