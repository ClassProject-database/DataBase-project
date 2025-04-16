document.addEventListener("DOMContentLoaded", () => {
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

      Object.assign(editForm, {
        editUserId: { value: user.account_id },
        editUsername: { value: user.username },
        editFirstName: { value: user.first_name },
        editLastName: { value: user.last_name },
        editEmail: { value: user.email },
        editPhone: { value: user.phone },
        editRole: { value: user.role },
        editPassword: { value: "" }
      });

      if (["employee", "manager"].includes(user.role)) {
        editForm.editJobTitle.value = user.job_title || "";
        editForm.editSalary.value = user.salary || 0;
        editEmployeeFields.classList.remove("d-none");
      } else {
        editEmployeeFields.classList.add("d-none");
      }

      editUserModal.show();
    }

    if (e.target.classList.contains("delete-user-btn")) {
      await fetch("/api/delete_user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account_id: id })
      });
      fetchUsers();
      toast("User deleted");
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

  const addMovieForm = document.getElementById("add-movie-form");
  const movieTitleInput = document.getElementById("movieTitle");
  const movieIdField = document.querySelector("input[name='movie_id']");
  let allMovies = [];

  const fetchMovies = async () => {
    const res = await fetch("/api/movies/all");
    const data = await safeJson(res);
    allMovies = data || [];
  };

  movieTitleInput?.addEventListener("input", () => {
    const val = movieTitleInput.value.trim().toLowerCase();
    const match = allMovies.find(m => m.title.toLowerCase() === val);
    if (match) {
      document.getElementById("movieYear").value = match.release_year || "";
      document.getElementById("movieRating").value = match.rating || "";
      document.getElementById("moviePrice").value = match.price || "";
      document.getElementById("movieImage").value = match.image_path || "";
      document.getElementById("movieDescription")?.value = match.description || "";
      document.getElementById("movieTrailer")?.value = match.trailer_url || "";
      movieIdField.value = match.movie_id;
    }
  });

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

    const titleLower = movie.title?.toLowerCase();
    const existing = allMovies.find(m => m.title.toLowerCase() === titleLower);
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
      fetchMovies();
    } else {
      toast(result.error || "Failed to save movie", "error");
    }
  });

  fetchUsers();
  fetchMovies();
  searchBtn?.addEventListener("click", () => fetchUsers(searchInput?.value || ""));
});
