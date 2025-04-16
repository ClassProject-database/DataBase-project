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
  
    const userTable = document.getElementById("user-table-body");
    const addUserForm = document.getElementById("add-user-form");
    const editUserModal = new bootstrap.Modal(document.getElementById("editUserModal"));
    const editForm = document.getElementById("edit-user-form");
    const searchBtn = document.getElementById("searchBtn");
    const searchInput = document.getElementById("searchUsers");
    const editEmployeeFields = document.getElementById("edit-employee-fields");
  
    const roleEl = document.querySelector("[data-role]");
    const roleAttr = roleEl?.dataset.role?.toLowerCase() || "";
    const titleAttr = roleEl?.dataset.title?.toLowerCase() || "";
    const isManager = titleAttr === "manager";
    const isEmployee = roleAttr === "employee";
  
    const fetchUsers = async (query = "") => {
      const res = await fetch(`/api/search_users?query=${encodeURIComponent(query)}`);
      const users = await safeJson(res);
      userTable.innerHTML = users.length
        ? users.map(u => {
            const isCustomer = u.role === "customer";
            const canEditDelete = isManager || (isEmployee && isCustomer);
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
  
    userTable.addEventListener("click", async (e) => {
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
  
    if (editForm) {
      editForm.addEventListener("submit", async (e) => {
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
    }
  
    const addMovieForm = document.getElementById("add-movie-form");
    if (addMovieForm) {
      addMovieForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = new FormData(addMovieForm);
        const movie = {};
  
        for (const [key, value] of formData.entries()) {
          if (key.includes("genre_ids")) {
            movie.genre_ids = movie.genre_ids || [];
            movie.genre_ids.push(value);
          } else {
            movie[key] = value;
          }
        }
  
        await fetch("/api/add_movie", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(movie)
        });
  
        addMovieForm.reset();
        toast("Movie added");
      });
    }
  
    searchBtn?.addEventListener("click", () => {
      fetchUsers(searchInput?.value || "");
    });
  
    fetchUsers();
  
    const movieTitleInput = document.getElementById("movieTitle");
    let allMovies = [];
  
    fetch("/api/movies/all")
      .then(res => res.json())
      .then(data => {
        allMovies = data;
      });
  
    movieTitleInput?.addEventListener("input", () => {
      const val = movieTitleInput.value.toLowerCase();
      const matches = allMovies.filter(m => m.title.toLowerCase().includes(val));
      showMovieSuggestions(matches);
    });
  
    function showMovieSuggestions(matches) {
      let list = document.getElementById("movie-suggestions");
      if (!list) {
        list = document.createElement("ul");
        list.id = "movie-suggestions";
        list.className = "list-group position-absolute z-3 w-100 mt-1";
        movieTitleInput.parentNode.appendChild(list);
      }
  
      list.innerHTML = "";
      matches.slice(0, 5).forEach(movie => {
        const item = document.createElement("li");
        item.className = "list-group-item list-group-item-action";
        item.textContent = movie.title;
        item.onclick = () => {
          movieTitleInput.value = movie.title;
          list.innerHTML = "";
          document.getElementById("movieYear").value = movie.release_year || "";
          document.getElementById("movieRating").value = movie.rating || "";
          document.getElementById("moviePrice").value = movie.price || "";
          document.getElementById("movieImage").value = movie.image_path || "";
        };
        list.appendChild(item);
      });
    }
  });
  