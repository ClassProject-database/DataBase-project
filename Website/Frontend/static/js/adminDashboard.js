document.addEventListener("DOMContentLoaded", () => {
  const toast = (msg, type = "success") => {
    const el = document.createElement("div");
    el.className = `toast text-white bg-${type === "error" ? "danger" : "success"} p-2 rounded position-fixed bottom-0 end-0 m-3`;
    el.innerText = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  };

  const safeJson = async res => JSON.parse(await res.text());
  const userTable = document.getElementById("user-table-body");
  const addUserForm = document.getElementById("add-user-form");
  const editUserModal = new bootstrap.Modal(document.getElementById("editUserModal"));
  const editForm = document.getElementById("edit-user-form");
  const searchBtn = document.getElementById("searchBtn");
  const searchInput = document.getElementById("searchUsers");

  const fetchUsers = async (query = "") => {
    const res = await fetch(`/api/search_users?query=${encodeURIComponent(query)}`);
    const users = await safeJson(res);
    userTable.innerHTML = "";

    if (!users.length) {
      userTable.innerHTML = `<tr><td colspan="6" class="text-center">No users found.</td></tr>`;
      return;
    }

    for (const u of users) {
      userTable.innerHTML += `
        <tr data-account-id="${u.account_id}">
          <td>${u.account_id}</td>
          <td>${u.username}</td>
          <td>${u.first_name} ${u.last_name}</td>
          <td>${u.email}</td>
          <td>${u.role}</td>
          <td>
            <a href="/admin/user/${u.account_id}" class="btn btn-sm btn-info">View</a>
            <button class="btn btn-sm btn-primary edit-user-btn" data-id="${u.account_id}">Edit</button>
            <button class="btn btn-sm btn-danger delete-user-btn" data-id="${u.account_id}">Delete</button>
          </td>
        </tr>`;
    }
  };

  if (addUserForm) {
    addUserForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const data = {
        username: addUserForm.username.value.trim(),
        password: addUserForm.password?.value?.trim(),
        first_name: addUserForm.first_name.value.trim(),
        last_name: addUserForm.last_name.value.trim(),
        email: addUserForm.email.value.trim(),
        phone: addUserForm.phone.value.trim(),
        role: addUserForm.role.value.trim()
      };

      await fetch("/api/add_user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      toast("User added");
      addUserForm.reset();
      fetchUsers();
    });
  }

  userTable.addEventListener("click", async (e) => {
    const id = e.target.dataset.id;
    if (!id) return;

    if (e.target.classList.contains("edit-user-btn")) {
      const res = await fetch(`/api/get_user?account_id=${id}`);
      const user = await safeJson(res);

      editForm.editUserId.value = user.account_id;
      editForm.editUsername.value = user.username;
      editForm.editFirstName.value = user.first_name;
      editForm.editLastName.value = user.last_name;
      editForm.editEmail.value = user.email;
      editForm.editPhone.value = user.phone;
      editForm.editRole.value = user.role;

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

      const data = {
        account_id: editForm.editUserId.value,
        username: editForm.editUsername.value.trim(),
        first_name: editForm.editFirstName.value.trim(),
        last_name: editForm.editLastName.value.trim(),
        email: editForm.editEmail.value.trim(),
        phone: editForm.editPhone.value.trim(),
        role: editForm.editRole.value
      };

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
});
