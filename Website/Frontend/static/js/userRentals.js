document.addEventListener("DOMContentLoaded", () => {
    const toast = (msg, type = "success") => {
      const el = document.createElement("div");
      el.className = `toast text-white bg-${type === "error" ? "danger" : "success"} p-2 rounded position-fixed bottom-0 end-0 m-3 shadow`;
      el.style.zIndex = 9999;
      el.textContent = msg;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 3000);
    };
  
    const safeJson = async res => {
      try { return await res.json(); }
      catch (err) {
        console.error("safeJson failed:", err);
        return {};
      }
    };
  

    // Return rental logic

    const rentalsTable = document.getElementById("rentalsTableBody");
    if (rentalsTable) {
      rentalsTable.addEventListener("click", async e => {
        const btn = e.target.closest(".return-rental-btn");
        if (!btn) return;
  
        const rentalId = btn.dataset.rentalId;
        const movieId = btn.dataset.movieId;
        console.log("Return button clicked:", { rentalId, movieId });
  
        if (!rentalId || !movieId) {
          console.error("Missing data-rental-id or data-movie-id on button", btn);
          return;
        }
  
        try {
          const url = `/api/return_movie/${rentalId}/${movieId}`;
          const res = await fetch(url, { method: "POST" });
          if (!res.ok) {
            const text = await res.text();
            toast(`Error ${res.status}: ${text}`, "error");
            return;
          }
  
          const data = await safeJson(res);
          if (!data.success) {
            toast(data.message || "Could not return movie.", "error");
            return;
          }
  
          const row = btn.closest("tr");
          row.querySelector("td:nth-child(3)").textContent = new Date().toISOString().slice(0, 10);
          const check = document.createElement("span");
          check.className = "text-success";
          check.innerHTML = '<i class="fa fa-check"></i>';
          btn.replaceWith(check);
          toast("Movie returned!");
        } catch (err) {
          console.error("Request failed:", err);
          toast("Failed to communicate with server.", "error");
        }
      });
    }
  
    const movieSearchInput = document.getElementById("movieSearch");
    const dropdown = document.getElementById("movieDropdown");
    const movieIdField = document.getElementById("selectedMovieId");
  
    if (movieSearchInput && dropdown && movieIdField) {
      let debounceTimer;
  
      movieSearchInput.addEventListener("input", () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(handleMovieSearch, 300);
      });
  
      async function handleMovieSearch() {
        const query = movieSearchInput.value.trim().toLowerCase();
        dropdown.innerHTML = "";
        dropdown.style.display = "none";
  
        if (!query) {
          movieIdField.value = "";
          return;
        }
  
        try {
          const res = await fetch(`/api/search_rented_movies?query=${encodeURIComponent(query)}`);
          if (!res.ok) throw new Error("Failed to fetch movies");
          const movies = await res.json();
  
          if (!movies.length) return;
  
          movies.forEach(movie => {
            const item = document.createElement("div");
            item.classList.add("dropdown-item");
            item.textContent = movie.title;
            item.dataset.id = movie.movie_id;
  
            item.addEventListener("click", () => {
              movieSearchInput.value = movie.title;
              movieIdField.value = movie.movie_id;
              dropdown.style.display = "none";
            });
  
            dropdown.appendChild(item);
          });
  
          dropdown.style.display = "block";
        } catch (err) {
          console.error("Movie search failed:", err);
          toast("Error searching movies", "error");
        }
      }
    }
  });
  