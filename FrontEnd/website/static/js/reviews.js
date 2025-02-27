document.addEventListener("DOMContentLoaded", () => {
    console.log(" Reviews page loaded!");

    const commentModal = new bootstrap.Modal(document.getElementById("commentModal"));

    //  Open Comment Modal
    document.querySelectorAll(".comment-btn").forEach(button => {
        button.addEventListener("click", function () {
            const reviewId = this.getAttribute("data-review-id");
            document.getElementById("currentReviewId").value = reviewId;
            document.getElementById("commentText").value = "";
            commentModal.show();
        });
    });

    //  Toggle Comments Section 
    document.querySelectorAll(".view-comments-btn").forEach(button => {
        button.addEventListener("click", async function () {
            const reviewId = this.getAttribute("data-review-id");
            const commentsContainer = document.getElementById(`comments-${reviewId}`);

            if (!commentsContainer) {
                console.error(" Comments container not found!");
                return;
            }

            if (commentsContainer.innerHTML.trim() === "") {
                await loadComments(reviewId); //  Load comments only if empty
            }

            //  Toggle Visibility
            if (commentsContainer.classList.contains("d-none")) {
                commentsContainer.classList.remove("d-none");
                this.innerHTML = "🔼 Hide Comments";
            } else {
                commentsContainer.classList.add("d-none");
                this.innerHTML = "🔽 View Comments";
            }
        });
    });

    //  Post Comment via AJAX
    document.getElementById("postCommentBtn").addEventListener("click", async () => {
        const reviewId = document.getElementById("currentReviewId").value;
        const commentText = document.getElementById("commentText").value.trim();

        if (!commentText) {
            showToast("⚠️ Comment cannot be empty!", "warning");
            return;
        }

        try {
            const response = await fetch("/api/post_comment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ review_id: reviewId, comment: commentText })
            });

            const data = await response.json();

            if (data.success) {
                showToast(" Comment posted!");
                document.getElementById("commentText").value = ""; //  Clear input
                await loadComments(reviewId);
                commentModal.hide(); //  Close modal 
            } else {
                showToast(" Error posting comment.", "error");
            }
        } catch (error) {
            console.error(" Error posting comment:", error);
            showToast(" Could not post comment. Try again.", "error");
        }
    });

    //  Load Comments Function 
    async function loadComments(reviewId) {
        try {
            const response = await fetch(`/api/comments/${reviewId}`);
            if (!response.ok) throw new Error("Failed to load comments");

            const comments = await response.json();
            const commentsContainer = document.getElementById(`comments-${reviewId}`);

            if (!commentsContainer) return;
            
            commentsContainer.innerHTML = comments.length === 0 
                ? `<p class="text-muted">No comments yet.</p>` 
                : comments.map(comment => `
                    <div class="comment border-bottom py-2">
                        <p><strong>${comment.username}</strong>: ${comment.text}</p>
                        <small class="text-muted">${comment.timestamp}</small>
                    </div>
                `).join("");
        } catch (error) {
            console.error(" Error loading comments:", error);
        }
    }

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
});
