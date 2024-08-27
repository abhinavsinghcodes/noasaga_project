document.addEventListener('DOMContentLoaded', async () => {
    let badWords = [];

    // Fetch bad words from the server
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

    // Function to check if text contains any bad words
    function containsBadWord(text) {
        return badWords.some(badWord => text.toLowerCase().includes(badWord));
    }

    document.getElementById('postForm').addEventListener('submit', async (event) => {
        event.preventDefault();

        const name = document.getElementById('name').value.trim();
        const title = document.getElementById('title').value.trim();
        const content = document.getElementById('content').value.trim();
        const date = new Date().toISOString(); // Current date in ISO format
        const idcode = await generateExpertPlusPostID(); // Ensure this is awaited

        // Validation Rules
        if (!name || !title || !content) {
            alert('All fields are required.');
            return;
        }

        if (title.length > 100) {
            alert('Title must be less than 100 characters.');
            return;
        }

        if (name.length > 12) {
            alert('Name must be less than 12 characters.');
            return;
        }

        if (content.length > 2000) {
            alert('Content must be less than 2000 characters.');
            return;
        }

        if (containsBadWord(name) || containsBadWord(title) || containsBadWord(content)) {
            alert('Your submission contains inappropriate language.');
            return;
        }

        try {
            const response = await fetch('/api/posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ idcode, name, title, content, date }),
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

    // Function to generate a random 7-digit ID
    async function generateExpertPlusPostID() {
        // Step 1: Generate a large cryptographically secure random byte array
        const randomBytes = new Uint8Array(64);
        window.crypto.getRandomValues(randomBytes);

        // Step 2: Hash the random bytes with SHA-256
        const encoder = new TextEncoder();
        const hash1 = await crypto.subtle.digest('SHA-256', randomBytes);

        // Step 3: Hash the result of SHA-256 with SHA-512 for additional complexity
        const hash2 = await crypto.subtle.digest('SHA-512', hash1);

        // Step 4: Encrypt the hash result with AES-GCM for additional security
        const key = await crypto.subtle.generateKey(
            { name: 'AES-GCM', length: 256 },
            true,
            ['encrypt', 'decrypt']
        );

        const iv = window.crypto.getRandomValues(new Uint8Array(12)); // Initialization Vector
        const encryptedHash = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            hash2
        );

        // Step 5: Convert the encrypted result to a hexadecimal string
        const encryptedHashArray = Array.from(new Uint8Array(encryptedHash));
        const encryptedHashHex = encryptedHashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        // Step 6: Extract a 7-digit number from the hexadecimal string
        const numericValue = parseInt(encryptedHashHex.slice(0, 14), 16); // Use 14 hex digits for better range
        const postID = (numericValue % 9000000) + 1000000;

        return postID;
    }

    await fetchBadWords(); // Ensure bad words are fetched before using containsBadWord
});
