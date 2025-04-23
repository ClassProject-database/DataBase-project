
document.addEventListener("DOMContentLoaded", () => {

  const grid      = document.getElementById("movies-container");
  const pills     = [...document.querySelectorAll(".genre-btn")];
  const searchIn  = document.getElementById("inventory-search");
  const searchBtn = document.getElementById("search-btn");
  const dd        = document.getElementById("inv-search-dd");

  const html = (strings, ...vals) =>
    strings.reduce((out, str, i) => out + str + (vals[i] ?? ""), "");

  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

  const debounce = (fn, ms = 250) => {
    let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  };

  async function fetchMovies(params = {}) {
    const url = new URL("/api/movies", location.origin);

    if (params.genreId) url.searchParams.set("genre_id", params.genreId);
    if (params.que)       url.searchParams.set("que", params.que);
    if (params.limit)   url.searchParams.set("limit", params.limit);

    const res = await fetch(url);
    if (!res.ok) throw Error(`Server ${res.status}`);
    return res.json();
  }

  function renderGrid(movies) {
    const spinner = document.getElementById("loading-spinner");
    const grid = document.getElementById("movies-container");
  
    // Hide loading spinner
    if (spinner) spinner.style.display = "none";

    grid.style.display = "flex";
  
    grid.innerHTML = "";
  
    // Render movie cards
    movies.forEach(m => {
      grid.insertAdjacentHTML("beforeend", html`
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
                      data-movie-id="${m.movie_id}"
                      data-title="${m.title.replace(/"/g,"&quot;")}"
                      data-price="${m.price}">
                Add&nbsp;to&nbsp;Cart
              </button>
            </div>
          </div>
        </div>`);
    });
  }
  
 
  pills.forEach(btn => btn.addEventListener("click", async () => {
    pills.forEach(b => b.classList.toggle("active", b === btn));
    const id = btn.dataset.genre || "";   
    try { renderGrid(await fetchMovies({ genreId: id || undefined })); }
    catch (e) { console.error(e); }
  }));

  // search box
  async function suggest() {
    const que = searchIn.value.trim();
    dd.innerHTML = "";
    dd.style.display = "none";
    if (!que) return;

    try {
      const movies = await fetchMovies({ q: que, limit: 8 });
      if (!movies.length) return;

      movies.forEach(m => {
        const row = document.createElement("div");
        row.className = "dropdown-item";
        row.textContent = m.title;
        row.addEventListener("click", () => location.href = `/movie/${m.movie_id}`);
        dd.appendChild(row);
      });
      dd.style.display = "block";
    } catch (e) { console.error(e); }
  }
  searchIn.addEventListener("input", debounce(suggest, 200));
  searchBtn.addEventListener("click", () => suggest());

  searchIn.addEventListener("keydown", e => {
    if (e.key === "Enter") {              
      const first = $(".dropdown-item", dd);
      if (first) first.click();
    }
  });

 
  fetchMovies().then(renderGrid).catch(console.error);
});
