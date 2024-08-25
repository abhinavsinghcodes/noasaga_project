document.getElementById("search-input").addEventListener("input", function() {
    const searchValue = this.value.toLowerCase();
    const items = document.querySelectorAll(".list-start .item");

    items.forEach(function(item) {
        const code = item.querySelector(".anime-code").textContent.toLowerCase();
        const name = item.querySelector(".anime-name").textContent.toLowerCase();

        if (code.includes(searchValue) || name.includes(searchValue)) {
            item.style.display = "flex";
        } else {
            item.style.display = "none";
        }
    });
});

document.querySelectorAll('.anime-name').forEach(container => {
    container.addEventListener('wheel', function(e) {
        e.preventDefault(); // Prevents default scrolling behavior
        this.scrollLeft += e.deltaY; // Scrolls horizontally based on vertical mouse wheel movement
    });
});

document.getElementById("anime-button").addEventListener("click", function() {
    const animeId = encodeURIComponent(this.getAttribute("data-anime-id"));
    window.location.href = `anime-info.html?animeId=${animeId}`;
});

