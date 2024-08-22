const socket = io(); // Initialize Socket.IO

document.addEventListener('DOMContentLoaded', async () => {
    // Fetch and display comments
    try {
        const response = await fetch('/api/comments'); // Corrected endpoint
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const comments = await response.json();
        const part2 = document.getElementById('comment-box');
        part2.innerHTML = comments.map(comment => `
            <div class="comment">
                <p><strong>${comment.name}</strong> <em>${comment.time}</em></p>
                <p>${comment.text}</p>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error fetching comments:', error);
    }

    // Fetch and display top anime
    try {
        const response = await fetch('/api/top-anime'); // Corrected endpoint
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const topAnime = await response.json();
        const ol = document.getElementById('lists');
        ol.innerHTML = ''; // Clear existing list

        topAnime.forEach(anime => {
            const li = document.createElement('li');
            li.textContent = anime.title;
            li.onclick = () => {
                window.location.href = `anime-info.html?id=${anime.id}`;
            };
            ol.appendChild(li);
        });
    } catch (error) {
        console.error('Error fetching top anime:', error);
    }
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
