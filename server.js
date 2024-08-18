const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors'); // Import cors

const app = express();
const port = 3000;
const server = http.createServer(app);
const io = socketIo(server);

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors()); // Enable CORS for all routes

// File paths
const commentsFilePath = path.join(__dirname, 'comments.json');
const postsFilePath = path.join(__dirname, 'posts.json');

// Load existing comments
function loadComments() {
    try {
        const data = fs.readFileSync(commentsFilePath);
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

// Save comments
function saveComments(comments) {
    fs.writeFileSync(commentsFilePath, JSON.stringify(comments, null, 2));
}

// Load existing posts
function loadPosts() {
    try {
        const data = fs.readFileSync(postsFilePath);
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

// Save posts
function savePosts(posts) {
    fs.writeFileSync(postsFilePath, JSON.stringify(posts, null, 2));
}

// API endpoints for comments
app.get('/api/comments', (req, res) => {
    const comments = loadComments();
    res.json(comments);
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
    io.emit('updateComments', comments); // Notify all clients about the new comment
    res.json(newComment);
});

// API endpoints for posts
app.get('/api/posts', (req, res) => {
    const posts = loadPosts();
    res.json(posts);
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
    io.emit('updatePosts', posts); // Notify all clients about the new post
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
    io.emit('updatePosts', posts); // Notify all clients about the new reply
    res.json(newReply);
});

// Handle Socket.IO connections
io.on('connection', (socket) => {
    console.log('A user connected');

    // Send existing comments and posts to the newly connected client
    socket.emit('updateComments', loadComments());
    socket.emit('updatePosts', loadPosts());

    // Handle refresh comments
    socket.on('refreshComments', () => {
        socket.emit('updateComments', loadComments());
    });

    // Handle refresh posts
    socket.on('refreshPosts', () => {
        socket.emit('updatePosts', loadPosts());
    });

    // Handle remove individual comment
    socket.on('removeComment', (id) => {
        let comments = loadComments();
        comments = comments.filter(comment => comment.id !== id);
        saveComments(comments);
        io.emit('updateComments', comments); // Notify all clients about the comment removal
    });

    // Handle remove all comments
    socket.on('removeAllComments', () => {
        saveComments([]);
        io.emit('updateComments', []); // Notify all clients about the comment removal
    });

    // Handle remove individual post
    socket.on('removePost', (id) => {
        let posts = loadPosts();
        posts = posts.filter(post => post.id !== id);
        savePosts(posts);
        io.emit('updatePosts', posts); // Notify all clients about the post removal
    });

    // Handle remove all posts
    socket.on('removeAllPosts', () => {
        savePosts([]);
        io.emit('updatePosts', []); // Notify all clients about the post removal
    });

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint to serve comments data
app.get('/api/comments', (req, res) => {
    fs.readFile(path.join(__dirname, 'comments.json'), 'utf8', (err, data) => {
        if (err) {
            res.status(500).send('Error reading comments file');
            return;
        }
        res.json(JSON.parse(data));
    });
});


    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

// Start the server
server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
