const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3000;
const server = http.createServer(app);
const io = socketIo(server);

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

const commentsFilePath = path.join(__dirname, 'comments.json');
const postsFilePath = path.join(__dirname, 'posts.json');
const topAnimeFilePath = path.join(__dirname, 'topAnime.json');

function loadComments() {
    try {
        const data = fs.readFileSync(commentsFilePath);
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading comments:', error);
        return [];
    }
}

function saveComments(comments) {
    try {
        fs.writeFileSync(commentsFilePath, JSON.stringify(comments, null, 2));
    } catch (error) {
        console.error('Error saving comments:', error);
    }
}

function saveTopAnime(topAnime) {
    try {
        fs.writeFileSync(topAnimeFilePath, JSON.stringify(topAnime, null, 2));
    } catch (error) {
        console.error('Error saving top anime:', error);
    }
}

function loadPosts() {
    try {
        const data = fs.readFileSync(postsFilePath);
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading posts:', error);
        return [];
    }
}

function savePosts(posts) {
    try {
        fs.writeFileSync(postsFilePath, JSON.stringify(posts, null, 2));
    } catch (error) {
        console.error('Error saving posts:', error);
    }
}

async function fetchAndSaveTopAnime() {
    try {
        const { default: fetch } = await import('node-fetch');
        const response = await fetch('https://api.jikan.moe/v4/top/anime');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        console.log('Fetched data:', data); // Check if data is fetched correctly
        const top5Anime = data.data.slice(0, 5).map(anime => ({
            id: anime.mal_id,
            title: anime.title
        }));
        saveTopAnime(top5Anime);
        console.log('Top 5 anime saved to topAnime.json');
    } catch (error) {
        console.error('Error fetching top anime:', error);
    }
}

app.get('/api/comments', (req, res) => {
    res.json(loadComments());
});

app.post('/api/comments', (req, res) => {
    const { name, time, text } = req.body;
    if (!name || !time || !text) {
        return res.status(400).json({ error: 'Invalid comment data' });
    }
    const comments = loadComments();
    const newComment = { id: uuidv4(), name, time, text };
    comments.push(newComment);
    saveComments(comments);
    io.emit('updateComments', comments);
    res.json(newComment);
});

app.get('/api/posts', (req, res) => {
    res.json(loadPosts());
});

app.post('/api/posts', (req, res) => {
    const { name, date, title, content } = req.body;
    if (!name || !date || !title || !content) {
        return res.status(400).json({ error: 'Invalid post data' });
    }
    const posts = loadPosts();
    const newPost = { id: uuidv4(), name, date, title, content, replies: [] };
    posts.push(newPost);
    savePosts(posts);
    io.emit('updatePosts', posts);
    res.json(newPost);
});

app.post('/api/replies', (req, res) => {
    const { postId, name, content } = req.body;
    if (!postId || !name || !content) {
        return res.status(400).json({ error: 'Invalid reply data' });
    }
    const posts = loadPosts();
    const post = posts.find(p => p.id === postId);
    if (!post) {
        return res.status(404).json({ error: 'Post not found' });
    }
    const newReply = { id: uuidv4(), name, content };
    post.replies.push(newReply);
    savePosts(posts);
    io.emit('updatePosts', posts);
    res.json(newReply);
});

// Endpoint to get top 5 anime
app.get('/api/top-anime', async (req, res) => {
    try {
        const response = await axios.get('https://api.jikan.moe/v4/top/anime');
        const topAnime = response.data.data.slice(0, 5); // Get top 5 anime
        res.json(topAnime);
    } catch (error) {
        console.error('Error fetching top anime:', error);
        res.status(500).send('Error fetching top anime');
    }
});

// Example using Express.js
app.get('/api/anime/:animeId', async (req, res) => {
    const { animeId } = req.params;
    try {
        const response = await axios.get(`https://api.jikan.moe/v4/anime/${animeId}`);
        const animeDetails = response.data.data;
        res.json(animeDetails);
    } catch (error) {
        console.error('Error fetching anime details:', error);
        res.status(500).send('Error fetching anime details');
    }
});

io.on('connection', (socket) => {
    console.log('A user connected');
    socket.emit('updateComments', loadComments());
    socket.emit('updatePosts', loadPosts());

    socket.on('refreshComments', () => {
        socket.emit('updateComments', loadComments());
    });

    socket.on('refreshPosts', () => {
        socket.emit('updatePosts', loadPosts());
    });

    socket.on('removeComment', (id) => {
        let comments = loadComments();
        comments = comments.filter(comment => comment.id !== id);
        saveComments(comments);
        io.emit('updateComments', comments);
    });

    socket.on('removeAllComments', () => {
        saveComments([]);
        io.emit('updateComments', []);
    });

    socket.on('removePost', (id) => {
        let posts = loadPosts();
        posts = posts.filter(post => post.id !== id);
        savePosts(posts);
        io.emit('updatePosts', posts);
    });

    socket.on('removeAllPosts', () => {
        savePosts([]);
        io.emit('updatePosts', []);
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
