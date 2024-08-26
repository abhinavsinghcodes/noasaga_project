const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const axios = require('axios');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { check, validationResult } = require('express-validator');

const app = express();
const port = process.env.PORT || 3000;
const server = http.createServer(app);
const io = socketIo(server);

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.use(helmet());

// Rate limiting
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', apiLimiter);

// File paths
const commentsFilePath = path.join(__dirname, 'comments.json');
const postsFilePath = path.join(__dirname, 'posts.json');
const topAnimeFilePath = path.join(__dirname, 'topAnime.json');
const badWordsFilePath = path.join(__dirname, 'bad-words.txt');

// Load and save functions
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

function saveTopAnime(topAnime) {
    try {
        fs.writeFileSync(topAnimeFilePath, JSON.stringify(topAnime, null, 2));
    } catch (error) {
        console.error('Error saving top anime:', error);
    }
}

// Function to read bad words from the file
function loadBadWords() {
    return fs.readFileSync(badWordsFilePath, 'utf-8')
        .split('\n')
        .map(word => word.trim())
        .filter(word => word.length > 0);
}

// API routes
app.get('/api/comments', (req, res) => {
    res.json(loadComments());
});

app.post('/api/comments', [
    check('name').notEmpty().withMessage('Name is required'),
    check('time').notEmpty().withMessage('Time is required'),
    check('text').notEmpty().withMessage('Text is required')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { name, time, text } = req.body;
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

app.post('/api/posts', [
    check('name').notEmpty().withMessage('Name is required'),
    check('date').notEmpty().withMessage('Date is required'),
    check('title').notEmpty().withMessage('Title is required'),
    check('content').notEmpty().withMessage('Content is required')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { name, date, title, content } = req.body;
    const posts = loadPosts();
    const newPost = { id: uuidv4(), name, date, title, content, replies: [] };
    posts.push(newPost);
    savePosts(posts);
    io.emit('updatePosts', posts);
    res.json(newPost);
});

app.post('/api/replies', [
    check('postId').notEmpty().withMessage('Post ID is required'),
    check('name').notEmpty().withMessage('Name is required'),
    check('content').notEmpty().withMessage('Content is required')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { postId, name, content } = req.body;
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

app.get('/api/top-anime', async (req, res) => {
    try {
        const response = await axios.get('https://api.jikan.moe/v4/top/anime');
        const topAnime = response.data.data.slice(0, 20);
        res.json(topAnime);
    } catch (error) {
        console.error('Error fetching top anime:', error);
        res.status(500).send('Error fetching top anime');
    }
});

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

// Serve the bad words list to the frontend
app.get('/api/badwords', (req, res) => {
    const badWords = loadBadWords();
    res.json(badWords);
});

// Socket.IO
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
