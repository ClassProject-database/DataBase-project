document.addEventListener("DOMContentLoaded", () => {
  initializeInventory();
});

function initializeInventory() {
  fetchMovies()
    .then(renderGrid)      
    .catch(console.error);

  setupGenreFilters();

  setupLiveSearch();
}


async function fetchMovies(params = {}) {
  const url = new URL("/api/movies", location.origin);
  if (params.genreId) url.searchParams.set("genre_id", params.genreId);
  if (params.q)       url.searchParams.set("q", params.q);
  if (params.limit)   url.searchParams.set("limit", params.limit);

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Server error: ${res.status}`);
  return res.json();
}


function renderGrid(movies) {
  const spinner = document.getElementById("loading-spinner");
  const grid    = document.getElementById("movies-container");
  if (spinner) spinner.style.display = "none";

  grid.style.display = "";

  grid.innerHTML = "";
  movies.forEach(m => {
    grid.insertAdjacentHTML("beforeend", `
      <div class="col movie-card" data-genre="${m.genre_ids || ""}">
        <div class="card bg-dark h-100 border-0">
          <a href="/movie/${m.movie_id}">
            <img src="/static/images/${m.image_path || "keyboard.jpg"}"
                 class="card-img-top" loading="lazy" alt="${m.title}">
          </a>
          <div class="card-body p-2 text-center">
            <h6 class="mb-0 fw-semibold text-white">${m.title}</h6>
            <small class="text-secondary">${m.release_year} · ${m.rating}</small><br>
            <span class="text-info">$${(+m.price).toFixed(2)}</span>
          </div>
          <div class="card-footer text-center border-0 bg-transparent">
            <button class="btn btn-outline-light add-to-cart-btn"
                    data-movie-id="${m.movie_id}">
              Add&nbsp;to&nbsp;Cart
            </button>
          </div>
        </div>
      </div>
    `);
  });
}


function setupGenreFilters() {
  const pills = document.querySelectorAll(".genre-btn");
  pills.forEach(btn => {
    btn.addEventListener("click", async () => {
      pills.forEach(b => b.classList.toggle("active", b === btn));
      const genreId = btn.dataset.genre || undefined;
      try {
        const movies = await fetchMovies({ genreId });
        renderGrid(movies);
      } catch (err) {
        console.error(err);
      }
    });
  });
}


function setupLiveSearch() {
  const searchIn  = document.getElementById("inventory-search");
  const searchBtn = document.getElementById("search-btn");
  const grid      = document.getElementById("movies-container");

  const debounce = (fn, ms = 150) => {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  };

  searchIn.addEventListener("input", debounce(() => {
    const q = searchIn.value.trim().toLowerCase();
    grid.querySelectorAll(".movie-card").forEach(card => {
      const title = card.querySelector("h6").textContent.toLowerCase();
      card.style.display = q === "" || title.includes(q) ? "" : "none";
    });
  }));

  searchBtn.addEventListener("click", () => {
    if (!searchIn.value.trim()) {
      grid.querySelectorAll(".movie-card")
          .forEach(c => c.style.display = "");
    }
  });
}
