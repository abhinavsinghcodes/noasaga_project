document.addEventListener('DOMContentLoaded', () => {
    const postsContainer = document.getElementById('postsContainer');
    const searchBar = document.getElementById('search-bar'); // Updated id to match HTML
    let allPosts = []; // To store all posts data

    // Fetch posts from posts.json
    function fetchPosts() {
        fetch('/api/posts')
            .then(response => response.json())
            .then(posts => {
                allPosts = posts; // Store fetched posts
                displayPosts(posts); // Display all posts initially
            })
            .catch(error => console.error('Error:', error));
    }

    // Function to display posts
    function displayPosts(posts) {
        postsContainer.innerHTML = ''; // Clear existing content
        posts.forEach(post => {
            const postElement = document.createElement('div');
            postElement.classList.add('post');

            // Format the date
            const date = new Date(post.date);
            const formattedDate = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            postElement.innerHTML = `
                <h5>${post.name} <span>[${formattedDate}]</span></h5>
                <h6>${post.title}</h6>
                <p>${post.content}</p>
                <h5>Replies:</h5>
                <div class="reply-box">
                    <div id="replies-${post.id}"></div>
                </div>
                <form class="replyform1" id="replyForm-${post.id}">
                    <input type="text" name="replyName" placeholder="Your Name" required>
                    <textarea name="replyContent" placeholder="Your Reply" required></textarea>
                    <button id="button-reply" type="submit">Reply</button>
                </form>
                <hr>
            `;
            postsContainer.appendChild(postElement);

            // Handle reply form submission
            const replyForm = document.getElementById(`replyForm-${post.id}`);
            replyForm.addEventListener('submit', event => {
                event.preventDefault();
                const formData = new FormData(replyForm);
                const replyData = {
                    postId: post.id,
                    name: formData.get('replyName'),
                    content: formData.get('replyContent')
                };
                fetch('/api/replies', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(replyData)
                })
                .then(response => response.json())
                .then(reply => {
                    // Append new reply
                    const repliesDiv = document.getElementById(`replies-${post.id}`);
                    const replyElement = document.createElement('div');
                    replyElement.classList.add('reply');
                    replyElement.innerHTML = `
                        <strong>${reply.name}</strong>: ${reply.content}
                    `;
                    repliesDiv.appendChild(replyElement);
                    replyForm.reset(); // Reset form after submission
                })
                .catch(error => console.error('Error:', error));
            });

            // Fetch and display replies
            fetchReplies(post.id);
        });
    }

    // Fetch replies for a specific post
    function fetchReplies(postId) {
        fetch(`/api/replies?postId=${postId}`)
            .then(response => response.json())
            .then(replies => {
                const repliesDiv = document.getElementById(`replies-${postId}`);
                repliesDiv.innerHTML = ''; // Clear existing replies
                replies.forEach(reply => {
                    const replyElement = document.createElement('div');
                    replyElement.classList.add('reply');
                    replyElement.innerHTML = `
                        <strong>${reply.name}</strong>: ${reply.content}
                    `;
                    repliesDiv.appendChild(replyElement);
                });
            })
            .catch(error => console.error('Error:', error));
    }

    // Filter and display posts based on search query
    searchBar.addEventListener('input', () => {
        const query = searchBar.value.toLowerCase();
        const filteredPosts = allPosts.filter(post => 
            post.title.toLowerCase().includes(query) || 
            post.content.toLowerCase().includes(query)
        );
        displayPosts(filteredPosts);
    });

    // Initially fetch and display all posts
    fetchPosts();
});
