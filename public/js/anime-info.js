document.addEventListener('DOMContentLoaded', async () => {
    // Jikan API base URL
    const baseURL = 'https://api.jikan.moe/v4/anime/';

    // IDs of anime chosen by the host
    const animeIDs = [1]; // Example: 1 (Cowboy Bebop), 5114 (Fullmetal Alchemist: Brotherhood)

    // Fetch and display anime data
    for (let i = 0; i < animeIDs.length; i++) {
        const animeData = await fetchAnimeData(animeIDs[i]);
        if (animeData) {
            displayAnimeData(animeData, `anime${i + 1}`);
        } else {
            console.error(`Failed to fetch data for anime ID: ${animeIDs[i]}`);
        }
    }
});

// Function to fetch anime data from Jikan API
async function fetchAnimeData(animeID) {
    try {
        const response = await fetch(`https://api.jikan.moe/v4/anime/${animeID}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.data; // Access the "data" property from the response
    } catch (error) {
        console.error('Error fetching anime data:', error);
        return null; // Return null if there's an error
    }
}

// Function to display anime data in the HTML
function displayAnimeData(anime, elementID) {
    const container = document.getElementById(elementID);
    if (!anime) {
        container.innerHTML = 'Anime data could not be retrieved.';
        return;
    }

    const infoHTML = `
    <div class="anime-info">
    <h2>${anime.title || 'N/A'}</h2>
    <img src="${anime.images.jpg.image_url}" id="cover-image" alt="${anime.title} Poster">
            <p><strong>Score:</strong> ${anime.score || 'N/A'} </p>
            <p><strong>Episodes:</strong> ${anime.episodes || 'N/A'}</p>
            <p><strong>Status:</strong> ${anime.status || 'N/A'}</p>
            <p><strong>Aired:</strong> ${anime.aired ? anime.aired.string : 'N/A'}</p>
            <p><strong>Type:</strong> ${anime.type || 'N/A'}</p>
            <p><strong>Duration:</strong> ${anime.duration || 'N/A'}</p>
            <p><strong>Rating:</strong> ${anime.rating || 'N/A'}</p>
            <p><strong>Genres:</strong> ${anime.genres ? anime.genres.map(genre => genre.name).join(', ') : 'N/A'}</p>
            <p><strong>Studios:</strong> ${anime.studios ? anime.studios.map(studio => studio.name).join(', ') : 'N/A'}</p>
            <p><strong>Source:</strong> ${anime.source || 'N/A'}</p>
            <p><strong>Popularity:</strong> ${anime.popularity || 'N/A'}</p>
            <p><strong>Rank:</strong> ${anime.rank || 'N/A'}</p>
            <p><strong>Related Anime:</strong> ${anime.related && anime.related.anime ? anime.related.anime.map(rel => `<a href="${rel.url}" target="_blank">${rel.title}</a>`).join(', ') : 'N/A'}</p>
            <p><strong>Broadcast:</strong> ${anime.broadcast ? anime.broadcast.string : 'N/A'}</p>
            <p><strong>Producers:</strong> ${anime.producers ? anime.producers.map(producer => producer.name).join(', ') : 'N/A'}</p>
            <p><strong>Licensors:</strong> ${anime.licensors ? anime.licensors.map(licensor => licensor.name).join(', ') : 'N/A'}</p>
            </div>
            `;
            
            // Broadcast, Producers, Licensors, Background Info, Title in Other Languages
            const additionalInfoHTML = `
            <div class="anime-abt">
            <p><strong>Synopsis:</strong> ${anime.synopsis || 'N/A'} </p> <br>
            <p><strong>Background Info:</strong> ${anime.background || 'N/A'}</p>
        </div>
    `;

    container.innerHTML = infoHTML + additionalInfoHTML;
}
