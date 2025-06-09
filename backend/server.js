// blog-backend/server.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // Assuming JWT_SECRET is defined in .env

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key'; // Make sure this is defined for JWT routes

app.use(cors());
app.use(express.json());

// --- NEW CODE: GET all articles ---
app.get('/api/articles', async (req, res) => {
    console.log("Received GET request for /api/articles");
    try {
        const result = await db.query('SELECT id, title, subtitle, author, publish_date, html_content, delta_content FROM articles ORDER BY publish_date DESC');
        res.status(200).json(result.rows);
        console.log('Successfully fetched all articles.');
    } catch (err) {
        console.error('Error fetching articles:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// --- NEW CODE: GET single article by ID ---
app.get('/api/articles/:id', async (req, res) => {
    const { id } = req.params;
    console.log(`Received GET request for /api/articles/${id}`);
    try {
        const result = await db.query('SELECT id, title, subtitle, author, publish_date, html_content, delta_content FROM articles WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Article not found.' });
        }

        res.status(200).json(result.rows[0]);
        console.log(`Successfully fetched article ${id}.`);
    } catch (err) {
        console.error('Error fetching single article:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


// POST (Create) a new article
// (You'll likely need this for the admin panel)
app.post('/api/articles', async (req, res) => {
    // NEW: Destructure subtitle
    const { title, subtitle, html_content, delta_content, author } = req.body;

    if (!title || !html_content) {
        return res.status(400).json({ error: 'Title and content cannot be empty.' });
    }
    const defaultAuthor = author || 'Anonymous'; // Provide a default author if none is given

    try {
        // NEW: Include subtitle in INSERT
        const result = await db.query(
            'INSERT INTO articles (title, subtitle, html_content, delta_content, author) VALUES ($1, $2, $3, $4, $5) RETURNING id, title, subtitle, author, publish_date, html_content, delta_content',
            [title, subtitle, html_content, delta_content, defaultAuthor]
        );
        res.status(201).json(result.rows[0]);
        console.log('Article created:', result.rows[0].id);
    } catch (err) {
        console.error('Error creating article:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// PUT (Update) an existing article by ID
app.put('/api/articles/:id', async (req, res) => {
  const { id } = req.params;
  // NEW: Destructure subtitle
  const { title, subtitle, html_content, delta_content, author } = req.body;

  if (!title || !html_content) {
    return res.status(400).json({ error: 'Title and content cannot be empty.' });
  }
  const defaultAuthor = author || 'Anonymous';

  try {
    // NEW: Include subtitle in UPDATE
    const result = await db.query(
      'UPDATE articles SET title = $1, subtitle = $2, html_content = $3, delta_content = $4, author = $5 WHERE id = $6 RETURNING id, title, subtitle, author, publish_date, html_content, delta_content',
      [title, subtitle, html_content, delta_content, defaultAuthor, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Article not found.' });
    }

    res.status(200).json(result.rows[0]);
    console.log('Article updated:', result.rows[0].id);
  } catch (err) {
    console.error('Error updating article:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// DELETE an article by ID
app.delete('/api/articles/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query('DELETE FROM articles WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Article not found.' });
    }

    res.status(204).send();
    console.log('Article deleted:', id);
  } catch (err) {
    console.error('Error deleting article:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// User Registration Route
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  try {
    const existingUser = await db.query('SELECT id FROM users WHERE username = $1', [username]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ message: 'Username already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const result = await db.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username',
      [username, password_hash]
    );

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({ message: 'User registered successfully!', token, user: { id: user.id, username: user.username } });
    console.log(`User registered: ${username}`);

  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// User Login Route
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  try {
    const result = await db.query('SELECT id, username, password_hash FROM users WHERE username = $1', [username]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ message: 'Logged in successfully!', token, user: { id: user.id, username: user.username } });
    console.log(`User logged in: ${username}`);

  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


// Start the server
app.listen(PORT, () => {
  console.log(`Blog Backend API listening on port ${PORT}`);
  console.log(`Access it at: http://localhost:${PORT}`);
});