document.addEventListener("DOMContentLoaded", () => {
    initializePage();
});

// Initialize the Homepage
const initializePage = () => {
    fetchMovies();
    setupCarousel();
    setupDarkMode();
};

// Fetch Movies from /api/movies/random
const fetchMovies = async () => {
    try {
        const response = await fetch("/api/movies/random");
        if (!response.ok) throw new Error(`Server responded with ${response.status}`);

        const movies = await response.json();
        const carouselTrack = document.getElementById("carousel-track");

        if (!carouselTrack) {
            console.error("Carousel track element not found.");
            return;
        }

        carouselTrack.innerHTML = "";

        movies.forEach(movie => {
            const movieCard = document.createElement("div");
            movieCard.classList.add("movie-card", "text-center", "px-2");
            movieCard.innerHTML = `
                <img src="${movie.image_path ? `/static/images/${movie.image_path}` : "/static/images/keyboard.jpg"}"
                     alt="${movie.title}" 
                     class="img-fluid rounded shadow-sm"
                     style="max-height: 200px; object-fit: cover;"
                     onerror="this.onerror=null; this.src='/static/images/keyboard.jpg';">
                <h5 class="mt-2">${movie.title}</h5>
            `;
            movieCard.addEventListener("click", () => {
                window.location.href = `/movie/${movie.movie_id}`;
            });
            carouselTrack.appendChild(movieCard);
        });

        updateCarouselButtons();

    } catch (error) {
        console.error("Error fetching movies:", error);
    }
};

// Carousel Navigation Setup
const setupCarousel = () => {
    const prevBtn = document.querySelector(".prev");
    const nextBtn = document.querySelector(".next");
    const carouselTrack = document.querySelector(".carousel-track");

    if (!carouselTrack || !prevBtn || !nextBtn) return;

    prevBtn.addEventListener("click", () => scrollCarousel(-300));
    nextBtn.addEventListener("click", () => scrollCarousel(300));

    carouselTrack.addEventListener("scroll", updateCarouselButtons);
};

// Scroll carousel left/right
const scrollCarousel = (amount) => {
    const carouselTrack = document.querySelector(".carousel-track");
    carouselTrack.scrollBy({ left: amount, behavior: "smooth" });

    setTimeout(updateCarouselButtons, 300);
};

// Enable/disable carousel buttons based on scroll
const updateCarouselButtons = () => {
    const prevBtn = document.querySelector(".prev");
    const nextBtn = document.querySelector(".next");
    const carouselTrack = document.querySelector(".carousel-track");

    if (!carouselTrack || !prevBtn || !nextBtn) return;

    const maxScrollLeft = carouselTrack.scrollWidth - carouselTrack.clientWidth;

    prevBtn.style.opacity = carouselTrack.scrollLeft <= 0 ? "0.5" : "1";
    nextBtn.style.opacity = carouselTrack.scrollLeft >= maxScrollLeft ? "0.5" : "1";

    prevBtn.disabled = carouselTrack.scrollLeft <= 0;
    nextBtn.disabled = carouselTrack.scrollLeft >= maxScrollLeft;
};

// Dark Mode Toggle
const setupDarkMode = () => {
    const darkModeToggle = document.getElementById("darkModeToggle");
    if (!darkModeToggle) return;

    if (localStorage.getItem("darkMode") === "enabled") {
        document.body.classList.add("dark-mode");
    }

    darkModeToggle.addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");
        localStorage.setItem("darkMode", document.body.classList.contains("dark-mode") ? "enabled" : "disabled");
    });
};
