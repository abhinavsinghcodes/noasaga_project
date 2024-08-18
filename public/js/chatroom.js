document.addEventListener('DOMContentLoaded', () => {
    const commentsDiv = document.querySelector('.chats');
    const commentArea = document.getElementById('comment-area');
    const sendButton = document.getElementById('send-button');
    const clearNameButton = document.getElementById('clear-name-button');

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
});
