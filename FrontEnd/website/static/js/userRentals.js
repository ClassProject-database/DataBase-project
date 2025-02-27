document.addEventListener("DOMContentLoaded", async function () {
    console.log("User Rentals Page Loaded. Initializing Features...");

    //  Initialize Rentals, Reviews, and Dropdown Search
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

//  Global Cart Function (Prevents Duplicates)
if (!window.addToCart) {
    window.addToCart = function (movie_id, name, price) {
        console.log(" Adding to Cart:", { movie_id, name, price });

        if (!movie_id || !name || isNaN(price)) {
            console.error(" Invalid item data:", { movie_id, name, price });
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

//  Fetch Rentals & Update Table
async function refreshRentals() {
    try {
        console.log(" Fetching Rentals...");
        const response = await fetch("/api/rentals");
        if (!response.ok) throw new Error(`Failed to fetch rentals. Status: ${response.status}`);

        const rentals = await response.json();
        updateRentalsTable(rentals);
    } catch (error) {
        console.error(" Failed to load rentals:", error);
    }
}

function updateRentalsTable(rentals) {
    const tableBody = document.getElementById("rentalsTableBody");
    if (!tableBody) return;

    tableBody.innerHTML = rentals.length === 0
        ? `<tr><td colspan="5" class="text-center">No rentals found.</td></tr>`
        : rentals.map(rental => `
            <tr data-rental-id="${rental.rental_id}">
                <td>${rental.title}</td>
                <td>${rental.rental_date}</td>
                <td>${rental.return_date || "Not returned"}</td>
                <td class="${rental.status === "returned" ? "text-success" : "text-warning"}">
                    ${rental.status}
                </td>
                <td>
                    <button class="btn btn-sm btn-danger delete-rental-btn" data-rental-id="${rental.rental_id}">
                        <i class="fa fa-trash"></i>
                    </button>
                </td>
            </tr>`).join("");
}

//  Handle Rental Deletions
function setupDeleteRentalListener() {
    document.getElementById("rentalsTableBody")?.addEventListener("click", function (e) {
        if (!e.target.classList.contains("delete-rental-btn")) return;

        const rentalId = e.target.getAttribute("data-rental-id");
        if (!rentalId || !confirm("Are you sure you want to delete this rental?")) return;

        fetch("/api/delete_rental", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rental_id: rentalId }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.querySelector(`tr[data-rental-id="${rentalId}"]`)?.remove();
                showToast("Rental deleted successfully!");
            } else {
                showToast("Error: " + data.error, "error");
            }
        })
        .catch(error => console.error(" Error deleting rental:", error));
    });
}

//  Fetch Movies for Dropdown Search
async function fetchMoviesForDropdown() {
    console.log(" Fetching movies for review search...");

    try {
        const response = await fetch("/api/movies");
        if (!response.ok) throw new Error(`Error: ${response.status}`);

        window.moviesList = await response.json();
        console.log(" Movies loaded for dropdown successfully.");
    } catch (error) {
        console.error(" Error fetching movies:", error);
    }
}

//  Movie Search Input Filtering
document.getElementById("movieSearch")?.addEventListener("input", function () {
    const query = this.value.trim().toLowerCase();
    const dropdown = document.getElementById("movieDropdown");
    const movieIdField = document.getElementById("selectedMovieId");

    dropdown.innerHTML = "";
    dropdown.style.display = "none";

    if (!query.length) {
        movieIdField.value = "";
        return;
    }

    const filteredMovies = window.moviesList.filter(movie => movie.title.toLowerCase().includes(query));
    if (!filteredMovies.length) return;

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

//  Review Form Submission 
function setupReviewForm() {
    document.getElementById("review-form")?.addEventListener("submit", function (e) {
        e.preventDefault();

        const movieId = document.getElementById("selectedMovieId").value;
        const rating = document.getElementById("reviewRating").value;
        const review = document.getElementById("reviewComment").value;
        const reviewList = document.getElementById("review-list");

        if (!movieId || !rating || !review) {
            showToast("All fields are required!", "error");
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
                showToast(" Review submitted successfully!");

                //  Clear input fields
                document.getElementById("reviewRating").value = "";
                document.getElementById("reviewComment").value = "";
                document.getElementById("movieSearch").value = "";
                document.getElementById("selectedMovieId").value = "";

                //  Dynamically Update Review List 
                const newReview = document.createElement("li");
                newReview.classList.add("list-group-item");
                newReview.innerHTML = `
                    <strong>${data.movie_title}</strong> (${rating}/5) 
                    <br>${review}
                    <br><small>Just now</small>
                `;
                reviewList.prepend(newReview); // Add to the top of the list
            } else {
                showToast(" Error: " + data.error, "error");
            }
        })
        .catch(error => {
            console.error(" Error submitting review:", error);
            showToast(" Error submitting review.", "error");
        });
    });
}


//  User Table Actions (Delete/Edit)
function setupUserTableListeners() {
    document.getElementById("user-table-body")?.addEventListener("click", function (event) {
        const target = event.target;
        const accountId = target.dataset.accountId;

        if (target.classList.contains("delete-user-btn") && confirm("Delete this user?")) {
            deleteUser(accountId);
        }
    });
}

async function deleteUser(accountId) {
    if (!accountId) return;
    console.log(" Deleting User:", accountId);

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
        console.error(" Error deleting user:", error);
    }
}
