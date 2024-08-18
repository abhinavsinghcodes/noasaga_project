document.addEventListener('DOMContentLoaded', () => {
    const postsContainer = document.getElementById('postsContainer');

    function fetchPosts() {
        fetch('/api/posts')
            .then(response => response.json())
            .then(posts => {
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
                        <button id="button-reply" type="submit">Reply</button>
                        <form class="replyform1" id="replyForm-${post.id}">
                            <input type="text" name="replyName" placeholder="Your Name" required>
                            <textarea name="replyContent" placeholder="Your Reply" required></textarea>
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
                        })
                        .catch(error => console.error('Error:', error));
                    });

                    // Fetch and display replies
                    fetchReplies(post.id);
                });
            })
            .catch(error => console.error('Error:', error));
    }

    function fetchReplies(postId) {
        fetch('/api/posts')
            .then(response => response.json())
            .then(posts => {
                const post = posts.find(p => p.id === postId);
                if (post) {
                    const repliesDiv = document.getElementById(`replies-${postId}`);
                    repliesDiv.innerHTML = ''; // Clear existing replies
                    post.replies.forEach(reply => {
                        const replyElement = document.createElement('div');
                        replyElement.classList.add('reply');
                        replyElement.innerHTML = `
                            <strong>${reply.name}</strong>: ${reply.content}
                        `;
                        repliesDiv.appendChild(replyElement);
                    });
                }
            })
            .catch(error => console.error('Error:', error));
    }

    fetchPosts();
});
