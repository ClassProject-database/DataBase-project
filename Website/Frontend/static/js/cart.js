document.addEventListener("DOMContentLoaded", () => {
    const toast = (msg, type = "success") => {
      const el = document.createElement("div");
      el.className = `toast-message bg-${type === "error" ? "danger" : "success"} text-white p-2 px-3 rounded shadow position-fixed bottom-0 start-50 translate-middle-x mb-4 fade show`;
      el.innerText = msg;
      document.body.appendChild(el);
      setTimeout(() => {
        el.classList.remove("show");
        el.addEventListener("transitionend", () => el.remove());
      }, 3000);
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
            const canEdit = isManager || (isEmployee && u.role === "customer");
            return `
              <tr data-account-id="${u.account_id}">
                <td>${u.account_id}</td>
                <td>${u.username}</td>
                <td>${u.first_name} ${u.last_name}</td>
                <td>${u.email}</td>
                <td>${u.role}</td>
                <td>
                  <a href="/admin/user/${u.account_id}" class="btn btn-sm btn-info">View</a>
                  ${canEdit ? `<button class="btn btn-sm btn-primary edit-user-btn" data-id="${u.account_id}">Edit</button>` : ""}
                  ${canEdit ? `<button class="btn btn-sm btn-danger delete-user-btn" data-id="${u.account_id}">Delete</button>` : ""}
                </td>
              </tr>`;
          }).join("")
        : `<tr><td colspan="6" class="text-center">No users found.</td></tr>`;
    };
  
    if (addUserForm) {
      const roleInput = addUserForm.role;
      const jobFields = document.getElementById("employee-fields");
  
      roleInput?.addEventListener("change", () => {
        jobFields?.classList.toggle("d-none", !("employee,manager".includes(roleInput.value) && isManager));
      });
  
      addUserForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(addUserForm).entries());
        ["username", "password", "first_name", "last_name", "email", "phone", "role", "job_title"].forEach(k => data[k] = data[k]?.trim());
        data.salary = parseFloat(data.salary) || 0;
  
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
  
    userTable.addEventListener("click", async (e) => {
      const target = e.target.closest("button");
      if (!target) return;
  
      const id = target.dataset.id;
      if (!id) return;
  
      if (target.classList.contains("edit-user-btn")) {
        try {
          const res = await fetch(`/api/get_user?account_id=${id}`);
          const user = await safeJson(res);
          if (!user || user.error) {
            toast(user.error || "User not found", "error");
            return;
          }
  
          editForm.editUserId.value = user.account_id || "";
          editForm.editUsername.value = user.username || "";
          editForm.editFirstName.value = user.first_name || "";
          editForm.editLastName.value = user.last_name || "";
          editForm.editEmail.value = user.email || "";
          editForm.editPhone.value = user.phone || "";
          editForm.editRole.value = user.role || "";
          editForm.editPassword.value = "";
  
          if (["employee", "manager"].includes(user.role)) {
            editForm.editJobTitle.value = user.job_title || "";
            editForm.editSalary.value = user.salary || 0;
            editEmployeeFields.classList.remove("d-none");
          } else {
            editEmployeeFields.classList.add("d-none");
          }
  
          editUserModal.show();
        } catch (err) {
          toast("Failed to fetch user data", "error");
          console.error(err);
        }
      }
  
      if (target.classList.contains("delete-user-btn")) {
        try {
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
            toast(result.error || "Delete failed", "error");
          }
        } catch (err) {
          toast("Failed to delete user", "error");
          console.error(err);
        }
      }
    });
  
    editForm?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(editForm).entries());
      data.salary = parseFloat(data.salary) || 0;
  
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
    const movieList = document.getElementById("movie-table-body");
    const movieTitleInput = document.getElementById("movieTitle");
    const movieIdField = document.createElement("input");
    movieIdField.type = "hidden";
    movieIdField.name = "movie_id";
    addMovieForm?.appendChild(movieIdField);
  
    let allMovies = [];
  
    async function fetchMovies() {
      const res = await fetch("/api/movies/all");
      const data = await safeJson(res);
      allMovies = data || [];
  
      if (movieList) {
        movieList.innerHTML = allMovies.map(m => `
          <tr>
            <td>${m.title}</td>
            <td>${m.release_year}</td>
            <td>${m.rating}</td>
            <td>${m.price}</td>
            <td>
              <button class="btn btn-sm btn-primary fill-movie-btn" data-title="${m.title}">Edit</button>
              <button class="btn btn-sm btn-danger delete-movie-btn" data-id="${m.movie_id}">Delete</button>
            </td>
          </tr>`).join("");
      }
    }
  
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
      } else {
        movieIdField.value = "";
      }
    });
  
    addMovieForm?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(addMovieForm).entries());
      data.genre_ids = [...addMovieForm.querySelectorAll("[name='genre_ids[]']")].map(el => el.value);
  
      const url = data.movie_id ? "/api/update_movie" : "/api/add_movie";
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
  
      toast(data.movie_id ? "Movie updated" : "Movie added");
      addMovieForm.reset();
      movieIdField.value = "";
      fetchMovies();
    });
  
    document.addEventListener("click", async (e) => {
      const deleteBtn = e.target.closest(".delete-movie-btn");
      const editBtn = e.target.closest(".fill-movie-btn");
  
      if (deleteBtn) {
        const id = deleteBtn.dataset.id;
        if (!confirm("Are you sure you want to delete this movie?")) return;
        await fetch("/api/delete_movie", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ movie_id: id })
        });
        toast("Movie deleted");
        fetchMovies();
      }
  
      if (editBtn) {
        const title = editBtn.dataset.title.toLowerCase();
        const match = allMovies.find(m => m.title.toLowerCase() === title);
        if (match) {
          movieTitleInput.value = match.title;
          document.getElementById("movieYear").value = match.release_year || "";
          document.getElementById("movieRating").value = match.rating || "";
          document.getElementById("moviePrice").value = match.price || "";
          document.getElementById("movieImage").value = match.image_path || "";
          document.getElementById("movieDescription")?.value = match.description || "";
          document.getElementById("movieTrailer")?.value = match.trailer_url || "";
          movieIdField.value = match.movie_id;
        }
      }
    });
  
    searchBtn?.addEventListener("click", () => fetchUsers(searchInput?.value || ""));
    fetchUsers();
    fetchMovies();
  });
  