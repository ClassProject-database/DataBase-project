document.addEventListener("DOMContentLoaded", () => {
    console.log(" Filters script loaded.");

    //  Fetch & Display Movies
    const fetchMovies = async (genreId = null) => {
        let url = "/api/movies";
        
        //  Ensure correct handling of genreId
        if (genreId !== null && !isNaN(genreId)) {
            url += `?genre_id=${genreId}`;
        }

        try {
            console.log(`📡 Fetching movies (Genre ID: ${genreId ?? "All"})...`);
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Server error: ${response.status}`);

            const movies = await response.json();
            displayMovies(movies);
        } catch (error) {
            console.error(" Error fetching movies:", error);
        }
    };

    //  Display Movies in UI
    const displayMovies = (movies) => {
        const moviesContainer = document.getElementById("movies-container");
        if (!moviesContainer) {
            console.error("No element with ID 'movies-container' found.");
            return;
        }
        moviesContainer.innerHTML = "";

        movies.forEach((movie) => {
            const col = document.createElement("div");
            col.classList.add("col", "movie-card");
            col.dataset.genre = movie.genre_id;

            const card = document.createElement("div");
            card.classList.add("card", "h-100");

            const img = document.createElement("img");
            img.classList.add("card-img-top", "movie-img");
            img.src = movie.image ? `/static/images/${movie.image}` : "/static/images/keyboard.jpg";
            img.alt = movie.title;

            const cardBody = document.createElement("div");
            cardBody.classList.add("card-body", "text-center");
            cardBody.innerHTML = `
                <h5 class="fw-bolder">${movie.title}</h5>
                <p>Year: ${movie.year}</p>
                <p>Rating: ${movie.rating}</p>
                <p>Price: $${movie.price}</p>
            `;

            const cardFooter = document.createElement("div");
            cardFooter.classList.add("card-footer", "text-center");

            const button = document.createElement("button");
            button.classList.add("btn", "btn-outline-dark");
            button.textContent = "Add to Cart";
            button.onclick = () => {
                console.log(`🛒 Adding: ${movie.title}`);
                if (typeof addToCart === "function") {
                    addToCart(movie.movie_id, movie.title, movie.price);
                } else {
                    console.warn("⚠️ addToCart function is not defined.");
                }
            };

            cardFooter.appendChild(button);
            card.append(img, cardBody, cardFooter);
            col.appendChild(card);
            moviesContainer.appendChild(col);
        });
    };

    //  Attach Click Event to Genre Buttons
    document.querySelectorAll(".filter-btn").forEach((button) => {
        button.addEventListener("click", () => {
            let genreId = button.dataset.genreId;
            genreId = genreId === "null" ? null : parseInt(genreId); 
            console.log(`🔍 Filtering movies by Genre ID: ${genreId ?? "All"}`);
            fetchMovies(genreId);
        });
    });

    //  Load all movies initially
    fetchMovies();
});
