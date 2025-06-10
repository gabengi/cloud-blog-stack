-- blog-backend/schema.sql

-- Drop tables if they exist to allow clean re-initialization
DROP TABLE IF EXISTS articles;
DROP TABLE IF EXISTS users;

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create articles table
CREATE TABLE articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(500), -- NEW: Subtitle column (can be NULL)
    author VARCHAR(255),
    publish_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    html_content TEXT,
    delta_content JSONB
);

-- Insert initial data (optional, only for testing/dev)
DELETE FROM articles;
DELETE FROM users;

INSERT INTO articles (title, subtitle, author, html_content, delta_content) VALUES
-- Corrected delta_content for the first article: Each line ending with \n or having a separate {"insert":"\n"}
('Welcome to Your Blog', 'Your journey into web development.', 'Admin', '<p>This is your very first blog post!</p><p>You can edit or delete this, or create new posts.</p>',
  '[{"insert":"This is your very first blog post!\n"}, {"insert":"You can edit or delete this, or create new posts.\n"}]'),
-- Corrected delta_content for the second article:
('Exploring New Features', 'Dive deep into modern web technologies.', 'Admin', '<p>Stay tuned for more updates and exciting new features!</p>',
  '[{"insert":"Stay tuned for more updates and exciting new features!\n"}]');