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
});

// Function to fetch top 5 anime from the server
async function fetchTopAnime() {
    try {
        const response = await fetch('/api/top-anime');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        console.log('Top anime data in client:', data); // Log data for debugging
        return data;
    } catch (error) {
        console.error('Error fetching top anime:', error);
    }
}

// Function to fetch anime details from the server
async function fetchAnimeDetails(animeId) {
    try {
        const response = await fetch(`/api/anime/${animeId}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        console.log('Anime details received:', data); // Log the details
        return data;
    } catch (error) {
        console.error('Error fetching anime details:', error);
        throw error; // Rethrow to be caught in the button click handler
    }
}

// Function to render list items and attach click events
async function renderListItems() {
    const topAnime = await fetchTopAnime();
    const listContainer = document.getElementById('lists1'); // Ensure this is a <ul> or <ol> element

    if (topAnime) {
        topAnime.forEach(anime => {
            console.log('Anime item in renderListItems:', anime); // Log each anime item

            const listItem = document.createElement('li');
            listItem.textContent = anime.title;
            listItem.dataset.id = anime.mal_id; // Use mal_id as anime ID

            listItem.addEventListener('click', () => {
                const animeId = listItem.dataset.id; // Retrieve ID from data attribute
                console.log('List item clicked, anime ID:', animeId); // Log the ID

                if (animeId) {
                    // Redirect to anime-info.html with anime ID as URL parameter
                    window.location.href = `anime-info.html?animeId=${animeId}`;
                } else {
                    console.error('Anime ID is undefined');
                }
            });

            listContainer.appendChild(listItem);
        });
    }
}

renderListItems();

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
