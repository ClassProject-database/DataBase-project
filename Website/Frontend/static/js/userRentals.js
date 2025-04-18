document.addEventListener("DOMContentLoaded", () => {
    const toast = (msg, type = "success") => {
      const el = document.createElement("div");
      el.className = `toast text-white bg-${type === "error" ? "danger" : "success"} p-2 rounded position-fixed bottom-0 end-0 m-3 shadow`;
      el.style.zIndex = 9999;
      el.textContent = msg;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 3000);
    };
  
    const safeJson = async res => {
      try { return await res.json(); }
      catch (err) {
        console.error("safeJson failed:", err);
        return {};
      }
    };
  
    const rentalsTable = document.getElementById("rentalsTableBody");
    if (!rentalsTable) {
      console.warn("userRentals.js: #rentalsTableBody not found");
      return;
    }
  
    rentalsTable.addEventListener("click", async e => {
      const btn = e.target.closest(".return-rental-btn");
      if (!btn) return;
  
      const rentalId = btn.dataset.rentalId;
      const movieId  = btn.dataset.movieId;
      console.log("Return button clicked:", { rentalId, movieId });
      if (!rentalId || !movieId) {
        console.error("Missing data-rental-id or data-movie-id on button", btn);
        return;
      }
  
      try {
        const url = `/api/return_movie/${rentalId}/${movieId}`;
        console.log("Calling:", url);
        const res = await fetch(url, { method: "POST" });
        console.log("Fetch response status:", res.status);
        if (!res.ok) {
          const text = await res.text();
          console.error("Non‑OK response:", res.status, text);
          toast(`Error ${res.status}: ${text}`, "error");
          return;
        }
        const data = await safeJson(res);
        console.log("Payload:", data);
  
        if (!data.success) {
          toast(data.message || "Could not return movie.", "error");
          return;
        }
  
        // update the row:
        const row = btn.closest("tr");
        row.querySelector("td:nth-child(3)").textContent =
          new Date().toISOString().slice(0, 10);
  
        // replace button with ✔
        const check = document.createElement("span");
        check.className = "text-success";
        check.innerHTML = '<i class="fa fa-check"></i>';
        btn.replaceWith(check);
  
        toast("Movie returned!");
      } catch (err) {
        console.error("Request failed:", err);
        toast("Failed to communicate with server.", "error");
      }
    });
  });
  