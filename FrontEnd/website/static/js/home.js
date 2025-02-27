document.addEventListener("DOMContentLoaded", () => {
    fetchMovies();
    setupCarousel();
    setupDarkMode();
});

// -------------------------------------
// Fetch Movies & Populate Carousel
// -------------------------------------
const fetchMovies = async () => {
    try {
        const response = await fetch('/api/movies');
        if (!response.ok) {
            throw new Error(`Server responded with ${response.status}`);
        }
        const movies = await response.json();
        const carouselTrack = document.querySelector(".carousel-track");
        if (!carouselTrack) return; // Prevent error if carousel element is missing

        // Clear any existing content
        carouselTrack.innerHTML = "";

        // Display only the first 10 movies
        movies.slice(0, 10).forEach(movie => {
            const movieCard = document.createElement("div");
            movieCard.classList.add("movie-card");
            movieCard.innerHTML = `
                <img src="${movie.image ? `/static/images/${movie.image}` : "/static/images/default.jpg"}" 
                     alt="${movie.title}" 
                     onerror="this.onerror=null; this.src='/static/images/default.jpg';">
                <p>${movie.title}</p>
            `;
            // Navigate to the movie detail page on click
            movieCard.addEventListener("click", () => {
                window.location.href = `/movie/${movie.movie_id}`;
            });
            carouselTrack.appendChild(movieCard);
        });
    } catch (error) {
        console.error("❌ Error fetching movies:", error);
    }
};

// -------------------------------------
// Setup Carousel Navigation
// -------------------------------------
const setupCarousel = () => {
    const prevBtn = document.querySelector('.prev');
    const nextBtn = document.querySelector('.next');
    const carouselTrack = document.querySelector('.carousel-track');

    if (!carouselTrack || !prevBtn || !nextBtn) return;

    prevBtn.addEventListener("click", () => {
        carouselTrack.scrollBy({ left: -200, behavior: "smooth" });
    });
    nextBtn.addEventListener("click", () => {
        carouselTrack.scrollBy({ left: 200, behavior: "smooth" });
    });
};

// -------------------------------------
// Setup Dark Mode Toggle
// -------------------------------------
const setupDarkMode = () => {
    const darkModeToggle = document.getElementById("darkModeToggle");
    if (!darkModeToggle) return;

    darkModeToggle.addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");
        // Store user preference as "enabled" or "disabled"
        localStorage.setItem("darkMode", document.body.classList.contains("dark-mode") ? "enabled" : "disabled");
    });

    // Persist dark mode across sessions
    if (localStorage.getItem("darkMode") === "enabled") {
        document.body.classList.add("dark-mode");
    }
};
