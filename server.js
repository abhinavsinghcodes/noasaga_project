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
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const server = http.createServer(app);
const io = socketIo(server);

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.use(helmet());

// Set 'trust proxy' to true for rate limiting
app.set('trust proxy', true);

// Rate limiting
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false,  // Disable the `X-RateLimit-*` headers
});

app.use('/api/', apiLimiter);

// File paths
const commentsFilePath = path.join(__dirname, 'comments.json');
const postsFilePath = path.join(__dirname, 'posts.json');
const topAnimeFilePath = path.join(__dirname, 'topAnime.json');
const badWordsFilePath = path.join(__dirname, 'bad-words.txt');

// Helper function to calculate delay in milliseconds
function getDelay() {
    const baseDelay = 10000; // Initial delay of 10 seconds
    return baseDelay * Math.pow(10, failAttempts); // Increase delay exponentially
}

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
app.post('/api/check-password', (req, res) => {
    try {
        const { password } = req.body;

        // Fetch the hashed password from environment variables or any other secure storage
        const hashedPassword = process.env.ADMIN_PASSWORD_HASH;

        if (!hashedPassword) {
            return res.status(500).json({ message: 'Server misconfiguration: hashed password not set' });
        }

        if (bcrypt.compareSync(password, hashedPassword)) {
            return res.status(200).json({ message: 'Authenticated' });
        } else {
            return res.status(403).json({ message: 'Invalid password' });
        }
    } catch (error) {
        console.error('Error in /api/check-password:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/admin.html'));
});

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

app.get('/api/badwords', (req, res) => {
    const badWords = loadBadWords();
    res.json(badWords);
});

// Fetch all posts
app.get('/api/postsfile', (req, res) => {
    fs.readFile(postsFilePath, (err, data) => {
        if (err) {
            console.error('Error reading posts file:', err);
            return res.status(500).send('Error reading posts file');
        }
        res.json(JSON.parse(data));
    });
});

// Delete a specific post by ID
app.delete('/posts/:id', (req, res) => {
    const postId = req.params.id;

    fs.readFile(postsFilePath, (err, data) => {
        if (err) {
            console.error('Error reading posts file:', err);
            return res.status(500).send('Error reading posts file');
        }
        let posts = JSON.parse(data);

        posts = posts.filter(post => post.id !== postId);

        fs.writeFile(postsFilePath, JSON.stringify(posts, null, 2), err => {
            if (err) {
                console.error('Error writing posts file:', err);
                return res.status(500).send('Error writing posts file');
            }
            res.json({ message: 'Post deleted' });
        });
    });
});

// Delete a specific reply by ID
app.delete('/posts/:postId/replies/:replyId', (req, res) => {
    const { postId, replyId } = req.params;

    fs.readFile(postsFilePath, (err, data) => {
        if (err) {
            console.error('Error reading posts file:', err);
            return res.status(500).send('Error reading posts file');
        }
        let posts = JSON.parse(data);

        const post = posts.find(p => p.id === postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        post.replies = post.replies.filter(reply => reply.id !== replyId);

        fs.writeFile(postsFilePath, JSON.stringify(posts, null, 2), err => {
            if (err) {
                console.error('Error writing posts file:', err);
                return res.status(500).send('Error writing posts file');
            }
            res.json({ message: 'Reply deleted' });
        });
    });
});

// Delete all posts
app.delete('/posts', (req, res) => {
    fs.writeFile(postsFilePath, JSON.stringify([], null, 2), err => {
        if (err) {
            console.error('Error deleting all posts:', err);
            return res.status(500).send('Error deleting all posts');
        }
        res.json({ message: 'All posts deleted' });
    });
});

// Handle 404 - Not Found
app.use((req, res, next) => {
    res.status(404).send('404 - Not Found');
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('500 - Internal Server Error');
});

server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
