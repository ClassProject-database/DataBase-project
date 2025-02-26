document.addEventListener('DOMContentLoaded', function () {
    console.log('Filters loaded.');

    // ✅ 1. Fetch all movies on page load
    fetchMovies();

    /**
     * ✅ 2. Fetch movies by optional genre ID
     * @param {number|null} genreId - The ID of the genre to filter, or null for all.
     */
    function fetchMovies(genreId = null) {
        let url = '/api/movies';
        if (genreId) {
            url += `?genre_id=${genreId}`;
        }

        fetch(url)
            .then(response => response.json())
            .then(movies => {
                displayMovies(movies);
            })
            .catch(error => {
                console.error('❌ Error fetching movies:', error);
            });
    }

    /**
     * ✅ 3. Display fetched movies in the DOM
     * @param {Array} movies - List of movie objects
     */
    function displayMovies(movies) {
        const moviesContainer = document.getElementById('movies-container');
        if (!moviesContainer) {
            console.error("❌ No element with ID 'movies-container' found in DOM.");
            return;
        }

        // Clear previous content
        moviesContainer.innerHTML = '';

        // Loop through each movie
        movies.forEach(movie => {
            // Create column container
            const col = document.createElement('div');
            col.classList.add('col', 'movie-card');
            // If you have a genre_id, store it as data-attribute for filtering
            col.dataset.genre = movie.genre_id;

            // Create card
            const card = document.createElement('div');
            card.classList.add('card', 'h-100');

            // Movie image
            const img = document.createElement('img');
            img.classList.add('card-img-top', 'movie-img');
            // Fallback image if movie.image is missing
            img.src = movie.image ? `/static/images/${movie.image}` : '/static/images/keyboard.jpg';
            img.alt = movie.title;

            // Card body (Title, Year, Rating, Price)
            const cardBody = document.createElement('div');
            cardBody.classList.add('card-body', 'text-center');

            const title = document.createElement('h5');
            title.classList.add('fw-bolder', 'card-title');
            title.textContent = movie.title;

            const year = document.createElement('p');
            year.textContent = `Year: ${movie.year}`;

            const rating = document.createElement('p');
            rating.textContent = `Rating: ${movie.rating}`;

            const priceP = document.createElement('p');
            priceP.textContent = `Price: $${movie.price}`;

            // Append body elements
            cardBody.appendChild(title);
            cardBody.appendChild(year);
            cardBody.appendChild(rating);
            cardBody.appendChild(priceP);

            // Card footer (Add to Cart button)
            const cardFooter = document.createElement('div');
            cardFooter.classList.add('card-footer', 'text-center');

            const button = document.createElement('button');
            button.classList.add('btn', 'btn-outline-dark');
            button.textContent = 'Add to Cart';

            // ✅ Use correct properties from the movie object
            //    Pass them in the correct order to addToCart()
            button.onclick = function () {
                // If you see an error "movie_id is not defined", 
                // check if 'movie_id' is in the DB & your Python code
                console.log(`🛒 Attempting to add to cart: ID=${movie.movie_id}, Title=${movie.title}, Price=${movie.price}`);
                addToCart(movie.movie_id, movie.title, movie.price);
            };

            cardFooter.appendChild(button);

            // Combine everything
            card.appendChild(img);
            card.appendChild(cardBody);
            card.appendChild(cardFooter);
            col.appendChild(card);
            moviesContainer.appendChild(col);
        });
    }

    // ✅ 4. Expose fetchMovies() globally so you can call it from other scripts (e.g., genre filters)
    window.fetchMovies = fetchMovies;
});


// ===========================================
// OPTIONAL: Dark Mode Toggle
// ===========================================
function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
    // Store user preference in localStorage
    const isDarkMode = document.body.classList.contains("dark-mode");
    localStorage.setItem("darkMode", isDarkMode);
}

// Ensure dark mode persists across reloads
document.addEventListener("DOMContentLoaded", function () {
    if (localStorage.getItem("darkMode") === "true") {
        document.body.classList.add("dark-mode");
    }
});
