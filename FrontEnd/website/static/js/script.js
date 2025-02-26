document.addEventListener("DOMContentLoaded", function () {
    console.log("Page is loaded and ready!");
  
    // Function to fetch movie data from the API and then display the movies
    function fetchMovies() {
      fetch('/api/movies')
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.json();
        })
        .then(movies => {
          displayMovies(movies);
        })
        .catch(error => {
          console.error('There has been a problem with your fetch operation:', error);
          // You can call a custom alert here if defined
          customAlert("Failed to load movies. Please try again later.");
        });
    }
  
    // Function to display movies on the page
    function displayMovies(movies) {
      const moviesRow = document.querySelector('.row'); // Ensure this uniquely selects the container
      if (!moviesRow) {
        console.error("Could not find .row element");
        return;
      }
      // Clear previous movies
      moviesRow.innerHTML = '';
  
      movies.forEach(movie => {
        // Create a column element for each movie card
        const col = document.createElement('div');
        col.classList.add('col');
  
        // Create the card element
        const card = document.createElement('div');
        card.classList.add('card', 'h-100');
  
        // Create the movie image element
        const img = document.createElement('img');
        img.classList.add('card-img-top', 'movie-img');
        // Use the movie image or a fallback image
        img.src = movie.image ? `/static/images/${movie.image}` : '/static/images/keyboard.jpg';
        img.alt = movie.title || movie.name;
  
        // Create the card body for movie details
        const cardBody = document.createElement('div');
        cardBody.classList.add('card-body', 'text-center');
  
        const title = document.createElement('h5');
        title.classList.add('fw-bolder', 'card-title');
        title.textContent = movie.title || movie.name;
  
        const year = document.createElement('p');
        year.textContent = `Year: ${movie.year}`;
  
        const rating = document.createElement('p');
        rating.textContent = `Rating: ${movie.rating}`;
  
        const price = document.createElement('p');
        price.textContent = `Price: $${movie.price}`;
  
        // Append details to the card body
        cardBody.appendChild(title);
        cardBody.appendChild(year);
        cardBody.appendChild(rating);
        cardBody.appendChild(price);
  
        // Create the card footer with an "Add to Cart" button
        const cardFooter = document.createElement('div');
        cardFooter.classList.add('card-footer', 'text-center');
        const button = document.createElement('button');
        button.classList.add('btn', 'btn-outline-dark');
        button.textContent = 'Add to Cart';
        // Call the global addToCart function (assumed defined elsewhere, e.g., in cart.js)
        // Pass movie.movie_id, movie.title (or movie.name), and movie.price in the proper order
        button.onclick = function () {
          addToCart(movie.movie_id, movie.title || movie.name, movie.price);
        };
        cardFooter.appendChild(button);
  
        // Assemble the card and add it to the row
        card.appendChild(img);
        card.appendChild(cardBody);
        card.appendChild(cardFooter);
        col.appendChild(card);
        moviesRow.appendChild(col);
      });
    }
  
    // Call fetchMovies once when the page loads
    fetchMovies();
  });
  