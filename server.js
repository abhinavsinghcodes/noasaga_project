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

// Rate limiter setup
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
});

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.use(helmet());

// Apply rate limiter to all API routes
app.use('/api/', apiLimiter);

// File paths
const commentsFilePath = path.join(__dirname, 'comments.json');
const postsFilePath = path.join(__dirname, 'posts.json');
const topAnimeFilePath = path.join(__dirname, 'topAnime.json');
const badWordsFilePath = path.join(__dirname, 'bad-words.txt');

let lastFailedAttempt = 0; // Timestamp of the last failed attempt
let failAttempts = 0; // Number of failed attempts

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

// Rate limiting configuration
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again after 15 minutes"
});

app.set('trust proxy', true);


app.post('/check-password', (req, res) => {
    const { password } = req.body;
    const now = Date.now();

    // Check if the user is currently in the penalty period
    if (failAttempts > 0 && now < lastFailedAttempt + getDelay()) {
        const remainingTime = Math.ceil((lastFailedAttempt + getDelay() - now) / 1000);
        return res.status(429).json({ message: `Too many attempts. Please wait ${remainingTime} seconds.` });
    }

    bcrypt.compare(password, hashedPassword, (err, isMatch) => {
        if (err) {
            console.error('Error comparing password:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }

        if (isMatch) {
            failAttempts = 0; // Reset failed attempts on success
            return res.status(200).json({ message: 'Authenticated' });
        } else {
            lastFailedAttempt = now;
            failAttempts += 1; // Increment failed attempts
            return res.status(403).json({ message: 'Invalid password' });
        }
    });
});


// Serve admin.html
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/admin.html'));
});

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

// Fetch all posts
app.get('/api/posts', async (req, res) => {
    try {
        const posts = await readJSONFile(path.join(__dirname, 'public', 'posts.json'));
        res.json(posts);
    } catch (error) {
        res.status(500).send('Error reading posts');
    }
});

// Fetch all comments
app.get('/api/comments', async (req, res) => {
    try {
        const comments = await readJSONFile(path.join(__dirname, 'public', 'comments.json'));
        res.json(comments);
    } catch (error) {
        res.status(500).send('Error reading comments');
    }
});

// Fetch all replies
app.get('/api/replies', async (req, res) => {
    try {
        const replies = await readJSONFile(path.join(__dirname, 'public', 'replies.json'));
        res.json(replies);
    } catch (error) {
        res.status(500).send('Error reading replies');
    }
});

// Serve admin.html
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/admin.html'));
});

// Fetch all posts
app.get('/api/postsfile', (req, res) => {
    fs.readFile(postsFilePath, (err, data) => {
        if (err) throw err;
        res.json(JSON.parse(data));
    });
});

// Delete a specific post by ID
app.delete('/posts/:id', (req, res) => {
    const postId = req.params.id;

    fs.readFile('posts.json', (err, data) => {
        if (err) throw err;
        let posts = JSON.parse(data);

        posts = posts.filter(post => post.id !== postId);

        fs.writeFile('posts.json', JSON.stringify(posts, null, 2), err => {
            if (err) throw err;
            res.json({ message: 'Post deleted' });
        });
    });
});

// Delete a specific reply by post ID and reply ID
app.delete('/posts/:postId/replies/:replyId', (req, res) => {
    const { postId, replyId } = req.params;

    fs.readFile('posts.json', (err, data) => {
        if (err) throw err;
        let posts = JSON.parse(data);

        const post = posts.find(p => p.id === postId);
        if (post) {
            post.replies = post.replies.filter(reply => reply.id !== replyId);

            fs.writeFile('posts.json', JSON.stringify(posts, null, 2), err => {
                if (err) throw err;
                res.json({ message: 'Reply deleted' });
            });
        } else {
            res.status(404).json({ message: 'Post not found' });
        }
    });
});

// Delete all posts
app.delete('/posts', (req, res) => {
    fs.writeFile(postsFilePath, '[]', err => {
        if (err) throw err;
        res.json({ message: 'All posts deleted' });
    });
});

// Fetch all comments
app.get('/api/commentsfile', (req, res) => {
    fs.readFile(commentsFilePath, (err, data) => {
        if (err) throw err;
        res.json(JSON.parse(data));
    });
});

// Delete a specific comment by ID
app.delete('/comments/:id', (req, res) => {
    const commentId = req.params.id;

    fs.readFile('comments.json', (err, data) => {
        if (err) throw err;
        let comments = JSON.parse(data);

        comments = comments.filter(comment => comment.id !== commentId);

        fs.writeFile('comments.json', JSON.stringify(comments, null, 2), err => {
            if (err) throw err;
            res.json({ message: 'Comment deleted' });
        });
    });
});

app.use(limiter);

app.set('trust proxy', true);

// Password check route
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
