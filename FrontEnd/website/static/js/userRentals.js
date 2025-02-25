document.addEventListener("DOMContentLoaded", function () {
    refreshRentals(); //  Load rentals when page loads
    fetchMovies(); //  Fetch movies from API
});

//  Function to Fetch Rentals and Update Table
async function refreshRentals() {
    try {
        const response = await fetch('/api/user_rentals');
        if (!response.ok) throw new Error("Failed to fetch rentals.");
        
        const rentals = await response.json();

        if (rentals.error || rentals.length === 0) {
            updateRentalsTable([]); // Show "No rentals found"
            return;
        }

        updateRentalsTable(rentals);
    } catch (error) {
        console.error("Failed to load rentals:", error);
        alert("Error fetching rentals. Please try again.");
    }
}

//  to update rental table
function updateRentalsTable(rentals) {
    const tableBody = document.getElementById('rentalsTableBody');
    tableBody.innerHTML = ""; // Clear existing data

    if (rentals.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="4" class="text-center">No rentals found.</td></tr>`;
        return;
    }

    rentals.forEach(rental => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${rental.title}</td>
            <td>${rental.rental_date}</td>
            <td>${rental.return_date ? rental.return_date : "Not returned"}</td>
            <td class="${rental.status === 'returned' ? 'text-success' : 'text-warning'}">
                ${rental.status}
            </td>
        `;

        tableBody.appendChild(row);
    });
}

//  Fetch Movies and Populate Datalist & Dropdown
async function fetchMovies() {
    try {
        const response = await fetch('/api/movies');
        const movies = await response.json();

        let datalist = document.getElementById('movieList');
        let dropdown = document.getElementById('reviewMovie');

        datalist.innerHTML = "";
        dropdown.innerHTML = ""; // Clear previous options

        movies.forEach(movie => {
            //  Add to datalist for search suggestions
            let option = document.createElement('option');
            option.value = movie.title;
            option.setAttribute("data-id", movie.movie_id);
            datalist.appendChild(option);

            //  Add to hidden dropdown for form submission
            let dropdownOption = document.createElement('option');
            dropdownOption.value = movie.movie_id;
            dropdownOption.textContent = movie.title;
            dropdown.appendChild(dropdownOption);
        });

        //  Attach event listener only after movies are fetched
        document.getElementById('movieSearch').addEventListener('input', handleMovieSearch);
    } catch (error) {
        console.error('Error fetching movies:', error);
    }
}
//  Ensure movie ID is set when selecting a movie
document.getElementById('movieSearch').addEventListener('input', function () {
    let searchValue = this.value.toLowerCase();
    let dropdown = document.getElementById("movieDropdown");
    let movieIdField = document.getElementById("selectedMovieId");

    dropdown.innerHTML = ""; // Clear previous results
    dropdown.style.display = "none"; // Hide if no results

    if (searchValue.length === 0) {
        movieIdField.value = ""; // Reset movie_id if input is empty
        return;
    }

    let filteredMovies = moviesList.filter(movie => movie.title.toLowerCase().includes(searchValue));

    if (filteredMovies.length === 0) return;

    //  Populate Dropdown with Filtered Movies
    filteredMovies.forEach(movie => {
        let option = document.createElement("div");
        option.classList.add("dropdown-item");
        option.textContent = movie.title;
        option.dataset.id = movie.movie_id;

        option.addEventListener("click", function () {
            document.getElementById("movieSearch").value = movie.title;
            movieIdField.value = movie.movie_id; //  Set movie_id
            dropdown.style.display = "none"; // Hide after selection
        });

        dropdown.appendChild(option);
    });

    dropdown.style.display = "block"; // Show only if matches found
});

//  Handle Movie Search 
function handleMovieSearch() {
    let searchValue = this.value.toLowerCase();
    let datalistOptions = document.querySelectorAll("#movieList option");
    let dropdown = document.getElementById("reviewMovie");

    let found = false;
    datalistOptions.forEach(option => {
        if (option.value.toLowerCase() === searchValue) {
            dropdown.value = option.getAttribute("data-id"); // Set movie_id
            found = true;
        }
    });

    //  Show warning if the user types but doesn't select a valid movie
    if (!found) {
        dropdown.value = ""; // Reset movie_id
    }
}

//  Review Form Submission
document.getElementById('review-form').addEventListener('submit', function (e) {
    e.preventDefault();
    
    let movieTitle = document.getElementById("movieSearch").value;
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

    fetch('/api/post_review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movie_id: movieId, rating, review })
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
    .catch(error => console.error('Error:', error));
});

