document.addEventListener("DOMContentLoaded", async () => {
  const toast = (msg, type = "success") => {
    const el = document.createElement("div");
    el.className = `toast text-white bg-${type === "error" ? "danger" : "success"} p-2 rounded position-fixed bottom-0 end-0 m-3`;
    el.innerText = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  };

  const safeJson = async res => {
    try {
      return await res.json();
    } catch {
      return {};
    }
  };

  const roleEl = document.querySelector("[data-role]");
  const isManager = (roleEl?.dataset.title || "").toLowerCase() === "manager";
  const isEmployee = (roleEl?.dataset.role || "").toLowerCase() === "employee";

  const userTable = document.getElementById("user-table-body");
  const addUserForm = document.getElementById("add-user-form");
  const editUserModal = new bootstrap.Modal(document.getElementById("editUserModal"));
  const editForm = document.getElementById("edit-user-form");
  const searchBtn = document.getElementById("searchBtn");
  const searchInput = document.getElementById("searchUsers");
  const editEmployeeFields = document.getElementById("edit-employee-fields");

  const fetchUsers = async (query = "") => {
    const res = await fetch(`/api/search_users?query=${encodeURIComponent(query)}`);
    const users = await safeJson(res);
    userTable.innerHTML = users.length
      ? users.map(u => {
          const canEditDelete = isManager || (isEmployee && u.role === "customer");
          return `
            <tr data-account-id="${u.account_id}">
              <td>${u.account_id}</td>
              <td>${u.username}</td>
              <td>${u.first_name} ${u.last_name}</td>
              <td>${u.email}</td>
              <td>${u.role}</td>
              <td>
                <a href="/admin/user/${u.account_id}" class="btn btn-sm btn-info">View</a>
                ${canEditDelete ? `<button class="btn btn-sm btn-primary edit-user-btn" data-id="${u.account_id}">Edit</button>` : ""}
                ${canEditDelete ? `<button class="btn btn-sm btn-danger delete-user-btn" data-id="${u.account_id}">Delete</button>` : ""}
              </td>
            </tr>`;
        }).join("")
      : `<tr><td colspan="6" class="text-center">No users found.</td></tr>`;
  };

  if (addUserForm) {
    const roleInput = addUserForm.role;
    const jobFields = document.getElementById("employee-fields");

    roleInput?.addEventListener("change", () => {
      const show = ["employee", "manager"].includes(roleInput.value) && isManager;
      jobFields?.classList.toggle("d-none", !show);
    });

    addUserForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(addUserForm).entries());
      ["username", "password", "first_name", "last_name", "email", "phone", "role", "job_title"].forEach(k => data[k] = data[k]?.trim());
      data.salary = parseFloat(data.salary) || 0.0;

      if (["employee", "manager"].includes(data.role) && !isManager) {
        toast("Only managers can add employees or managers.", "error");
        return;
      }

      const res = await fetch("/api/add_user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      const result = await safeJson(res);
      if (result.success) {
        toast("User added");
        addUserForm.reset();
        jobFields?.classList.add("d-none");
        fetchUsers();
      } else {
        toast(result.error || "Error adding user", "error");
      }
    });
  }

  userTable?.addEventListener("click", async (e) => {
    const id = e.target.dataset.id;
    if (!id) return;

    if (e.target.classList.contains("edit-user-btn")) {
      const res = await fetch(`/api/get_user?account_id=${id}`);
      const user = await safeJson(res);

      editForm.querySelector("#editUserId").value = user.account_id || "";
      editForm.querySelector("#editUsername").value = user.username || "";
      editForm.querySelector("#editFirstName").value = user.first_name || "";
      editForm.querySelector("#editLastName").value = user.last_name || "";
      editForm.querySelector("#editEmail").value = user.email || "";
      editForm.querySelector("#editPhone").value = user.phone || "";
      editForm.querySelector("#editRole").value = user.role || "";
      editForm.querySelector("#editPassword").value = "";

      if (["employee", "manager"].includes(user.role)) {
        editForm.querySelector("#editJobTitle").value = user.job_title || "";
        editForm.querySelector("#editSalary").value = user.salary || 0;
        editEmployeeFields.classList.remove("d-none");
      } else {
        editEmployeeFields.classList.add("d-none");
      }

      editUserModal.show();
    }

    if (e.target.classList.contains("delete-user-btn")) {
      const confirmed = await confirmAction("Are you sure you want to delete this user?");
      if (!confirmed) return;
    
      const res = await fetch("/api/delete_user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account_id: id })
      });
    
      const result = await safeJson(res);
      if (result.success) {
        toast("User deleted");
        fetchUsers();
      } else {
        toast(result.error || "Failed to delete user", "error");
      }
    }
    
  });

  editForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(editForm).entries());
    data.salary = parseFloat(data.salary) || 0.0;

    await fetch("/api/update_user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    editUserModal.hide();
    fetchUsers();
    toast("User updated");
  });

  // ===== Movie Management =====
  const addMovieForm = document.getElementById("add-movie-form");
  const movieTitleInput = document.getElementById("movieTitle");
  const movieIdField = document.querySelector("input[name='movie_id']");
  let allMovies = [];

  const fetchMovies = async () => {
    const res = await fetch("/api/movies/all");
    const data = await safeJson(res);
    allMovies = data || [];
  };

  await fetchMovies();


  const deleteMovieBtn = document.getElementById("deleteMovieBtn");

  deleteMovieBtn?.addEventListener("click", async () => {
  const movieId = movieIdField.value;
  if (!movieId) {
    toast("No movie selected to delete.", "error");
    return;
  }


  async function confirmAction(message = "Are you sure?") {
    return new Promise((resolve) => {
      const modal = new bootstrap.Modal(document.getElementById("confirmModal"));
      document.getElementById("confirmModalMessage").textContent = message;
  
      const confirmBtn = document.getElementById("confirmModalOk");
  
      const onClick = () => {
        confirmBtn.removeEventListener("click", onClick);
        resolve(true);
        modal.hide();
      };
  
      confirmBtn.addEventListener("click", onClick);
      modal.show();
    });
  }
  

  const confirmed = await confirmAction("Are you sure you want to delete this movie?", "Delete Movie");
  if (!confirmed) return;
  

  try {
    const res = await fetch("/api/delete_movie", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ movie_id: movieId })
    });
    

    const result = await safeJson(res);
    if (result.success) {
      toast("Movie deleted");
      addMovieForm.reset();
      movieIdField.value = "";
      await fetchMovies();
    } else {
      toast(result.error || "Failed to delete movie.", "error");
    }
  } catch (err) {
    console.error("Movie delete error:", err);
    toast("Server error while deleting movie", "error");
  }
});



  movieTitleInput?.addEventListener("input", () => {
    const val = movieTitleInput.value.trim().toLowerCase();
    const suggestions = allMovies.filter(m => m.title.toLowerCase().includes(val));
    buildMovieDropdownSuggestions(suggestions);

    const exactMatch = allMovies.find(m => m.title.toLowerCase() === val);
    if (exactMatch) {
      movieIdField.value = exactMatch.movie_id;
      document.getElementById("movieYear").value = exactMatch.release_year || "";
      document.getElementById("movieRating").value = exactMatch.rating || "";
      document.getElementById("moviePrice").value = exactMatch.price || "";
      document.getElementById("movieImage").value = exactMatch.image_path || "";
      document.getElementById("movieDescription").value = exactMatch.description || "";
      document.getElementById("movieTrailer").value = exactMatch.trailer_url || "";
    } else {
      movieIdField.value = "";
    }
  });

  function buildMovieDropdownSuggestions(matches) {
    let list = document.getElementById("movie-suggestions");
    if (!list) {
      list = document.createElement("ul");
      list.id = "movie-suggestions";
      list.className = "list-group position-absolute z-3 w-100 mt-1 bg-dark";
      movieTitleInput.parentNode.appendChild(list);
    }

    list.innerHTML = "";
    if (!matches.length) {
      list.classList.add("d-none");
      return;
    }

    list.classList.remove("d-none");
    matches.slice(0, 5).forEach(movie => {
      const item = document.createElement("li");
      item.className = "list-group-item list-group-item-action text-white bg-secondary";
      item.textContent = movie.title;
      item.onclick = () => {
        movieTitleInput.value = movie.title;
        list.innerHTML = "";
        movieIdField.value = movie.movie_id;
        document.getElementById("movieYear").value = movie.release_year || "";
        document.getElementById("movieRating").value = movie.rating || "";
        document.getElementById("moviePrice").value = movie.price || "";
        document.getElementById("movieImage").value = movie.image_path || "";
        document.getElementById("movieDescription").value = movie.description || "";
        document.getElementById("movieTrailer").value = movie.trailer_url || "";
      };
      list.appendChild(item);
    });
  }

  addMovieForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(addMovieForm);
    const movie = {};
   
    for (const [key, value] of formData.entries()) {
      if (key === "genre_ids[]") {
        movie.genre_ids = movie.genre_ids || [];
        movie.genre_ids.push(value);
      } else {
        movie[key] = value.trim();
      }
    }

    const existing = allMovies.find(m => m.title.toLowerCase() === movie.title?.toLowerCase());
    if (existing) movie.movie_id = existing.movie_id;

    const url = movie.movie_id ? "/api/update_movie" : "/api/add_movie";
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(movie)
    });

    const result = await safeJson(res);
    if (result.success) {
      toast(movie.movie_id ? "Movie updated" : "Movie added");
      addMovieForm.reset();
      movieIdField.value = "";
      await fetchMovies();
    } else {
      toast(result.error || "Failed to save movie", "error");
    }
  });

  searchBtn?.addEventListener("click", () => fetchUsers(searchInput?.value || ""));
  fetchUsers();
});

function confirmAction(message = "Are you sure?", confirmBtnText = "Confirm") {
  return new Promise((resolve) => {
    const modalEl = document.getElementById("confirmModal");
    const modalMsg = document.getElementById("confirmModalMessage");
    const okBtn = document.getElementById("confirmModalOk");
    const modal = new bootstrap.Modal(modalEl);

    modalMsg.textContent = message;
    okBtn.textContent = confirmBtnText;

    const cleanup = () => {
      okBtn.removeEventListener("click", handleOk);
      modalEl.removeEventListener("hidden.bs.modal", handleCancel);
    };

    const handleOk = () => {
      cleanup();
      modal.hide();
      resolve(true);
    };

    const handleCancel = () => {
      cleanup();
      resolve(false);
    };

    okBtn.addEventListener("click", handleOk);
    modalEl.addEventListener("hidden.bs.modal", handleCancel);

    modal.show();
  });
}
