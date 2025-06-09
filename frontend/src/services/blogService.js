// blog-app/src/services/blogService.js

const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL;

/**
 * Fetches all blog posts from the backend API.
 * @returns {Promise<Array>} A promise that resolves to an array of blog post objects.
 */
const getBlogs = async () => {
  console.log("Attempting to fetch blogs from backend API...");
  try {
    const response = await fetch(`${API_BASE_URL}/articles`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log("Blogs fetched successfully from backend:", data);

    const formattedData = data.map(blog => ({
      id: blog.id,
      title: blog.title,
      subtitle: blog.subtitle, // NEW: Include subtitle
      author: blog.author,
      publishDate: blog.publish_date,
      content: blog.html_content,
      delta: blog.delta_content
    }));

    return formattedData;

  } catch (error) {
    console.error("Error fetching blogs from backend:", error);
    throw error;
  }
};

/**
 * Fetches a single blog post by ID from the backend API.
 * For now, it fetches all and filters. Later, you'll add a specific backend endpoint.
 * @param {string} id The ID of the blog post to fetch.
 * @returns {Promise<Object|null>} A promise that resolves to the blog post object or null if not found.
 */
const getBlogById = async (id) => {
  console.log(`Attempting to fetch blog with ID ${id} from backend API...`);
  try {
    const blogs = await getBlogs();
    const blog = blogs.find(b => b.id === id);
    if (blog) {
      console.log(`Blog with ID ${id} found:`, blog);
      return blog;
    } else {
      console.log(`Blog with ID ${id} not found.`);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching blog with ID ${id} from backend:`, error);
    throw error;
  }
};


/**
 * Saves a blog post to the backend API (creates new or updates existing).
 * @param {object} blogData The blog data to save.
 * @returns {Promise<object>} The saved blog object, including its ID.
 */
const saveBlog = async (blogData) => {
  console.log("Attempting to save blog to backend API:", blogData);
  try {
    const method = blogData.id ? 'PUT' : 'POST';
    const url = blogData.id ? `${API_BASE_URL}/articles/${blogData.id}` : `${API_BASE_URL}/articles`;

    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: blogData.title,
        subtitle: blogData.subtitle, // NEW: Include subtitle
        html_content: blogData.content,
        delta_content: blogData.delta,
        author: blogData.author || 'Temporary Author'
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message || 'Unknown error'}`);
    }

    const savedBlog = await response.json();
    console.log("Blog saved successfully from backend:", savedBlog);

    const formattedSavedBlog = {
      id: savedBlog.id,
      title: savedBlog.title,
      subtitle: savedBlog.subtitle, // NEW: Include subtitle
      author: savedBlog.author,
      publishDate: savedBlog.publish_date,
      content: savedBlog.html_content,
      delta: savedBlog.delta_content
    };

    return formattedSavedBlog;

  } catch (error) {
    console.error("Error saving blog to backend:", error);
    throw error;
  }
};


/**
 * Deletes a blog post by ID from the backend API.
 * @param {string} id The ID of the blog post to delete.
 * @returns {Promise<boolean>} True if successful, false otherwise.
 */
const deleteBlog = async (id) => {
  console.log(`Attempting to delete blog with ID ${id} from backend API...`);
  try {
    const response = await fetch(`${API_BASE_URL}/articles/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message || 'Unknown error'}`);
    }

    console.log(`Blog with ID ${id} deleted successfully from backend.`);
    return true;

  } catch (error) {
    console.error(`Error deleting blog with ID ${id} from backend:`, error);
    throw error;
  }
};

export { getBlogs, getBlogById, saveBlog, deleteBlog };