document.addEventListener('DOMContentLoaded', async () => {
    const commentsDiv = document.querySelector('.chats');
    const commentArea = document.getElementById('comment-area');
    const sendButton = document.getElementById('send-button');
    const clearNameButton = document.getElementById('clear-name-button');
    const postsDiv = document.querySelector('.posts-div');

    const socket = io();

    let badWords = [];

    // Load bad words from the server
    async function fetchBadWords() {
        try {
            const response = await fetch('/api/badwords');
            if (response.ok) {
                badWords = await response.json();
            } else {
                console.error('Failed to load bad words:', response.statusText);
            }
        } catch (error) {
            console.error('Error fetching bad words:', error);
        }
    }

    function containsBadWord(text) {
        return badWords.some(badWord => text.toLowerCase().includes(badWord));
    }

    function promptUserName() {
        let userName = prompt('Enter your name:');
        while (!userName || userName.length > 12 || containsBadWord(userName) || /[^a-zA-Z0-9]/.test(userName)) {
            if (!userName) {
                alert('Name is required to participate in the chat.');
            } else if (userName.length > 12) {
                alert('Name must be 12 characters or less.');
            } else if (containsBadWord(userName)) {
                alert('Name contains inappropriate language.');
            } else if (/[^a-zA-Z0-9]/.test(userName)) {
                alert('Name can only contain letters and numbers.');
            }
            userName = prompt('Enter your name:');
        }
        localStorage.setItem('userName', userName);
        return userName;
    }

    let userName = localStorage.getItem('userName');
    if (!userName) {
        userName = promptUserName();
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
            if (containsBadWord(comment)) {
                alert('Comment contains inappropriate language.');
                return;
            }
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

    await fetchBadWords(); // Ensure bad words are fetched before using containsBadWord
    loadPosts();
});
