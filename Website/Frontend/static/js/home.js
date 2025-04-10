document.addEventListener("DOMContentLoaded", () => {
    initializeHomepage();
});

// Entry point for homepage setup
function initializeHomepage() {
    fetchFeaturedMovies();
    setupCarouselControls();
}

// Fetch random movies from backend 
async function fetchFeaturedMovies() {
    const carouselTrack = document.getElementById("carousel-track");
    if (!carouselTrack) return;

    const response = await fetch("/api/movies/random");
    const movies = await response.json();

    carouselTrack.innerHTML = "";

    movies.forEach(movie => {
        const card = document.createElement("div");
        card.classList.add("movie-card", "text-center", "px-2");
        card.innerHTML = `
            <img src="${movie.image_path ? `/static/images/${movie.image_path}` : "/static/images/keyboard.jpg"}"
                 alt="${movie.title}"
                 class="img-fluid rounded shadow-sm"
                 style="max-height: 200px; object-fit: cover;"
                 onerror="this.onerror=null; this.src='/static/images/keyboard.jpg';">
            <h5 class="mt-2">${movie.title}</h5>
        `;
        card.onclick = () => window.location.href = `/inventory2`;
        carouselTrack.appendChild(card);
    });

    updateCarouselButtons();
}

function setupCarouselControls() {
    const track = document.querySelector(".carousel-track");
    const prevBtn = document.querySelector(".carousel-btn.prev");
    const nextBtn = document.querySelector(".carousel-btn.next");

    if (!track || !prevBtn || !nextBtn) return;

    prevBtn.addEventListener("click", () => track.scrollBy({ left: -300, behavior: "smooth" }));
    nextBtn.addEventListener("click", () => track.scrollBy({ left: 300, behavior: "smooth" }));

    track.addEventListener("scroll", updateCarouselButtons);
}

function updateCarouselButtons() {
    const track = document.querySelector(".carousel-track");
    const prevBtn = document.querySelector(".carousel-btn.prev");
    const nextBtn = document.querySelector(".carousel-btn.next");

    const maxScrollLeft = track.scrollWidth - track.clientWidth;
    const scrollLeft = track.scrollLeft;

    prevBtn.disabled = scrollLeft <= 0;
    nextBtn.disabled = scrollLeft >= maxScrollLeft;

    prevBtn.style.opacity = prevBtn.disabled ? "0.5" : "1";
    nextBtn.style.opacity = nextBtn.disabled ? "0.5" : "1";
}
