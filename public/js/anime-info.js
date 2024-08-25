document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const animeId = params.get('animeId');

    console.log('URL parameters:', window.location.search); // Log entire query string
    console.log('Extracted animeId:', animeId); // Log extracted animeId

    if (animeId) {
        try {
            const response = await fetch(`/api/anime/${animeId}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            displayAnimeDetails(data);
        } catch (error) {
            console.error('Error fetching anime details:', error);
        }
    } else {
        console.error('Anime ID is missing from URL');
    }
});

function displayAnimeDetails(anime) {
    const detailsDiv = document.getElementById('anime-details');
    const infoHTML = `
    <div class="anime-info">
        <h2>${anime.title || 'N/A'}</h2>
        <img src="${anime.images.jpg.image_url}" id="cover-image" alt="${anime.title} Poster">
        <p><strong>Score:</strong> ${anime.score || 'N/A'}</p>
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
    
    // Additional information
    const additionalInfoHTML = `
    <div class="anime-abt">
        <p><strong>Synopsis:</strong> ${anime.synopsis || 'N/A'}</p><br>
        <p><strong>Background Info:</strong> ${anime.background || 'N/A'}</p>
    </div>
    `;

    detailsDiv.innerHTML = infoHTML + additionalInfoHTML;
}
