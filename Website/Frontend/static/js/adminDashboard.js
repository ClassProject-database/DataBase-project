document.addEventListener("DOMContentLoaded", () => {
  const showToast = (message, type = "success") => {
    const toast = document.createElement("div");
    toast.className = `toast text-white bg-${type === "error" ? "danger" : "success"} p-2 rounded position-fixed bottom-0 end-0 m-3`;
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const safeJson = async (res) => JSON.parse(await res.text());

  const fetchUsers = async (query = "") => {
    const res = await fetch(`/api/search_users?query=${encodeURIComponent(query)}`);
    const data = await safeJson(res);
    const table = document.getElementById("user-table-body");
    table.innerHTML = "";

    if (!data.length) {
      table.innerHTML = `<tr><td colspan="6" class="text-center">No users found.</td></tr>`;
      return;
    }

    for (const u of data) {
      table.innerHTML += `
        <tr data-account-id="${u.account_id}">
          <td>${u.account_id}</td>
          <td>${u.username}</td>
          <td>${u.first_name}</td>
          <td>${u.last_name}</td>
          <td>${u.phone}</td>
          <td>
            <button class="btn btn-sm btn-primary edit-user-btn" data-id="${u.account_id}">Edit</button>
            <button class="btn btn-sm btn-danger delete-user-btn" data-id="${u.account_id}">Delete</button>
          </td>
        </tr>`;
    }
  };

  const addUserForm = document.getElementById("add-user-form");
  if (addUserForm) {
    addUserForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = {
        username: addUserForm.username.value.trim(),
        first_name: addUserForm.first_name.value.trim(),
        last_name: addUserForm.last_name.value.trim(),
        phone: addUserForm.phone.value.trim(),
        role: addUserForm.role.value.trim(),
      };

      await fetch("/api/add_user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      showToast("User added");
      addUserForm.reset();
      fetchUsers();
    });
  }

  const editUserModal = new bootstrap.Modal(document.getElementById("editUserModal"));
  const editForm = document.getElementById("edit-user-form");

  document.getElementById("user-table-body").addEventListener("click", async (e) => {
    const id = e.target.dataset.id;

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
        body: JSON.stringify({ account_id: id }),
      });
      fetchUsers();
      showToast("User deleted");
    }
  });

  editForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
      account_id: editForm.editUserId.value,
      username: editForm.editUsername.value.trim(),
      first_name: editForm.editFirstName.value.trim(),
      last_name: editForm.editLastName.value.trim(),
      email: editForm.editEmail.value.trim(),
      phone: editForm.editPhone.value.trim(),
      role: editForm.editRole.value,
    };

    await fetch("/api/update_user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    editUserModal.hide();
    fetchUsers();
    showToast("User updated");
  });

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
        body: JSON.stringify(movie),
      });

      addMovieForm.reset();
      showToast("Movie added");
    });
  }

  document.getElementById("searchBtn")?.addEventListener("click", () => {
    const query = document.getElementById("searchUsers")?.value || "";
    fetchUsers(query);
  });

  fetchUsers();
});
