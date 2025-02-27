// Ensure global moviesList exists
if (!window.moviesList) {
    window.moviesList = [];
  }
  
  // ------------------------------
  // Global Cart Functions
  // ------------------------------
  if (typeof window.addToCart !== "function") {
    window.addToCart = function (movie_id, name, price) {
      console.log("🛒 addToCart called with:", movie_id, name, price);
      try {
        if (!movie_id || !name || isNaN(price)) {
          console.error("❌ Invalid item data:", { movie_id, name, price });
          return;
        }
        let cart = JSON.parse(localStorage.getItem("cart")) || [];
        // Prevent duplicates:
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
  
  // ------------------------------
  // Rentals Functions
  // ------------------------------
  async function refreshRentals() {
    try {
      console.log("📡 Fetching rentals...");
      const response = await fetch("/api/rentals");
      if (!response.ok) {
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
  
  function updateRentalsTable(rentals) {
    const tableBody = document.getElementById("rentalsTableBody");
    if (!tableBody) return;
    tableBody.innerHTML = "";
    if (rentals.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="5" class="text-center">No rentals found.</td></tr>`;
      return;
    }
    rentals.forEach(rental => {
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
          .then(response => response.json())
          .then(data => {
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
          .catch(error => {
            console.error("❌ Fetch Error while deleting rental:", error);
            alert("❌ An error occurred while deleting the rental.");
            e.target.disabled = false;
          });
      }
    });
  }
  
  // ------------------------------
  // Movies & Review Dropdown Functions
  // ------------------------------
  async function fetchMoviesForDropdown() {
    console.log("📡 Fetching movies for dropdown...");
    const datalist = document.getElementById("movieList");
    const dropdown = document.getElementById("reviewMovie");
    if (!datalist || !dropdown) {
      console.warn("⚠️ movieList or reviewMovie not found in DOM. Skipping fetchMoviesForDropdown().");
      return;
    }
    try {
      const response = await fetch("/api/movies");
      if (!response.ok) throw new Error(`Status: ${response.status}`);
      window.moviesList = await response.json();
      datalist.innerHTML = "";
      dropdown.innerHTML = "";
      window.moviesList.forEach(movie => {
        // Populate datalist (for built-in browser support)
        let option = document.createElement("option");
        option.value = movie.title;
        option.setAttribute("data-id", movie.movie_id);
        datalist.appendChild(option);
        // Populate custom dropdown for reviews
        let dropdownOption = document.createElement("option");
        dropdownOption.value = movie.movie_id;
        dropdownOption.textContent = movie.title;
        dropdown.appendChild(dropdownOption);
      });
      console.log("✅ Movies loaded for dropdown successfully.");
    } catch (error) {
      console.error("❌ Error fetching movies for dropdown:", error);
    }
  }
  
  function handleCustomDropdown() {
    const searchValue = this.value.trim().toLowerCase();
    const dropdown = document.getElementById("movieDropdown");
    const movieIdField = document.getElementById("selectedMovieId");
    dropdown.innerHTML = "";
    dropdown.style.display = "none";
    if (searchValue.length === 0) {
      movieIdField.value = "";
      return;
    }
    const filteredMovies = window.moviesList.filter(movie =>
      movie.title.toLowerCase().includes(searchValue)
    );
    if (filteredMovies.length === 0) return;
    filteredMovies.forEach(movie => {
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
  
  const movieSearchInput = document.getElementById("movieSearch");
  if (movieSearchInput) {
    movieSearchInput.addEventListener("input", handleCustomDropdown);
  }
  
  // ------------------------------
  // Review Form Submission
  // ------------------------------
  function setupReviewForm() {
    const reviewForm = document.getElementById("review-form");
    if (!reviewForm) return;
    reviewForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const movieId = document.getElementById("selectedMovieId").value;
      const rating = document.getElementById("reviewRating").value;
      const review = document.getElementById("reviewComment").value;
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
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            alert("Review submitted successfully!");
            location.reload();
          } else {
            alert("Error: " + data.error);
          }
        })
        .catch(error => console.error("Error submitting review:", error));
    });
  }
  
  // ------------------------------
  // Additional: Display Movies for Inventory/Filters
  // (Optional: If this page should display movies in a grid)
  // ------------------------------
  document.addEventListener("DOMContentLoaded", function () {
    function fetchMoviesForDisplay() {
      fetch("/api/movies")
        .then(response => {
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          return response.json();
        })
        .then(movies => {
          displayMovies(movies);
        })
        .catch(error => {
          console.error("Failed to load movies:", error);
          customAlert && customAlert("Failed to load movies. Please try again later.");
        });
    }
    
    function displayMovies(movies) {
      const moviesRow = document.querySelector(".row");
      if (!moviesRow) {
        console.error("Could not find .row element");
        return;
      }
      moviesRow.innerHTML = "";
      movies.forEach(movie => {
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
        const priceEl = document.createElement("p");
        priceEl.textContent = `Price: $${movie.price}`;
        cardBody.append(title, year, ratingEl, priceEl);
        const cardFooter = document.createElement("div");
        cardFooter.classList.add("card-footer", "text-center");
        const button = document.createElement("button");
        button.classList.add("btn", "btn-outline-dark");
        button.textContent = "Add to Cart";
        button.onclick = function () {
          addToCart(movie.movie_id, movie.title || movie.name, movie.price);
        };
        cardFooter.appendChild(button);
        card.append(img, cardBody, cardFooter);
        col.appendChild(card);
        moviesRow.appendChild(col);
      });
    }
    
    // Optionally call fetchMoviesForDisplay() if needed
    // fetchMoviesForDisplay();
  });
  
  // ------------------------------
  // Initialization on DOMContentLoaded
  // ------------------------------
  document.addEventListener("DOMContentLoaded", async function () {
    console.log("📌 Rentals page loaded. Initializing features...");
  
    // 1. Refresh Rentals & Set Up Delete Listener (if rentals table exists)
    const rentalsTable = document.getElementById("rentalsTableBody");
    if (rentalsTable) {
      await refreshRentals();
      setupDeleteRentalListener();
    } else {
      console.warn("⚠️ rentalsTableBody not found in the DOM.");
    }
  
    // 2. Fetch Movies for Review Dropdown (if movieList and reviewMovie exist)
    if (document.getElementById("movieList") && document.getElementById("reviewMovie")) {
      await fetchMoviesForDropdown();
    } else {
      console.warn("⚠️ movieList or reviewMovie element not found. Skipping fetchMoviesForDropdown().");
    }
  
    // 3. Set Up Review Form Submission (if the review form exists)
    if (document.getElementById("review-form")) {
      setupReviewForm();
    }
  
    // 4. Attach global event listener for user actions on the users table (if applicable)
    const usersTableBody = document.getElementById("user-table-body");
    if (usersTableBody) {
      usersTableBody.addEventListener("click", function (event) {
        const target = event.target;
        const accountId = target.dataset.accountId;
        if (target.classList.contains("edit-user-btn")) {
          console.log(`Editing User ID: ${accountId}`);
          // TODO: Implement edit functionality
        }
        if (target.classList.contains("delete-user-btn")) {
          if (confirm("Are you sure you want to delete this user?")) {
            deleteUser(accountId);
          }
        }
      });
    }
  });
  