document.addEventListener("DOMContentLoaded", () => {
  console.log("Admin dashboard loaded!");

  //  Toast Notification Helper 
  const showToast = (message, type = "success") => {
    const toast = document.createElement("div");
    toast.classList.add("toast", type);
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add("show"), 100);
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  };

  //  Safe Fetch JSON Helper 
  const safeFetchJson = async (response) => {
    try {
      const text = await response.text();
      return JSON.parse(text);
    } catch (error) {
      console.error("Invalid JSON response:", error);
      return { success: false, error: "Invalid server response" };
    }
  };

  //  Serialize Form Helper 
  const serializeForm = (form) => {
    const obj = {};
    new FormData(form).forEach((value, key) => {
      obj[key] = value;
    });
    return obj;
  };

  //  Fetch & Display Users 
  const fetchUsers = async (searchQuery = "") => {
    try {
      const response = await fetch(`/api/search_users?query=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      const users = await safeFetchJson(response);
      console.log("Received Users Data:", users);

      const usersTable = document.getElementById("user-table-body");
      if (!usersTable) {
        console.error("Error: 'user-table-body' not found.");
        return;
      }

      usersTable.innerHTML = "";
      if (!users.length) {
        usersTable.innerHTML = `<tr><td colspan="6" class="text-center">No users found</td></tr>`;
      } else {
        users.forEach((user) => {
          const row = document.createElement("tr");
          row.setAttribute("data-account-id", user.account_id);
          row.innerHTML = `
            <td>${user.account_id}</td>
            <td>${user.username}</td>
            <td>${user.first_name}</td>
            <td>${user.last_name}</td>
            <td>${user.phone}</td>
            <td>
              <button class="btn btn-sm btn-primary edit-user-btn" data-account-id="${user.account_id}">Edit</button>
              <a href="/admin/user/${user.account_id}" class="btn btn-sm btn-info">View</a>
              <button class="btn btn-sm btn-danger delete-user-btn" data-account-id="${user.account_id}">Delete</button>
            </td>
          `;
          usersTable.appendChild(row);
        });
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      showToast(`Error fetching users: ${error.message}`, "error");
    }
  };

  //  Add User 
  const addUserForm = document.getElementById("add-user-form");
  if (addUserForm) {
    addUserForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = document.getElementById("username").value.trim();
      const firstName = document.getElementById("first_name").value.trim();
      const lastName = document.getElementById("last_name").value.trim();
      const phone = document.getElementById("phone").value.trim();
      const role = document.getElementById("role").value.trim() || "user";

      if (!username || !firstName || !lastName || !phone || !role) {
        showToast("Please fill in all fields.", "error");
        return;
      }

      const userData = { username, first_name: firstName, last_name: lastName, phone, role };

      try {
        const response = await fetch("/api/add_user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userData),
        });
        const data = await safeFetchJson(response);
        if (data.success) {
          showToast("User added successfully!");
          fetchUsers();
        } else {
          showToast(`Error: ${data.error}`, "error");
        }
      } catch (error) {
        console.error("Fetch Error:", error);
        showToast("Error adding user.", "error");
      }
    });
  }

  //  Bootstrap Modal
  const editUserModalElem = document.getElementById("editUserModal");

  const editModalInstance = new bootstrap.Modal(editUserModalElem);

  //  Edit User  
  const editUser = async (accountId) => {
    console.log(`Editing User ID: ${accountId}`);
    try {
      const response = await fetch(`/api/get_user?account_id=${encodeURIComponent(accountId)}`);
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      const user = await safeFetchJson(response);
      console.log("Received User Data:", user);

      // Populate  fields
      document.getElementById("editCustomerId").value = user.account_id;
      document.getElementById("editUsername").value = user.username;
      document.getElementById("editFirstName").value = user.first_name;
      document.getElementById("editLastName").value = user.last_name;
      document.getElementById("editPhone").value = user.phone;
      const roleCell = (user.role || "").trim().toLowerCase();
      document.getElementById("editRole").value = ["user", "admin"].includes(roleCell) ? roleCell : "user";

    
      editModalInstance.show();
    } catch (error) {
      console.error("Error fetching user:", error);
      showToast("Error loading user data.", "error");
    }
  };

  //  Save Changes 
const editUserForm = document.getElementById("edit-user-form");

if (editUserForm) {
  editUserForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    

    console.log("Raw FormData:", [...new FormData(editUserForm)]);
    
    const userData = serializeForm(editUserForm);
    console.log("Serialized form data:", userData);

    if (!userData.customer_id || !userData.username || !userData.first_name || !userData.last_name || !userData.phone || !userData.role) {
      showToast("Please fill in all required fields.", "error");
      return;
    }

    try {
      const response = await fetch("/api/update_user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account_id: userData.customer_id,
          username: userData.username,
          first_name: userData.first_name,
          last_name: userData.last_name,
          phone: userData.phone,
          role: userData.role,
        }),
      });

      const data = await safeFetchJson(response);
      if (data.success) {
        showToast("User updated successfully!");
        editModalInstance.hide();
        fetchUsers();
      } else {
        showToast(`Error updating user: ${data.error}`, "error");
      }
    } catch (err) {
      console.error("Error updating user:", err);
      showToast("Error updating user.", "error");
    }
  });
}


  //  Delete User 
  const deleteUser = async (accountId) => {
    if (!accountId) {
      console.error("Error: Missing account_id before sending request");
      return;
    }
    console.log("Sending account_id:", accountId);

    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      const response = await fetch("/api/delete_user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account_id: accountId }),
      });
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      const data = await safeFetchJson(response);
      console.log("Received Response:", data);
      if (data.success) {
        showToast("User deleted successfully!");
        fetchUsers();
      } else {
        throw new Error(data.error || "Unknown error occurred");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      showToast(`Error: ${error.message}`, "error");
    }
  };

  const userTableBody = document.getElementById("user-table-body");
  if (userTableBody) {
    userTableBody.addEventListener("click", (event) => {
      const target = event.target;
      const accountId = target.dataset.accountId;
      if (target.classList.contains("edit-user-btn")) {
        editUser(accountId);
      } else if (target.classList.contains("delete-user-btn")) {
        deleteUser(accountId);
      }
    });
  }

  //  Initial Fetch of Users 
  fetchUsers();

  //  Add Movie Functionality 
  const addMovieForm = document.getElementById("add-movie-form");
  if (addMovieForm) {
    addMovieForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = new FormData(addMovieForm);
      const movieData = {};
      formData.forEach((value, key) => {
        if (key.endsWith("[]")) {
          const actualKey = key.slice(0, -2);
          if (!movieData[actualKey]) {
            movieData[actualKey] = [];
          }
          movieData[actualKey].push(value);
        } else {
          movieData[key] = value;
        }
      });

      if (!movieData.title || !movieData.year || !movieData.rating || !movieData.price || !movieData.genre_ids) {
        showToast("Please fill in all required fields.", "error");
        return;
      }

      console.log("Sending Movie Data:", movieData);

      try {
        const response = await fetch("/api/add_movie", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(movieData),
        });
        const data = await safeFetchJson(response);
        console.log("Response Data:", data);
        if (data.success) {
          showToast("Movie added successfully!");
          addMovieForm.reset();
        } else {
          showToast(`Error adding movie: ${data.error || "Unknown error"}`, "error");
        }
      } catch (error) {
        console.error("Fetch Error:", error);
        showToast("Error adding movie.", "error");
      }
    });
  }
});
