document.addEventListener('DOMContentLoaded', function () {
    console.log('Filters loaded.');

    // Fetch all movies initially
    fetchMovies();

    // Function to fetch movies based on genre
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
                console.error('Error fetching movies:', error);
            });
    }

    // Function to display movies
    function displayMovies(movies) {
        const moviesContainer = document.getElementById('movies-container');
        moviesContainer.innerHTML = '';

        movies.forEach(movie => {
            const col = document.createElement('div');
            col.classList.add('col', 'movie-card');
            col.dataset.genre = movie.genre_id;

            const card = document.createElement('div');
            card.classList.add('card', 'h-100');

            const img = document.createElement('img');
            img.classList.add('card-img-top', 'movie-img');
            img.src = movie.image ? `/static/images/${movie.image}` : '/static/images/keyboard.jpg';
            img.alt = movie.title;

            const cardBody = document.createElement('div');
            cardBody.classList.add('card-body', 'text-center');

            const title = document.createElement('h5');
            title.classList.add('fw-bolder', 'card-title');
            title.textContent = movie.title;

            const year = document.createElement('p');
            year.textContent = `Year: ${movie.year}`;
            const rating = document.createElement('p');
            rating.textContent = `Rating: ${movie.rating}`;
            const price = document.createElement('p');
            price.textContent = `Price: $${movie.price}`;

            cardBody.appendChild(title);
            cardBody.appendChild(year);
            cardBody.appendChild(rating);
            cardBody.appendChild(price);

            const cardFooter = document.createElement('div');
            cardFooter.classList.add('card-footer', 'text-center');
            const button = document.createElement('button');
            button.classList.add('btn', 'btn-outline-dark');
            button.textContent = 'Add to Cart';
            button.onclick = function () {
                addToCart(movie.title, movie.price);
            };
            cardFooter.appendChild(button);

            card.appendChild(img);
            card.appendChild(cardBody);
            card.appendChild(cardFooter);
            col.appendChild(card);
            moviesContainer.appendChild(col);
        });
    }

    // Expose the function globally
    window.fetchMovies = fetchMovies;
});
function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");

    // Store user preference in localStorage
    const isDarkMode = document.body.classList.contains("dark-mode");
    localStorage.setItem("darkMode", isDarkMode);
}

// Ensure dark mode persists across page reloads
document.addEventListener("DOMContentLoaded", function () {
    if (localStorage.getItem("darkMode") === "true") {
        document.body.classList.add("dark-mode");
    }
});
