document.addEventListener("DOMContentLoaded", () => {
    initializeHomepage();
  });
  
  function initializeHomepage() {
    fetchFeaturedMovies();
    fetchLatestReviews();      
    setupCarouselControls();
  }
  
  async function fetchFeaturedMovies() {
    const carouselTrack = document.getElementById("carousel-track");
    if (!carouselTrack) return;
  
    try {
      const response = await fetch("/api/movies/random");
      if (!response.ok) throw new Error(`Status ${response.status}`);
      const movies = await response.json();
  
      carouselTrack.innerHTML = "";
      movies.forEach(movie => {
        const card = document.createElement("div");
        card.classList.add("movie-card", "text-center", "px-2");
        card.innerHTML = `
          <img src="/static/images/${movie.image_path}"
               alt="${movie.title}"
               class="img-fluid rounded shadow-sm"
               style="max-height:200px; object-fit:cover;"
               onerror="this.onerror=null;this.src='/static/images/keyboard.jpg';">
          <h5 class="mt-2 text-white">${movie.title}</h5>
        `;
        card.addEventListener("click", () => {
          window.location.href = `/movie/${movie.movie_id}`;
        });
        carouselTrack.appendChild(card);
      });
      updateCarouselButtons();
    } catch (err) {
      console.error("Failed to load featured movies:", err);
    }
  }
  
  async function fetchLatestReviews() {
    const container = document.getElementById("reviews-list");
    if (!container) return;
  
    try {
      const res = await fetch("/api/reviews/random");
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const reviews = await res.json();
  
      container.innerHTML = "";  
  
      reviews.forEach(r => {
        const stars =
          "★".repeat(r.rating) +
          "☆".repeat(5 - r.rating);
  
        const item = document.createElement("div");
        item.className = "review-item mb-3 text-white-75";
        item.innerHTML = `
          <p>
            <strong>${r.username}</strong>
            on <em>${r.movie_title}</em>
            <span class="text-warning">${stars}</span>
            <small class="text-secondary ms-2">${r.review_date}</small>
          </p>
          ${r.review_comment
            ? `<p class="fst-italic mb-0">“${r.review_comment}”</p>`
            : ""
          }
        `;
        container.appendChild(item);
      });
    } catch (err) {
      console.error("Failed to load reviews:", err);
      container.innerHTML = `
        <p class="text-muted text-center">Could not load reviews.</p>
      `;
    }
  }
  
  function setupCarouselControls() {
    const track   = document.querySelector(".carousel-track");
    const prevBtn = document.querySelector(".carousel-btn.prev");
    const nextBtn = document.querySelector(".carousel-btn.next");
    if (!track || !prevBtn || !nextBtn) return;
  
    prevBtn.addEventListener("click", () =>
      track.scrollBy({ left: -300, behavior: "smooth" })
    );
    nextBtn.addEventListener("click", () =>
      track.scrollBy({ left: 300,  behavior: "smooth" })
    );
    track.addEventListener("scroll", updateCarouselButtons);
  }
  
  function updateCarouselButtons() {
    const track   = document.querySelector(".carousel-track");
    const prevBtn = document.querySelector(".carousel-btn.prev");
    const nextBtn = document.querySelector(".carousel-btn.next");
    if (!track || !prevBtn || !nextBtn) return;
  
    const maxScroll = track.scrollWidth - track.clientWidth;
    prevBtn.disabled = track.scrollLeft <= 0;
    nextBtn.disabled = track.scrollLeft >= maxScroll;
  
    prevBtn.style.opacity = prevBtn.disabled ? "0.5" : "1";
    nextBtn.style.opacity = nextBtn.disabled ? "0.5" : "1";
  }
  