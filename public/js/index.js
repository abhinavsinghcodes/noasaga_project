const socket = io(); // This should work if the CDN script is correctly included

document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/comments')
        .then(response => response.json())
        .then(comments => {
            const part2 = document.getElementById('comment-box');
            part2.innerHTML = comments.map(comment => `
                <div class="comment">
                    <p><strong>${comment.name}</strong> <em>${comment.time}</em></p>
                    <p>${comment.text}</p>
                </div>
            `).join('');
        })
        .catch(error => console.error('Error fetching comments:', error));
});

// Listen for real-time updates
socket.on('updateComments', (comments) => {
    const part2 = document.getElementById('comment-box');
    part2.innerHTML = comments.map(comment => `
        <div class="comment">
            <p><strong>${comment.name}</strong> <em>${comment.time}</em></p>
            <p>${comment.text}</p>
        </div>
    `).join('');
});
