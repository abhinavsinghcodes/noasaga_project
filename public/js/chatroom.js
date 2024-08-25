document.addEventListener('DOMContentLoaded', () => {
    const commentsDiv = document.querySelector('.chats');
    const commentArea = document.getElementById('comment-area');
    const sendButton = document.getElementById('send-button');
    const clearNameButton = document.getElementById('clear-name-button');
    const postsDiv = document.querySelector('.posts-div'); // Ensure to use the correct class selector

    const socket = io();

    let userName = localStorage.getItem('userName');

    if (!userName) {
        userName = prompt('Enter your name:');
        if (userName) {
            localStorage.setItem('userName', userName);
        } else {
            alert('Name is required to participate in the chat.');
            return;
        }
    }

    function smoothScrollToBottom() {
        commentsDiv.scroll({
            top: commentsDiv.scrollHeight,
            behavior: 'smooth'
        });
    }

    function displayComment(name, time, text, isNew = false) {
        const commentElement = document.createElement('div');
        commentElement.className = 'comment';
        commentElement.innerHTML = `
            <div class="name-time">${name} ${time}</div>
            <div class="text">${text}</div>
        `;
        commentsDiv.appendChild(commentElement);

        if (isNew) {
            // Apply animation to the newest comment
            setTimeout(() => {
                commentElement.classList.add('fade-in');
                smoothScrollToBottom();
            }, 50); // Small delay to ensure animation visibility
        }
    }

    async function loadComments() {
        try {
            const response = await fetch('/api/comments');
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            const comments = await response.json();
            commentsDiv.innerHTML = '';
            comments.forEach(comment => displayComment(comment.name, comment.time, comment.text));
            smoothScrollToBottom();
        } catch (error) {
            console.error('Error loading comments:', error);
        }
    }

    sendButton.addEventListener('click', async () => {
        const comment = commentArea.value.trim();
        if (comment) {
            const time = new Date().toLocaleTimeString();
            try {
                const response = await fetch('/api/comments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: userName, time, text: comment })
                });
                if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                commentArea.value = '';
            } catch (error) {
                console.error('Error posting comment:', error);
            }
        } else {
            alert('Please enter a comment.');
        }
    });

    clearNameButton.addEventListener('click', () => {
        localStorage.removeItem('userName');
        location.reload();
    });

    socket.on('updateComments', (comments) => {
        commentsDiv.innerHTML = '';
        comments.forEach(comment => displayComment(comment.name, comment.time, comment.text));
        smoothScrollToBottom();
    });

    socket.on('newComment', (comment) => {
        displayComment(comment.name, comment.time, comment.text, true);
    });

    socket.emit('refreshComments');
    loadComments();

    // Fetch and display posts
    async function loadPosts() {
        try {
            const response = await fetch('/api/posts');
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            const posts = await response.json();
            postsDiv.innerHTML = '';
            posts.forEach(post => {
                const postElement = document.createElement('div');
                postElement.classList.add('post');

                // Format date
                const date = new Date(post.date);
                const formattedDate = date.toLocaleDateString();

                postElement.innerHTML = `
                    <h5>${post.name} <span>[${formattedDate}]</span></h5>
                    <h6>${post.title}</h6>
                    <p>${post.content}</p>
                    <h5>Replies:</h5>
                    <div class="reply-box">
                        <div id="replies-${post.id}">
                            ${post.replies.map(reply => `
                                <div class="reply">
                                    <h6>${reply.name}</h6>
                                    <p>${reply.content}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <hr>
                `;

                postsDiv.appendChild(postElement);
            });
        } catch (error) {
            console.error('Error loading posts:', error);
        }
    }

    loadPosts();
});
