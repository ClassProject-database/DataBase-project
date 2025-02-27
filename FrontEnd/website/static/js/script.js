document.addEventListener("DOMContentLoaded", () => {
    console.log("Page is loaded and ready!");
  
    // Fetch movies using async/await
    const fetchMovies = async () => {
      try {
        const response = await fetch('/api/movies');
        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.status}`);
        }
        const movies = await response.json();
        displayMovies(movies);
      } catch (error) {
        console.error("There has been a problem with your fetch operation:", error);
        // If a customAlert function is defined, use it; otherwise, use alert
        if (typeof customAlert === "function") {
          customAlert("Failed to load movies. Please try again later.");
        } else {
          alert("Failed to load movies. Please try again later.");
        }
      }
    };
  
    // Display movies on the page
    const displayMovies = (movies) => {
      const moviesRow = document.querySelector('.row');
      if (!moviesRow) {
        console.error("Could not find the '.row' element for displaying movies.");
        return;
      }
      // Clear previous content
      moviesRow.innerHTML = '';
  
      movies.forEach(movie => {
        const col = document.createElement('div');
        col.classList.add('col');
  
        // Create the card element
        const card = document.createElement('div');
        card.classList.add('card', 'h-100');
  
        // configure the movie image element
        const img = document.createElement('img');
        img.classList.add('card-img-top', 'movie-img');
        img.src = movie.image ? `/static/images/${movie.image}` : '/static/images/keyboard.jpg';
        img.alt = movie.title || movie.name;
  
        // body with movie details
        const cardBody = document.createElement('div');
        cardBody.classList.add('card-body', 'text-center');
        const title = document.createElement('h5');
        title.classList.add('fw-bolder', 'card-title');
        title.textContent = movie.title || movie.name;
        const year = document.createElement('p');
        year.textContent = `Year: ${movie.year}`;
        const rating = document.createElement('p');
        rating.textContent = `Rating: ${movie.rating}`;
        const priceP = document.createElement('p');
        priceP.textContent = `Price: $${movie.price}`;
  
        cardBody.append(title, year, rating, priceP);
  
        // footer with "Add to Cart" button
        const cardFooter = document.createElement('div');
        cardFooter.classList.add('card-footer', 'text-center');
        const button = document.createElement('button');
        button.classList.add('btn', 'btn-outline-dark');
        button.textContent = 'Add to Cart';
        button.onclick = () => {
          console.log(`Adding to cart: ID=${movie.movie_id}, Title=${movie.title || movie.name}, Price=${movie.price}`);
          if (typeof addToCart === 'function') {
            addToCart(movie.movie_id, movie.title || movie.name, movie.price);
          } else {
            console.warn("addToCart function is not defined.");
          }
        };
        cardFooter.appendChild(button);
  
        // Assemble card components and add to the container
        card.append(img, cardBody, cardFooter);
        col.appendChild(card);
        moviesRow.appendChild(col);
      });
    };
  
    fetchMovies();
  });
  