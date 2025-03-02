document.addEventListener("DOMContentLoaded", () => {
    initializePage();
});

//  Initialize Page 
const initializePage = () => {
    fetchMovies();
    setupCarousel();
    setupDarkMode();
};

//  Fetch Movies for Carousel 
const fetchMovies = async () => {
    try {
        const response = await fetch("/api/movies");
        if (!response.ok) throw new Error(`Server responded with ${response.status}`);

        const movies = await response.json();
        const carouselTrack = document.querySelector(".carousel-track");

        if (!carouselTrack) {
            console.error("Carousel track element not found.");
            return;
        }

        carouselTrack.innerHTML = "";

        // Display movies
        movies.slice(0, 10).forEach(movie => {
            const movieCard = document.createElement("div");
            movieCard.classList.add("movie-card");
            movieCard.innerHTML = `
                <img src="${movie.image ? `/static/images/${movie.image}` : "/static/images/default.jpg"}" 
                     alt="${movie.title}" 
                     onerror="this.onerror=null; this.src='/static/images/default.jpg';">
                <p>${movie.title}</p>
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

//   Carousel Navigation 
const setupCarousel = () => {
    const prevBtn = document.querySelector(".prev");
    const nextBtn = document.querySelector(".next");
    const carouselTrack = document.querySelector(".carousel-track");

    if (!carouselTrack || !prevBtn || !nextBtn) return;

    prevBtn.addEventListener("click", () => scrollCarousel(-300));
    nextBtn.addEventListener("click", () => scrollCarousel(300));

    carouselTrack.addEventListener("scroll", updateCarouselButtons);
};

//  Scroll Carousel & Update Button  
const scrollCarousel = (amount) => {
    const carouselTrack = document.querySelector(".carousel-track");
    carouselTrack.scrollBy({ left: amount, behavior: "smooth" });

    setTimeout(updateCarouselButtons, 300);
};

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

const setupDarkMode = () => {
    const darkModeToggle = document.getElementById("darkModeToggle");
    if (!darkModeToggle) return;

    // Apply saved theme preference
    if (localStorage.getItem("darkMode") === "enabled") {
        document.body.classList.add("dark-mode");
    }

    darkModeToggle.addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");
        localStorage.setItem("darkMode", document.body.classList.contains("dark-mode") ? "enabled" : "disabled");
    });
};
