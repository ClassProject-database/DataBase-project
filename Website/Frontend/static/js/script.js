// document.addEventListener("DOMContentLoaded", () => {
//   console.log(" Movie listing page ready!");

//   const moviesRow = document.querySelector(".row");
//   if (!moviesRow) {
//     console.error(" .row container not found for displaying movies.");
//     return;
//   }

//   const fetchMovies = async () => {
//     try {
//       const res = await fetch("/api/movies");
//       if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
//       const movies = await res.json();
//       displayMovies(movies);
//     } catch (err) {
//       console.error(" Failed to fetch movies:", err);
//       typeof customAlert === "function"
//         ? customAlert(" Failed to load movies. Try again later.")
//         : alert(" Failed to load movies. Try again later.");
//     }
//   };

//   const displayMovies = (movies) => {
//     moviesRow.innerHTML = "";
  
//     movies.forEach((movie) => {
//       const col = document.createElement("div");
//       col.className = "col";
  
//       const card = document.createElement("div");
//       card.className = "card h-100";
  
//       const img = document.createElement("img");
//       img.className = "card-img-top movie-img";
//       img.src = movie.image ? `/static/images/${movie.image}` : "/static/images/keyboard.jpg";
//       img.alt = movie.title || "Untitled";
  
//       const imgLink = document.createElement("a");
//       imgLink.href = `/movie/${movie.movie_id}`;
//       imgLink.appendChild(img);
  
//       const cardBody = document.createElement("div");
//       cardBody.className = "card-body text-center";
  
//       const title = document.createElement("h5");
//       title.className = "fw-bolder card-title";
//       title.textContent = movie.title || "Untitled";
  
//       const year = document.createElement("p");
//       year.textContent = `Year: ${movie.year ?? "N/A"}`;
  
//       const rating = document.createElement("p");
//       rating.textContent = `Rating: ${movie.rating ?? "Unrated"}`;
  
//       const price = document.createElement("p");
//       price.textContent = `Price: $${parseFloat(movie.price).toFixed(2)}`;
  
//       cardBody.append(title, year, rating, price);
  
//       const cardFooter = document.createElement("div");
//       cardFooter.className = "card-footer text-center";
  
//       const addButton = document.createElement("button");
//       addButton.className = "btn btn-outline-dark";
//       addButton.textContent = "Add to Cart";
//       addButton.onclick = () => {
//         if (typeof addToCart === "function") {
//           addToCart(movie.movie_id, movie.title, movie.price);
//         } else {
//           console.warn("addToCart function is not available.");
//         }
//       };
  
//       cardFooter.appendChild(addButton);
  
//       card.append(imgLink, cardBody, cardFooter);
//       col.appendChild(card);
//       moviesRow.appendChild(col);
//     });
//   };
  

//   fetchMovies();
// });
