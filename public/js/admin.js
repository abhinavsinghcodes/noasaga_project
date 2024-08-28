let countdownInterval = null;
let countdownEndTime = 0;
let blockDuration = 10000; // Start with 10 seconds (10,000 ms)

// Function to update the countdown timer display
function updateCountdown() {
    const now = Date.now();
    const remainingTime = Math.max(0, countdownEndTime - now);
    
    if (remainingTime > 0) {
        const seconds = Math.ceil(remainingTime / 1000);
        document.getElementById('countdown-timer').textContent = `Please wait ${seconds} seconds before trying again.`;
    } else {
        document.getElementById('countdown-timer').textContent = '';
        clearInterval(countdownInterval);
    }
}

// Function to handle the server's response
function handlePasswordResponse(response) {
    if (response.status === 429) { // Too Many Requests
        return response.json().then(data => {
            const now = Date.now();
            countdownEndTime = now + blockDuration;
            document.getElementById('error-message').textContent = data.message;
            if (countdownInterval) clearInterval(countdownInterval);
            countdownInterval = setInterval(updateCountdown, 1000);
            
            // Increase the block duration for next failed attempt
            blockDuration *= 10;
        });
    } else if (response.ok) { // Success
        document.querySelector('.login-form').style.display = 'none'; // Hide login form
        document.querySelector('.admin-panel').style.display = 'block'; // Show admin panel
        if (countdownInterval) clearInterval(countdownInterval);
        document.getElementById('countdown-timer').textContent = '';
        fetchPosts();
        fetchComments();
    } else { // Other errors
        response.json().then(data => {
            document.getElementById('error-message').textContent = data.message;
        });
    }
}

// Function to check the password
function checkPassword() {
    const password = document.getElementById('password').value;
    fetch('/api/check-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
    })
    .then(handlePasswordResponse);
}

// Event listener for the login button
document.getElementById('login-button').onclick = (event) => {
    event.preventDefault();
    if (countdownEndTime > Date.now()) { // Check if currently blocked
        document.getElementById('error-message').textContent = 'You are currently blocked from trying again.';
        return;
    }
    checkPassword();
};

function fetchPosts() {
    fetch('/api/postsfile')
        .then(response => response.json())
        .then(posts => {
            const postsContainer = document.getElementById('posts-container');
            postsContainer.innerHTML = ''; // Clear existing posts

            posts.forEach(post => {
                const postElement = document.createElement('div');
                postElement.className = 'post';

                const postHeader = document.createElement('h3');
                postHeader.textContent = post.title;

                const postContent = document.createElement('p');
                postContent.textContent = post.content;

                const deletePostButton = document.createElement('button');
                deletePostButton.textContent = 'Delete Post';
                deletePostButton.onclick = () => deletePost(post.id);

                postElement.appendChild(postHeader);
                postElement.appendChild(postContent);

                const repliesContainer = document.createElement('div');
                repliesContainer.className = 'replies-container';

                post.replies.forEach(reply => {
                    const replyElement = document.createElement('div');
                    replyElement.className = 'reply';

                    const replyContent = document.createElement('p');
                    replyContent.textContent = reply.content;

                    const deleteReplyButton = document.createElement('button');
                    deleteReplyButton.textContent = 'Delete Reply';
                    deleteReplyButton.onclick = () => deleteReply(post.id, reply.id);

                    replyElement.appendChild(replyContent);
                    replyElement.appendChild(deleteReplyButton);

                    repliesContainer.appendChild(replyElement);
                });

                postElement.appendChild(repliesContainer);
                postElement.appendChild(deletePostButton);
                postsContainer.appendChild(postElement);
            });
        });
}

function fetchComments() {
    fetch('/api/commentsfile')
        .then(response => response.json())
        .then(comments => {
            const commentsContainer = document.getElementById('comments-container');
            commentsContainer.innerHTML = ''; // Clear existing comments

            comments.forEach(comment => {
                const commentElement = document.createElement('div');
                commentElement.className = 'comment';

                const commentHeader = document.createElement('h4');
                commentHeader.textContent = `${comment.name} (${comment.time})`;

                const commentText = document.createElement('p');
                commentText.textContent = comment.text;

                const deleteCommentButton = document.createElement('button');
                deleteCommentButton.textContent = 'Delete Comment';
                deleteCommentButton.onclick = () => deleteComment(comment.id);

                commentElement.appendChild(commentHeader);
                commentElement.appendChild(commentText);
                commentElement.appendChild(deleteCommentButton);

                commentsContainer.appendChild(commentElement);
            });
        });
}

function deletePost(postId) {
    fetch(`/posts/${postId}`, { method: 'DELETE' })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            fetchPosts();
        });
}

function deleteReply(postId, replyId) {
    fetch(`/posts/${postId}/replies/${replyId}`, { method: 'DELETE' })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            fetchPosts();
        });
}

function deleteComment(commentId) {
    fetch(`/comments/${commentId}`, { method: 'DELETE' })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            fetchComments();
        });
}

document.getElementById('delete-all-posts').onclick = () => {
    if (confirm('Are you sure you want to delete all posts?')) {
        fetch('/posts', { method: 'DELETE' })
            .then(response => response.json())
            .then(data => {
                alert(data.message);
                fetchPosts();
            });
    }
};

document.getElementById('delete-all-comments').onclick = () => {
    if (confirm('Are you sure you want to delete all comments?')) {
        fetch('/comments', { method: 'DELETE' })
            .then(response => response.json())
            .then(data => {
                alert(data.message);
                fetchComments();
            });
    }
};
