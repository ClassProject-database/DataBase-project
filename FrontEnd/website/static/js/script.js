document.addEventListener('DOMContentLoaded', function () {
  console.log('Page is loaded and ready!');

  // Function to fetch movie data
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
              // Display an error message to the user 
              customAlert("Failed to load movies. Please try again later.");
          });
  }

  // Function to display movies on the page
  function displayMovies(movies) {
      const moviesRow = document.querySelector('.row'); // Select the row element
      if (!moviesRow) {
          console.error("Could not find .row element");
          return;
      }
      // Clear previous movies
      moviesRow.innerHTML = '';

      movies.forEach(movie => {
          // Create card
          const col = document.createElement('div');
          col.classList.add('col');

          const card = document.createElement('div');
          card.classList.add('card', 'h-100');

          const img = document.createElement('img');
          img.classList.add('card-img-top', 'movie-img');
          img.src = movie.image ? `/static/images/${movie.image}` : '/static/images/keyboard.jpg'; 
          img.alt = movie.title || movie.name;

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
              addToCart(movie.title || movie.name, movie.price);
          };
          cardFooter.appendChild(button);

          card.appendChild(img);
          card.appendChild(cardBody);
          card.appendChild(cardFooter);
          col.appendChild(card);
          moviesRow.appendChild(col);
      });
  }

  fetchMovies();
});