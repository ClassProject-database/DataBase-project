document.addEventListener("DOMContentLoaded", async function () {
    console.log("User Rentals Page Loaded. Initializing Features...");


    if (document.getElementById("rentalsTableBody")) {
        await refreshRentals();
        setupDeleteRentalListener();
    }

    if (document.getElementById("review-form")) {
        setupReviewForm();
    }

    if (document.getElementById("movieSearch")) {
        await fetchMoviesForDropdown();
    }
    if (document.getElementById("user-table-body")) {
        setupUserTableListeners();
    }
});


if (!window.addToCart) {
    window.addToCart = function (movie_id, name, price) {
        console.log("Adding to Cart:", { movie_id, name, price });

        if (!movie_id || !name || isNaN(price)) {
            console.error("Invalid item data:", { movie_id, name, price });
            return;
        }

        let cart = JSON.parse(localStorage.getItem("cart")) || [];
        if (cart.find(item => item.movie_id == movie_id)) {
            showToast(`${name} is already in your cart.`);
            return;
        }

        cart.push({ movie_id, name, price: parseFloat(price) });
        localStorage.setItem("cart", JSON.stringify(cart));
        updateCartBadge(); 
        showToast(`${name} added to cart!`);
    };
}


// Fetch rentals `/api/rentals`
async function refreshRentals() {
    try {
        console.log("Fetching Rentals...");
        const response = await fetch("/api/rentals");
        if (!response.ok) {
            throw new Error(`Failed to fetch rentals. Status: ${response.status}`);
        }

        const rentals = await response.json();
        updateRentalsTable(rentals);
    } catch (error) {
        console.error("Failed to load rentals:", error);
    }
}

function updateRentalsTable(rentals) {
    const tableBody = document.getElementById("rentalsTableBody");
    if (!tableBody) return;

    // If no rentals, show a "No rentals" row
    if (!rentals.length) {
        tableBody.innerHTML = `
            <tr><td colspan="5" class="text-center">No rentals found.</td></tr>
        `;
        return;
    }

    // Build table rows for each rental
    tableBody.innerHTML = rentals.map(rental => {
        const isReturned = Boolean(rental.return_date);
        const returnDateText = rental.return_date || "Not returned";

        const returnBtnHTML = !isReturned 
            ? `
              <button
                class="btn btn-sm btn-warning return-rental-btn"
                data-rental-id="${rental.rentalID}"
              >
                Return
              </button>
            `
            : "";

        return `
            <tr data-rental-id="${rental.rentalID}">
                <td>${rental.title}</td>
                <td>${rental.rental_date}</td>
                <td>${returnDateText}</td>
                <td>$${rental.rental_price}</td>
                <td>
                    ${returnBtnHTML}
                    <button 
                        class="btn btn-sm btn-danger delete-rental-btn" 
                        data-rental-id="${rental.rentalID}"
                    >
                        <i class="fa fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join("");
}


//  REVIEW
function setupReviewForm() {
    const reviewForm = document.getElementById("review-form");
    if (!reviewForm) return;

    reviewForm.addEventListener("submit", async function (e) {
        e.preventDefault();


        // Validate required fields
        const movieId = document.getElementById("selectedMovieId").value;
        const rating = document.getElementById("reviewRating").value;
        const reviewText = document.getElementById("reviewComment").value.trim();
        const reviewList = document.getElementById("review-list");
        
        if (!movieId || !rating || !reviewText) {
            showToast("All fields are required!", "error");
            return;
        }
        
        console.log("Sending review:", { movie_id: movieId, rating, review_comment: reviewText });
        
        try {
            const response = await fetch("/api/post_review", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    movie_id: movieId,
                    rating: rating,
                    review_comment: reviewText 
                })
            });
        

            const data = await response.json();
            if (data.success) {
                showToast("Review submitted successfully!", "success");

            
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
                showToast("Error: " + data.error, "error");
            }
        } catch (error) {
            console.error("Error submitting review:", error);
            showToast("Error submitting review.", "error");
        }
    });
}


//  MOVIE SEARCH FOR REVIEWS

async function fetchMoviesForDropdown() {
    console.log("Fetching movies for review search...");
    try {
        const response = await fetch("/api/movies");
        if (!response.ok) throw new Error(`Error: ${response.status}`);

        window.moviesList = await response.json();
        console.log("Movies loaded for dropdown successfully.");
    } catch (error) {
        console.error("Error fetching movies:", error);
    }
}
document.getElementById("movieSearch")?.addEventListener("input", function () {
    const query = this.value.trim().toLowerCase();
    const dropdown = document.getElementById("movieDropdown");
    const movieIdField = document.getElementById("selectedMovieId");

    if (!dropdown || !movieIdField || !window.moviesList) return;

    dropdown.innerHTML = "";
    dropdown.style.display = "none";

    if (!query) {
        movieIdField.value = "";
        return;
    }

    const filteredMovies = window.moviesList.filter(movie =>
        movie.title.toLowerCase().includes(query)
    );
    if (!filteredMovies.length) return;

    // Build dropdown items
    filteredMovies.forEach(movie => {
        let option = document.createElement("div");
        option.classList.add("dropdown-item");
        option.textContent = movie.title;
        option.dataset.id = movie.movie_id;
        option.addEventListener("click", () => {
            document.getElementById("movieSearch").value = movie.title;
            movieIdField.value = movie.movie_id;
            dropdown.style.display = "none";
        });
        dropdown.appendChild(option);
    });

    dropdown.style.display = "block";
});


//  ADMIN USER TABLE
function setupUserTableListeners() {
    const userTableBody = document.getElementById("user-table-body");
    if (!userTableBody) return;

    userTableBody.addEventListener("click", function (event) {
        const target = event.target;
        const accountId = target.dataset.accountId;

        if (target.classList.contains("delete-user-btn") && accountId) {
            if (confirm("Delete this user?")) {
                deleteUser(accountId);
            }
        }
    });
}

async function deleteUser(accountId) {
    console.log("Deleting User:", accountId);
    try {
        const response = await fetch("/api/delete_user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ account_id: accountId }),
        });

        const data = await response.json();
        if (data.success) {
            showToast("User deleted!");
            document.querySelector(`tr[data-account-id="${accountId}"]`)?.remove();
        } else {
            showToast("Error: " + data.error, "error");
        }
    } catch (error) {
        console.error("Error deleting user:", error);
    }
}

