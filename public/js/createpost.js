document.getElementById('postForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const name = document.getElementById('name').value;
    const title = document.getElementById('title').value;
    const content = document.getElementById('content').value;
    const date = new Date().toISOString(); // Current date in ISO format

    try {
        const response = await fetch('/api/posts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, title, content, date }),
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const result = await response.json();
        console.log('Post successfully created:', result);

        // Redirect to posts page
        window.location.href = 'posts.html';
    } catch (error) {
        console.error('Error creating post:', error);
        alert('Failed to upload post.');
    }
});
