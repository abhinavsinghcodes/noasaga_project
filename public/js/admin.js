document.addEventListener('DOMContentLoaded', () => {
    const socket = io();

    // Load existing comments on page load
    socket.on('loadComments', function(comments) {
        const commentsList = document.getElementById('comments-list');
        commentsList.innerHTML = '';
        comments.forEach((comment) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <strong>${comment.name}</strong>: ${comment.text} <span class="timestamp">${comment.time}</span>
                <button class="remove-button" data-id="${comment.id}">Remove</button>
            `;
            commentsList.appendChild(li);
        });
    });

    // Handle refresh button click
    document.getElementById('refresh-button').addEventListener('click', function() {
        socket.emit('refreshComments');
    });

    // Handle remove all button click
    document.getElementById('remove-all-button').addEventListener('click', function() {
        socket.emit('removeAllComments');
    });

    // Handle removing individual comments
    document.getElementById('comments-list').addEventListener('click', function(event) {
        if (event.target.classList.contains('remove-button')) {
            const id = event.target.getAttribute('data-id');
            socket.emit('removeComment', id);
        }
    });

    // Handle updates from server
    socket.on('updateComments', function(comments) {
        const commentsList = document.getElementById('comments-list');
        commentsList.innerHTML = '';
        comments.forEach((comment) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <strong>${comment.name}</strong>: ${comment.text} <span class="timestamp">${comment.time}</span>
                <button class="remove-button" data-id="${comment.id}">Remove</button>
            `;
            commentsList.appendChild(li);
        });
    });

    // Request initial load of comments
    socket.emit('refreshComments');
});
