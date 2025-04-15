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
        let genreId = button.dataset.genreId;
        genreId = genreId === "null" ? null : parseInt(genreId);
        console.log(`Filtering movies by Genre ID: ${genreId ?? "All"}`);
        fetchMovies(genreId);
      });
    });
  
    // Load all movies on page load 
    fetchMovies();
  });
  