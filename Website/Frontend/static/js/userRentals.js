
const toast = (msg, type = "success") => {
    const el = document.createElement("div");
    el.className =
      `toast text-white bg-${type === "error" ? "danger" : "success"} p-2 rounded position-fixed bottom-0 end-0 m-3 shadow`;
    el.style.zIndex = 9999;
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  };
  
  const safeJson = async (res) => JSON.parse(await res.text());
  
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
      catch { return {}; }
    };
  
    const rentalsTable = document.getElementById("rentalsTableBody");
    if (!rentalsTable) return;
  
    rentalsTable.addEventListener("click", async e => {
      const btn = e.target.closest(".return-rental-btn");
      if (!btn) return;
      const movieId = btn.dataset.movieId;
      const rentalId = btn.dataset.rentalId;
      if (!rentalId) return;
  
      try {
        const res = await fetch(
            `/api/return_movie/${rentalId}/${movieId}`,
            { method: "POST" }
          );
        const data = await safeJson(res);
  
        if (!data.success) {
          toast(data.message || "Could not return movie.", "error");
          return;
        }
  
      
        const row = btn.closest("tr");
        row.querySelector("td:nth-child(3)").textContent =
          new Date().toISOString().slice(0, 10);
        btn.replaceWith(
          Object.assign(document.createElement("span"), {
            className: "text-success",
            innerHTML: '<i class="fa fa-check"></i>'
          })
        );
  
        toast("Movie returned");
      } catch (err) {
        console.error(err);
        toast("Failed to communicate with server.", "error");
      }
    });
  });
  
  // POST REVIEW LOGIC
  const reviewForm = document.getElementById("review-form");
  if (reviewForm) {
    reviewForm.addEventListener("submit", async function (e) {
      e.preventDefault();
  
      const movieId = document.getElementById("selectedMovieId").value;
      const rating = document.getElementById("reviewRating").value;
      const reviewText = document.getElementById("reviewComment").value.trim();
      const reviewList = document.getElementById("review-list");
  
      if (!movieId || !rating || !reviewText) {
        toast("All fields are required!", "error");
        return;
      }
  
      try {
        const response = await fetch("/api/post_review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ movie_id: movieId, rating, review_comment: reviewText })
        });
  
        const data = await safeJson(response);
        if (data.success) {
          toast("Review submitted successfully!");
          document.getElementById("reviewRating").value = "";
          document.getElementById("reviewComment").value = "";
          document.getElementById("movieSearch").value = "";
          document.getElementById("selectedMovieId").value = "";
  
          if (reviewList) {
            const newReview = document.createElement("li");
            newReview.classList.add("list-group-item", "bg-dark", "text-white");
            newReview.innerHTML = `
              <strong>${data.movie_title || "Unknown Movie"}</strong> (⭐${rating}/5)
              <br>${reviewText}
              <br><small>Just now</small>
            `;
            reviewList.prepend(newReview);
          }
        } else {
          toast("Error: " + data.error, "error");
        }
      } catch (error) {
        toast("Error submitting review.", "error");
      }
    });
  }
  
  // MOVIE SEARCH
  const movieSearchInput = document.getElementById("movieSearch");
  if (movieSearchInput) {
    let debounceTimer;
    movieSearchInput.addEventListener("input", () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(handleMovieSearch, 300);
    });
  }
  
  async function handleMovieSearch() {
    const input = document.getElementById("movieSearch");
    const query = input?.value.trim().toLowerCase();
    const dropdown = document.getElementById("movieDropdown");
    const movieIdField = document.getElementById("selectedMovieId");
  
    dropdown.innerHTML = "";
    dropdown.style.display = "none";
  
    if (!query) {
      movieIdField.value = "";
      return;
    }
  
    try {
      const res = await fetch(`/api/search_rented_movies?query=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Failed to fetch");
  
      const movies = await res.json();
      if (!movies.length) return;
  
      movies.forEach(movie => {
        const option = document.createElement("div");
        option.classList.add("dropdown-item");
        option.textContent = movie.title;
        option.dataset.id = movie.movie_id;
        option.addEventListener("click", () => {
          input.value = movie.title;
          movieIdField.value = movie.movie_id;
          dropdown.style.display = "none";
        });
        dropdown.appendChild(option);
      });
  
      dropdown.style.display = "block";
    } catch (err) {
      console.error("Movie search failed:", err);
    }
  }
  