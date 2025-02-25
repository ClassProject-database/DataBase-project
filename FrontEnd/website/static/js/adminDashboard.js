document.addEventListener("DOMContentLoaded", function () {
    // ============================
    // 🔔 Toast Notification Helper
    // ============================
    function showToast(message, type = "success") {
        const toast = document.createElement("div");
        toast.classList.add("toast", type);
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add("show"), 100);
        setTimeout(() => {
            toast.classList.remove("show");
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // ✅ Fetch Helper (Handles Invalid JSON Errors)
    async function safeFetchJson(response) {
        try {
            const text = await response.text();
            return JSON.parse(text);
        } catch (e) {
            console.error("❌ Invalid JSON response:", text);
            return { success: false, error: "Invalid server response" };
        }
    }

    // ============================
    // ✅ Fetch & Display Users
    // ============================
    async function fetchUsers(searchQuery = "") {
        try {
            const response = await fetch(`/api/search_users?query=${encodeURIComponent(searchQuery)}`);

            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}`);
            }

            const users = await safeFetchJson(response);
            console.log("📩 Received Users Data:", users);

            const usersTable = document.getElementById("user-table-body");
            if (!usersTable) {
                console.error("❌ Error: 'user-table-body' not found.");
                return;
            }

            usersTable.innerHTML = ""; // Clear table before adding new rows
            if (users.length === 0) {
                usersTable.innerHTML = `<tr><td colspan="6" class="text-center">No users found</td></tr>`;
            } else {
                users.forEach(user => {
                    let row = document.createElement("tr");
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
            console.error("❌ Error fetching users:", error);
        }
    }

    // ============================
    // ✅ Add User Functionality
    // ============================
    const addUserForm = document.getElementById("add-user-form");
    if (addUserForm) {
        addUserForm.addEventListener("submit", async function (e) {
            e.preventDefault();

            let username = document.getElementById("username").value.trim();
            let firstName = document.getElementById("first_name").value.trim();
            let lastName = document.getElementById("last_name").value.trim();
            let phone = document.getElementById("phone").value.trim();
            let role = document.getElementById("role").value.trim() || "user";

            if (!username || !firstName || !lastName || !phone || !role) {
                showToast("❌ Please fill in all fields.", "error");
                return;
            }

            let userData = { username, first_name: firstName, last_name: lastName, phone, role };

            try {
                const response = await fetch("/api/add_user", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(userData)
                });

                const data = await safeFetchJson(response);
                if (data.success) {
                    showToast("✅ User added successfully!");
                    fetchUsers(); // Refresh table
                } else {
                    showToast("❌ Error: " + data.error, "error");
                }
            } catch (error) {
                console.error("❌ Fetch Error:", error);
                showToast("❌ Error adding user.", "error");
            }
        });
    }

    // ============================
    // ✏️ Edit User Functionality
    // ============================
    function editUser(accountId) {
        console.log(`Editing User ID: ${accountId}`);

        const row = document.querySelector(`tr[data-account-id="${accountId}"]`);
        if (!row) {
            console.error("❌ Error: Could not find row for user.");
            return;
        }

        document.getElementById("editCustomerId").value = accountId;
        document.getElementById("editUsername").value = row.children[1].innerText;
        document.getElementById("editFirstName").value = row.children[2].innerText;
        document.getElementById("editLastName").value = row.children[3].innerText;
        document.getElementById("editPhone").value = row.children[4].innerText;
        document.getElementById("editRole").value = row.children[5]?.innerText.trim().toLowerCase() || "user";

        document.getElementById("editUserModal").classList.add("show");
    }

    document.querySelector(".close-modal")?.addEventListener("click", () => {
        document.getElementById("editUserModal").classList.remove("show");
    });

    async function deleteUser(accountId) {
        try {
            const response = await fetch("/api/delete_user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ account_id: accountId })
            });

            const data = await safeFetchJson(response);
            if (data.success) {
                showToast("✅ User deleted successfully!");
                fetchUsers(); // Refresh user table
            } else {
                showToast("❌ Error deleting user: " + data.error, "error");
            }
        } catch (error) {
            console.error("❌ Fetch Error:", error);
            showToast("❌ Error deleting user.", "error");
        }
    }

    document.getElementById("user-table-body").addEventListener("click", function (event) {
        const target = event.target;
        const accountId = target.dataset.accountId;

        if (target.classList.contains("edit-user-btn")) {
            editUser(accountId);
        }

        if (target.classList.contains("delete-user-btn")) {
            if (confirm("Are you sure you want to delete this user?")) {
                deleteUser(accountId);
            }
        }
    });

    // ✅ Initial Fetch of Users
    fetchUsers();
});

        
    
        //
// ============================
// 🎬 Add Movie Functionality
// ============================
const addMovieForm = document.getElementById("add-movie-form");

if (addMovieForm) {
    addMovieForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const formData = new FormData(addMovieForm);
        let movieData = {};

        formData.forEach((value, key) => {
            if (key.endsWith("[]")) {
                let actualKey = key.slice(0, -2);
                if (!movieData[actualKey]) {
                    movieData[actualKey] = [];
                }
                movieData[actualKey].push(value);
            } else {
                movieData[key] = value;
            }
        });

        // ✅ Validate required fields
        if (!movieData.title || !movieData.year || !movieData.rating || !movieData.price || !movieData.genre_ids) {
            showToast("❌ Please fill in all required fields.", "error");
            return;
        }

        console.log("📤 Sending Movie Data:", movieData); // ✅ Debugging

        try {
            const response = await fetch("/api/add_movie", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(movieData)
            });

            const text = await response.text(); // ✅ Read raw response
            try {
                var data = JSON.parse(text); // ✅ Convert to JSON safely
            } catch (jsonError) {
                console.error("❌ JSON Parse Error:", jsonError, "\nResponse:", text);
                showToast("❌ Server error: Invalid response format.", "error");
                return;
            }

            console.log("📩 Response Data:", data); // ✅ Debugging

            if (data.success) {
                showToast("✅ Movie added successfully!");
                addMovieForm.reset(); // ✅ Reset only if successful
            } else {
                showToast("❌ Error adding movie: " + (data.error || "Unknown error"), "error");
            }
        } catch (error) {
            console.error("❌ Fetch Error:", error);
            showToast("❌ Error adding movie.", "error");
        }
    });
}
document.getElementById("user-table-body").addEventListener("click", function(event) {
    const target = event.target;
    const accountId = target.dataset.accountId;

    if (target.classList.contains("edit-user-btn")) {
        console.log(`Editing User ID: ${accountId}`);
        editUser(accountId);
    }

    if (target.classList.contains("delete-user-btn")) {
        if (confirm("Are you sure you want to delete this user?")) {
            deleteUser(accountId);
        }
    }
});
