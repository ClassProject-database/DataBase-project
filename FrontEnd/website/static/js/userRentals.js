// Define a global moviesList to be used across functions (if not already defined)
if (!window.moviesList) {
    window.moviesList = [];
  }
  
  //////////////////////////////
  // Global Cart Functions (Optional)
  // Modify addToCart to prevent duplicates
  //////////////////////////////
  if (typeof window.addToCart !== "function") {
    window.addToCart = function (movie_id, name, price) {
      console.log("🛒 addToCart called with:", movie_id, name, price);
      try {
        // Prevent adding if any value is missing or if price is not a valid number
        if (!movie_id || !name || isNaN(price)) {
          console.error("❌ Invalid item data:", { movie_id, name, price });
          return;
        }
        let cart = JSON.parse(localStorage.getItem("cart")) || [];
        // Check if this movie is already in the cart
        if (cart.find(item => item.movie_id == movie_id)) {
          console.log(`Movie ID ${movie_id} is already in the cart.`);
          return;
        }
        cart.push({ movie_id, name, price: parseFloat(price) });
        localStorage.setItem("cart", JSON.stringify(cart));
        updateCartBadge();
        updateCartList();
        showModal(`${name} has been added to your cart!`);
      } catch (error) {
        console.error("❌ Error adding item to cart:", error);
      }
    };
  }
  
  //////////////////////////////
  // Initialization on DOMContentLoaded
  //////////////////////////////
  document.addEventListener("DOMContentLoaded", async function () {
    console.log("📌 Rentals page loaded. Initializing features...");
  
    // 1. Refresh Rentals & Set Up Delete Listener (if the rentals table exists)
    const rentalsTable = document.getElementById("rentalsTableBody");
    if (rentalsTable) {
      await refreshRentals();
      setupDeleteRentalListener();
    } else {
      console.warn("⚠️ rentalsTableBody not found in the DOM.");
    }
  
    // 2. Fetch Movies for Review Dropdown (if both movieList and reviewMovie elements exist)
    if (document.getElementById("movieList") && document.getElementById("reviewMovie")) {
      await fetchMovies();
      const movieSearchEl = document.getElementById("movieSearch");
      if (movieSearchEl) {
        movieSearchEl.addEventListener("input", handleCustomDropdown);
      }
    } else {
      console.warn("⚠️ movieList or reviewMovie element not found. Skipping fetchMovies().");
    }
  
    // 3. Set Up Review Form Submission (if the review form exists)
    if (document.getElementById("review-form")) {
      setupReviewForm();
    }
  });
  
  //////////////////////////////
  // 1. Rentals Functions
  //////////////////////////////
  
  // Refresh rentals from backend and update table
  async function refreshRentals() {
    try {
      console.log("📡 Fetching rentals...");
      // Make sure your backend endpoint '/api/rentals' returns a JSON array of rentals
      const response = await fetch("/api/rentals");
      if (!response.ok) {
        console.error("❌ API response not OK:", response.status, response.statusText);
        throw new Error(`Failed to fetch rentals. Status: ${response.status}`);
      }
      const rentals = await response.json();
      updateRentalsTable(rentals);
      console.log("✅ Rentals loaded successfully.");
    } catch (error) {
      console.error("Failed to load rentals:", error);
      alert("Error fetching rentals. Please try again.");
    }
  }
  
  // Update the rentals table in the DOM
  function updateRentalsTable(rentals) {
    const tableBody = document.getElementById("rentalsTableBody");
    tableBody.innerHTML = "";
    if (rentals.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="5" class="text-center">No rentals found.</td></tr>`;
      return;
    }
    rentals.forEach((rental) => {
      const row = document.createElement("tr");
      row.setAttribute("data-rental-id", rental.rental_id);
      row.innerHTML = `
        <td>${rental.title}</td>
        <td>${rental.rental_date}</td>
        <td>${rental.return_date ? rental.return_date : "Not returned"}</td>
        <td class="${rental.status === 'returned' ? 'text-success' : 'text-warning'}">${rental.status}</td>
        <td>
          <button class="btn btn-sm btn-danger delete-rental-btn" data-rental-id="${rental.rental_id}">
            Delete
          </button>
        </td>
      `;
      tableBody.appendChild(row);
    });
  }
  
  // Set up the delete rental listener (with prevention of duplicate listeners)
  function setupDeleteRentalListener() {
    const rentalsTable = document.getElementById("rentalsTableBody");
    if (!rentalsTable) {
      console.error("❌ rentalsTableBody element not found in the DOM.");
      return;
    }
    if (rentalsTable.dataset.deleteListener === "true") {
      console.warn("⚠️ Delete rental listener already set up. Skipping...");
      return;
    }
    rentalsTable.dataset.deleteListener = "true";
    rentalsTable.addEventListener("click", function (e) {
      if (e.target.classList.contains("delete-rental-btn")) {
        const rentalId = e.target.getAttribute("data-rental-id");
        console.log("🗑️ Delete button clicked for rental ID:", rentalId);
        if (!rentalId) {
          console.error("❌ Missing rental ID on delete button.");
          return;
        }
        // Disable button immediately to prevent duplicate clicks
        e.target.disabled = true;
        if (!confirm("Are you sure you want to delete this rental record?")) {
          e.target.disabled = false;
          console.log("User cancelled deletion.");
          return;
        }
        fetch("/api/delete_rental", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rental_id: rentalId }),
        })
          .then((response) => response.json())
          .then((data) => {
            console.log("📩 Delete response:", data);
            if (data.success) {
              const row = document.querySelector(`tr[data-rental-id="${rentalId}"]`);
              if (row) {
                row.remove();
                console.log(`✅ Rental ID ${rentalId} removed from the table.`);
              }
              alert("Rental record deleted successfully!");
            } else {
              alert("❌ Error: " + data.error);
              e.target.disabled = false;
            }
          })
          .catch((error) => {
            console.error("❌ Fetch Error while deleting rental:", error);
            alert("❌ An error occurred while deleting the rental.");
            e.target.disabled = false;
          });
      }
    });
  }
  
  //////////////////////////////
  // 2. Movies & Review Dropdown Functions
  //////////////////////////////
  
  // Fetch movies from API and populate datalist and hidden dropdown
  async function fetchMovies() {
    console.log("📡 Fetching movies...");
    const datalist = document.getElementById("movieList");
    const dropdown = document.getElementById("reviewMovie");
    if (!datalist || !dropdown) {
      console.warn("⚠️ movieList or reviewMovie not found in DOM. Skipping fetchMovies().");
      return;
    }
    try {
      const response = await fetch("/api/movies");
      moviesList = await response.json();
      datalist.innerHTML = "";
      dropdown.innerHTML = "";
      moviesList.forEach((movie) => {
        let option = document.createElement("option");
        option.value = movie.title;
        option.setAttribute("data-id", movie.movie_id);
        datalist.appendChild(option);
        let dropdownOption = document.createElement("option");
        dropdownOption.value = movie.movie_id;
        dropdownOption.textContent = movie.title;
        dropdown.appendChild(dropdownOption);
      });
      console.log("✅ Movies loaded successfully.");
    } catch (error) {
      console.error("❌ Error fetching movies:", error);
    }
  }
  
  // Custom dropdown handling for movie search
  function handleCustomDropdown() {
    let searchValue = this.value.trim().toLowerCase();
    let dropdown = document.getElementById("movieDropdown");
    let movieIdField = document.getElementById("selectedMovieId");
    dropdown.innerHTML = "";
    dropdown.style.display = "none";
    if (searchValue.length === 0) {
      movieIdField.value = "";
      return;
    }
    let filteredMovies = moviesList.filter((movie) =>
      movie.title.toLowerCase().includes(searchValue)
    );
    if (filteredMovies.length === 0) return;
    filteredMovies.forEach((movie) => {
      let option = document.createElement("div");
      option.classList.add("dropdown-item");
      option.textContent = movie.title;
      option.dataset.id = movie.movie_id;
      option.addEventListener("click", function () {
        document.getElementById("movieSearch").value = movie.title;
        movieIdField.value = movie.movie_id;
        dropdown.style.display = "none";
      });
      dropdown.appendChild(option);
    });
    dropdown.style.display = "block";
  }
  
  // Also attach built-in datalist logic for movie search
  const movieSearchInput = document.getElementById("movieSearch");
  if (movieSearchInput) {
    movieSearchInput.addEventListener("input", function () {
      let searchValue = this.value.toLowerCase();
      let dropdown = document.getElementById("movieDropdown");
      let movieIdField = document.getElementById("selectedMovieId");
      dropdown.innerHTML = "";
      dropdown.style.display = "none";
      if (searchValue.length === 0) {
        movieIdField.value = "";
        return;
      }
      let filteredMovies = moviesList.filter((movie) =>
        movie.title.toLowerCase().includes(searchValue)
      );
      if (filteredMovies.length === 0) return;
      filteredMovies.forEach((movie) => {
        let option = document.createElement("div");
        option.classList.add("dropdown-item");
        option.textContent = movie.title;
        option.dataset.id = movie.movie_id;
        option.addEventListener("click", function () {
          movieSearchInput.value = movie.title;
          movieIdField.value = movie.movie_id;
          dropdown.style.display = "none";
        });
        dropdown.appendChild(option);
      });
      dropdown.style.display = "block";
    });
  }
  
  //////////////////////////////
  // 4. Review Form Submission
  //////////////////////////////
  function setupReviewForm() {
    const reviewForm = document.getElementById("review-form");
    if (!reviewForm) return;
    reviewForm.addEventListener("submit", function (e) {
      e.preventDefault();
      let movieId = document.getElementById("selectedMovieId").value;
      let rating = document.getElementById("reviewRating").value;
      let review = document.getElementById("reviewComment").value;
      if (!movieId) {
        alert("Please select a movie from the list to submit a review.");
        return;
      }
      if (!rating || !review) {
        alert("All fields are required.");
        return;
      }
      fetch("/api/post_review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ movie_id: movieId, rating, review }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            alert("Review submitted successfully!");
            location.reload();
          } else {
            alert("Error: " + data.error);
          }
        })
        .catch((error) => console.error("Error:", error));
    });
  }
  
  //////////////////////////////
  // Additional: Display Movies (for Inventory/Filters)
  // (This part is separate and may be used on a different page, e.g. inventory.html)
  document.addEventListener("DOMContentLoaded", function () {
    function fetchMoviesForDisplay() {
      fetch("/api/movies")
        .then((response) => {
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          return response.json();
        })
        .then((movies) => {
          displayMovies(movies);
        })
        .catch((error) => {
          console.error("Failed to load movies:", error);
          customAlert("Failed to load movies. Please try again later.");
        });
    }
  
    function displayMovies(movies) {
      const moviesRow = document.querySelector(".row");
      if (!moviesRow) {
        console.error("Could not find .row element");
        return;
      }
      moviesRow.innerHTML = "";
      movies.forEach((movie) => {
        const col = document.createElement("div");
        col.classList.add("col");
        const card = document.createElement("div");
        card.classList.add("card", "h-100");
        const img = document.createElement("img");
        img.classList.add("card-img-top", "movie-img");
        img.src = movie.image ? `/static/images/${movie.image}` : "/static/images/keyboard.jpg";
        img.alt = movie.title || movie.name;
        const cardBody = document.createElement("div");
        cardBody.classList.add("card-body", "text-center");
        const title = document.createElement("h5");
        title.classList.add("fw-bolder", "card-title");
        title.textContent = movie.title || movie.name;
        const year = document.createElement("p");
        year.textContent = `Year: ${movie.year}`;
        const ratingEl = document.createElement("p");
        ratingEl.textContent = `Rating: ${movie.rating}`;
        const price = document.createElement("p");
        price.textContent = `Price: $${movie.price}`;
        cardBody.appendChild(title);
        cardBody.appendChild(year);
        cardBody.appendChild(ratingEl);
        cardBody.appendChild(price);
        const cardFooter = document.createElement("div");
        cardFooter.classList.add("card-footer", "text-center");
        const button = document.createElement("button");
        button.classList.add("btn", "btn-outline-dark");
        button.textContent = "Add to Cart";
        // Call addToCart with movie_id, title, and price
        button.onclick = function () {
          addToCart(movie.movie_id, movie.title || movie.name, movie.price);
        };
        cardFooter.appendChild(button);
        card.appendChild(img);
        card.appendChild(cardBody);
        card.appendChild(cardFooter);
        col.appendChild(card);
        moviesRow.appendChild(col);
      });
    }
  
    // Optionally, call fetchMoviesForDisplay() if this page should also display movies.
  });
  