document.addEventListener("DOMContentLoaded", () => {
    console.log("Combined movie script loaded!");
  
    async function fetchMovies(genreId = null) {
      let url = "/api/movies";
      if (genreId !== null && !isNaN(genreId)) {
        url += `?genre_id=${genreId}`;
      }
  
      try {
        console.log(`Fetching movies (Genre ID: ${genreId ?? "All"})...`);
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }
  
        const movies = await response.json();
        displayMovies(movies);
      } catch (error) {
        console.error("Error fetching movies:", error);
        alert("Failed to load movies. Please try again later.");
      }
    }
  
    function displayMovies(movies) {
      const moviesContainer = document.getElementById("movies-container");
      if (!moviesContainer) {
        console.error("No element with ID 'movies-container' found.");
        return;
      }
  
      // Clear existing content
      moviesContainer.innerHTML = "";
  
      movies.forEach((movie) => {
        // Column wrapper
        const col = document.createElement("div");
        col.classList.add("col", "movie-card");

        if (movie.genre_id) {
          col.dataset.genre = movie.genre_id;
        }
  
        // Create the card
        const card = document.createElement("div");
        card.classList.add("card", "h-100", "bg-dark", "text-white");
  
        // Create the poster imag
        const img = document.createElement("img");
        img.classList.add("card-img-top", "movie-img");
        img.src = movie.image_path
          ? `/static/images/${movie.image_path}`
          : "/static/images/keyboard.jpg";
        img.alt = movie.title || "Movie poster";
  
        img.onerror = () => {
          img.onerror = null;
          img.src = "/static/images/keyboard.jpg";
        };
  
        const imgLink = document.createElement("a");
        imgLink.href = `/movie/${movie.movie_id}`;
        imgLink.appendChild(img);
  
        const cardBody = document.createElement("div");
        cardBody.classList.add("card-body", "text-center");
        cardBody.innerHTML = `
          <h5 class="fw-bolder">${movie.title ?? "Untitled"}</h5>
          <p>Year: ${movie.release_year ?? "N/A"}</p>
          <p>Rating: ${movie.rating ?? "Unrated"}</p>
          <p>Price: $${parseFloat(movie.price ?? 0).toFixed(2)}</p>
        `;
  
        // Card footer with "Add to Cart" button
        const cardFooter = document.createElement("div");
        cardFooter.classList.add("card-footer", "text-center");
  
        const addButton = document.createElement("button");
        addButton.classList.add("btn", "btn-outline-dark");
        addButton.textContent = "Add to Cart";
        addButton.onclick = () => {
          console.log(`Adding: ${movie.title}`);

          if (typeof addToCart === "function") {
            addToCart(movie.movie_id, movie.title, movie.price);
          } else {
            console.warn("addToCart function is not defined.");
          }
        };
  
        cardFooter.appendChild(addButton);
  
        card.append(imgLink, cardBody, cardFooter);
        col.appendChild(card);
        moviesContainer.appendChild(col);
      });
    }
  
    document.querySelectorAll(".filter-btn").forEach((button) => {
      button.addEventListener("click", () => {
        let genr
        document.addEventListener("DOMContentLoaded", () => {
          console.log("Movie-grid script loaded");
        
          let activeGenreId = null;      
          let debounceTimer = null;     
        
    
          const $   = (sel) => document.querySelector(sel);
          const $$  = (sel) => [...document.querySelectorAll(sel)];
          const qs  = (obj) => Object.keys(obj)
                                      .filter(k => obj[k] !== null && obj[k] !== "")
                                      .map(k => `${k}=${encodeURIComponent(obj[k])}`)
                                      .join("&");
    
          async function fetchMovies({ genreId = null, query = "" } = {}) {
            const url = "/api/movies" + (qs({ genre_id: genreId, q: query }) ? "?" + qs({ genre_id: genreId, q: query }) : "");
            console.log("GET", url);
        
            try {
              const res = await fetch(url);
              if (!res.ok) throw new Error(`Server ${res.status}`);
              const movies = await res.json();
              render(movies);
            } catch (err) {
              console.error("Movie fetch failed:", err);
              $("#movies-container").innerHTML =
                `<div class="text-center text-danger w-100 py-5">Could not load movies.</div>`;
            }
          }
        
          function render(list) {
            const box = $("#movies-container");
            if (!box) return console.error(" #movies-container missing from DOM");
        
            box.innerHTML = list.length
              ? list.map(toCard).join("")
              : `<div class="text-center text-white-50 w-100 py-5">No movies found.</div>`;
          }
        
       
          function toCard(m) {
            const img = m.image_path ? `/static/images/${m.image_path}` : "/static/images/keyboard.jpg";
            const price = Number(m.price).toFixed(2);
        
            return `
            <div class="col movie-card" data-genre="${m.genre_id || ""}">
              <div class="card h-100 bg-dark text-white shadow">
                <a href="/movie/${m.movie_id}">
                  <img class="card-img-top movie-img" src="${img}" alt="${m.title}">
                </a>
                <div class="card-body text-center">
                  <h5 class="fw-bolder">${m.title}</h5>
                  <p>${m.release_year} &nbsp;•&nbsp; ${m.rating}</p>
                  <p>$${price}</p>
                </div>
                <div class="card-footer text-center">
                  <button class="btn btn-outline-light add-to-cart-btn"
                          onclick="addToCart?.(${m.movie_id}, '${m.title.replace(/'/g, "\\'")}', ${price})">
                    Add&nbsp;to&nbsp;Cart
                  </button>
                </div>
              </div>
            </div>`;
          }
        
          
          $$(".filter-btn").forEach(btn => {
            btn.addEventListener("click", () => {
              activeGenreId = btn.dataset.genreId === "" ? null : Number(btn.dataset.genreId);
              $$(".filter-btn").forEach(b => b.classList.toggle("active", b === btn));
              fetchMovies({ genreId: activeGenreId, query: $("#inventory-search")?.value.trim() });
            });
          });
        
     
          const searchBox = $("#inventory-search");   
          if (searchBox) {
            searchBox.addEventListener("input", () => {
              clearTimeout(debounceTimer);
              debounceTimer = setTimeout(() => {
                fetchMovies({ genreId: activeGenreId, query: searchBox.value.trim() });
              }, 300);
            });
          }
        
        
          fetchMovies();         
        });
        eId = button.dataset.genreId;
        genreId = genreId === "null" ? null : parseInt(genreId);
        console.log(`Filtering movies by Genre ID: ${genreId ?? "All"}`);
        fetchMovies(genreId);
      });
    });
  
    fetchMovies();
  });
  