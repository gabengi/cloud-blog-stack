// blog-app/src/App.jsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import QuillEditor from './components/QuillEditor';
import { getBlogs, getBlogById, saveBlog, deleteBlog } from './services/blogService';
import authService from './services/authService';
import './App.css';
import Delta from 'quill-delta'; // Import Delta

// Define the default subtitle placeholder as a constant
const DEFAULT_SUBTITLE_PLACEHOLDER = 'Your subtitle here';

function App() {
  const [currentBlogId, setCurrentBlogId] = useState(null);
  const [blogTitle, setBlogTitle] = useState('');
  const [blogSubtitle, setBlogSubtitle] = useState(''); // New state for subtitle
  const [blogContent, setBlogContent] = useState('');
  const [blogDelta, setBlogDelta] = useState(null);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [currentBlogAuthor, setCurrentBlogAuthor] = useState('');
  const [blogLastUpdated, setBlogLastUpdated] = useState(null); // State for last updated date

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [showAuthForm, setShowAuthForm] = useState(false); // State to toggle auth form visibility
  const [showAuthDropdown, setShowAuthDropdown] = useState(false); // State for user dropdown

  const [currentPage, setCurrentPage] = useState('editor'); // 'editor', 'stories', or 'home'
  const [userStories, setUserStories] = useState([]); // State to hold user's stories
  const [allBlogs, setAllBlogs] = useState([]); // State to hold all blogs for homepage

  // New state for dropdown on stories page
  const [openStoryDropdownId, setOpenStoryDropdownId] = useState(null);

  const titleRef = useRef(null);
  const subtitleRef = useRef(null); // Ref for subtitle
  const didInitialLoadRef = useRef(false);
  const quillEditorRef = useRef(null); // Ref for QuillEditor component
  const authDropdownRef = useRef(null); // Ref for the auth dropdown container
  const storiesListRef = useRef(null); // Ref for the stories list to handle clicks outside dropdowns

  // State to track if the title input is focused
  const [isTitleFocused, setIsTitleFocused] = useState(false);
  const [isSubtitleFocused, setIsSubtitleFocused] = useState(false); // New state for subtitle focus


  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      setIsLoggedIn(true);
      setCurrentUser(user);
    } else {
      setIsLoggedIn(false);
      setCurrentUser(null);
    }
  }, []);

  // Effect to handle clicks outside the auth dropdown to close it
  useEffect(() => {
    function handleClickOutside(event) {
      if (authDropdownRef.current && !authDropdownRef.current.contains(event.target)) {
        setShowAuthDropdown(false);
      }
      // Close story dropdowns if click outside any story dropdown
      if (storiesListRef.current && !storiesListRef.current.contains(event.target)) {
        setOpenStoryDropdownId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [authDropdownRef]);

  // Effect to explicitly enable/disable Quill editor when isLoggedIn changes
  // useEffect(() => {
  //   if (quillEditorRef.current && quillEditorRef.current.getEditor()) {
  //       const quillInstance = quillEditorRef.current.getEditor();
  //       // Enable if logged in AND the current user is the author, otherwise disable
  //       quillInstance.enable(isLoggedIn && currentUser?.username === currentBlogAuthor);
  //       console.log(`App.jsx: Quill editor enabled state set to: ${isLoggedIn && currentUser?.username === currentBlogAuthor}`);
  //   }
  // }, [isLoggedIn, currentUser, currentBlogAuthor]); // Only react to isLoggedIn, currentUser, currentBlogAuthor changes

  // Effect to manage the contentEditable div's innerText for the title
  useEffect(() => {
    if (titleRef.current && !isTitleFocused) {
      // Only update innerText if the element is not focused
      // This prevents React from stomping on the user's typing
      titleRef.current.innerText = blogTitle;
    }
  }, [blogTitle, isTitleFocused]); // Depend on blogTitle and isTitleFocused

  // Effect to manage the contentEditable div's innerText for the subtitle
  useEffect(() => {
    if (subtitleRef.current && !isSubtitleFocused) {
      subtitleRef.current.innerText = blogSubtitle;
    }
  }, [blogSubtitle, isSubtitleFocused]); // Depend on blogSubtitle and isSubtitleFocused

useEffect(() => {
  // Case 1: Existing blog with content loaded
  if (currentBlogId !== null && blogContent !== '' && blogDelta !== null) {
    setIsEditorReady(true);
    console.log(`App.jsx: Editor is now ready for blog ID: ${currentBlogId}`);
  }
  // Case 2: New blog (no currentBlogId)
  else if (currentBlogId === null && blogDelta !== null) {
    // For new blogs, we're ready as soon as we have a delta (even if it's just empty)
    setIsEditorReady(true);
    console.log(`App.jsx: Editor is now ready for a NEW blog.`);
  }
  // Case 3: Not ready (transitional states)
  else {
    setIsEditorReady(false);
    console.log(`App.jsx: Editor is NOT ready. currentBlogId: ${currentBlogId}, blogContent: ${blogContent.length > 0 ? 'HAS CONTENT' : 'EMPTY'}, blogDelta: ${blogDelta ? 'HAS DELTA' : 'NULL'}`);
  }
}, [currentBlogId, blogContent, blogDelta]);

const loadBlog = useCallback(async (id) => {
    setIsEditorReady(false); // Signal transition
    console.log(`loadBlog: Attempting to load blog with ID: ${id}`);
    const blog = await getBlogById(id);

    if (blog) {
      console.log(`loadBlog: Blog loaded - Title: "${blog.title}", Subtitle: "${blog.subtitle || 'N/A'}", Author: "${blog.author}", Delta present: ${!!blog.delta}`);
      console.log(`loadBlog: DEBUG - blog.delta TYPE BEFORE PARSE: ${typeof blog.delta}, VALUE (first 100 chars): "${typeof blog.delta === 'string' ? blog.delta.substring(0, Math.min(blog.delta.length, 100)) : JSON.stringify(blog.delta).substring(0, Math.min(JSON.stringify(blog.delta).length, 100))}"`);

      // Set all states related to the blog content
      setBlogTitle(blog.title);
      setBlogSubtitle(blog.subtitle || DEFAULT_SUBTITLE_PLACEHOLDER);
      setBlogContent(blog.content);

      // Handle blog.delta: Parse if string, use as-is if object, default if null/undefined
      let parsedDelta = null;
      if (typeof blog.delta === 'string') {
        try {
          parsedDelta = JSON.parse(blog.delta);
          // Ensure it's a Delta instance for consistency
          if (!(parsedDelta instanceof Delta)) {
              parsedDelta = new Delta(parsedDelta);
          }
        } catch (e) {
          console.error("Error parsing blog.delta JSON string in loadBlog:", e);
          parsedDelta = { ops: [{ insert: '\n' }] }; // Fallback to an empty Delta
        }
      } else if (blog.delta) {
        parsedDelta = blog.delta; // It's already an object
        // Ensure it's a Delta instance for consistency
        if (!(parsedDelta instanceof Delta)) {
            parsedDelta = new Delta(parsedDelta);
        }
      } else {
        parsedDelta = { ops: [{ insert: '\n' }] }; // It's null or undefined
      }
      setBlogDelta(parsedDelta); // Set the parsed Delta

      console.log(`loadBlog: DEBUG - blogDelta STATE TYPE AFTER PARSE: ${typeof parsedDelta}, VALUE (first 100 chars): "${JSON.stringify(parsedDelta).substring(0, Math.min(JSON.stringify(parsedDelta).length, 100))}"`);

      setCurrentBlogAuthor(blog.author);
      setBlogLastUpdated(blog.updatedAt || blog.createdAt);
      setCurrentBlogId(id);
      setCurrentPage('editor');
      setOpenStoryDropdownId(null);
    } else {
      console.log(`loadBlog: Blog with ID ${id} not found. Preparing for a new blog.`);
      setIsEditorReady(false);
      setCurrentBlogId(null);
      setBlogTitle('');
      setBlogSubtitle(DEFAULT_SUBTITLE_PLACEHOLDER);
      setBlogContent('');
      setBlogDelta({ ops: [{ insert: '\n' }] });
      setCurrentBlogAuthor(currentUser ? currentUser.username : '');
      setBlogLastUpdated(null);
      setCurrentPage('editor');
    }
  }, [currentUser]);

const loadInitialBlogData = useCallback(async () => {
    if (didInitialLoadRef.current) {
      console.log("loadInitialBlogData: Initial load already processed. Skipping.");
      return;
    }
    didInitialLoadRef.current = true;

    console.log("loadInitialBlogData: Attempting to load initial blog data.");
    try {
      const blogs = await getBlogs();
      if (blogs.length > 0) {
        const firstBlog = blogs[0];
        console.log(`loadInitialBlogData: Loading first blog (ID: ${firstBlog.id}) - Title: "${firstBlog.title}", Delta present: ${!!firstBlog.delta}`);
        console.log(`loadInitialBlogData: DEBUG - firstBlog.delta TYPE BEFORE PARSE: ${typeof firstBlog.delta}, VALUE (first 100 chars): "${typeof firstBlog.delta === 'string' ? firstBlog.delta.substring(0, Math.min(firstBlog.delta.length, 100)) : JSON.stringify(firstBlog.delta).substring(0, Math.min(JSON.stringify(firstBlog.delta).length, 100))}"`);

        // Set all states related to the blog content
        setBlogTitle(firstBlog.title);
        setBlogSubtitle(firstBlog.subtitle || DEFAULT_SUBTITLE_PLACEHholder);
        setBlogContent(firstBlog.content);

        // Handle firstBlog.delta: Parse if string, use as-is if object, default if null/undefined
        let parsedFirstBlogDelta = null;
        if (typeof firstBlog.delta === 'string') {
          try {
            parsedFirstBlogDelta = JSON.parse(firstBlog.delta);
            // Ensure it's a Delta instance for consistency
            if (!(parsedFirstBlogDelta instanceof Delta)) {
                parsedFirstBlogDelta = new Delta(parsedFirstBlogDelta);
            }
          } catch (e) {
            console.error("Error parsing firstBlog.delta JSON string in loadInitialBlogData:", e);
            parsedFirstBlogDelta = { ops: [{ insert: '\n' }] }; // Fallback to an empty Delta
          }
        } else if (firstBlog.delta) {
          parsedFirstBlogDelta = firstBlog.delta; // It's already an object
          // Ensure it's a Delta instance for consistency
          if (!(parsedFirstBlogDelta instanceof Delta)) {
              parsedFirstBlogDelta = new Delta(parsedFirstBlogDelta);
          }
        } else {
          parsedFirstBlogDelta = { ops: [{ insert: '\n' }] }; // It's null or undefined
        }
        setBlogDelta(parsedFirstBlogDelta); // Set the parsed Delta

        console.log(`loadInitialBlogData: DEBUG - blogDelta STATE TYPE AFTER PARSE: ${typeof parsedFirstBlogDelta}, VALUE (first 100 chars): "${JSON.stringify(parsedFirstBlogDelta).substring(0, Math.min(JSON.stringify(parsedFirstBlogDelta).length, 100))}"`);

        setCurrentBlogAuthor(firstBlog.author);
        setBlogLastUpdated(firstBlog.updatedAt || firstBlog.createdAt);
        setCurrentBlogId(firstBlog.id);
      } else {
        console.log("loadInitialBlogData: No blogs found. Starting with a new empty blog.");
        setCurrentBlogId(null);
        setBlogTitle('');
        setBlogSubtitle(DEFAULT_SUBTITLE_PLACEHOLDER);
        setBlogContent('');
        setBlogDelta({ ops: [{ insert: '\n' }] });
        setCurrentBlogAuthor(currentUser ? currentUser.username : '');
        setBlogLastUpdated(null);
      }
    } catch (error) {
      console.error("loadInitialBlogData: Failed to load initial blog data:", error);
      setCurrentBlogId(null);
      setBlogTitle('');
      setBlogSubtitle(DEFAULT_SUBTITLE_PLACEHOLDER);
      setBlogContent('');
      setBlogDelta({ ops: [{ insert: '\n' }] });
      setCurrentBlogAuthor(currentUser ? currentUser.username : '');
      setBlogLastUpdated(null);
    } finally {
      setIsEditorReady(true);
    }
  }, [currentUser]);

  useEffect(() => {
    loadInitialBlogData();
  }, [loadInitialBlogData]);

  const handleContentChange = useCallback((content, delta) => {
    setBlogContent(content);
    setBlogDelta(delta);
    console.log("handleContentChange - HTML:", content); // Full HTML
    console.log("handleContentChange - Delta:", JSON.stringify(delta)); // Stringified Delta
  }, []);

  const handleTitleChange = useCallback(() => {
    if (titleRef.current) {
      // Update the state from the DOM's current innerText
      setBlogTitle(titleRef.current.innerText);
    }
  }, []);

  // New handler for subtitle changes
  const handleSubtitleChange = useCallback(() => {
    if (subtitleRef.current) {
      setBlogSubtitle(subtitleRef.current.innerText);
    }
  }, []);

  const handleNewBlog = useCallback(() => {
    if (!isLoggedIn) {
      console.log("Please log in to create a new blog.");
      return;
    }
    // Set isEditorReady to false to trigger unmount/remount
    setIsEditorReady(false);
    setCurrentBlogId(null);
    setBlogTitle('');
    setBlogSubtitle(DEFAULT_SUBTITLE_PLACEHOLDER);
    setBlogContent('');
    setBlogDelta({ ops: [{ insert: '\n' }] }); // Set to an empty Quill Delta
    setCurrentBlogAuthor(currentUser ? currentUser.username : '');
    setBlogLastUpdated(null);
    setCurrentPage('editor');
    // isEditorReady will be set by the new useEffect
    console.log("handleNewBlog: Editor preparing for new blog.");
  }, [isLoggedIn, currentUser]);

  const handleSaveBlog = useCallback(async () => {
    if (!isLoggedIn) {
      console.log("Please log in to publish or update a blog.");
      return;
    }

    if (!blogTitle.trim()) {
      console.log('Blog title cannot be empty.');
      return;
    }
    // Check if blog content is empty (Quill's initial state is often just a newline)
    const isContentEmpty = !blogContent.trim() || (blogDelta && blogDelta.ops && blogDelta.ops.length === 1 && blogDelta.ops[0].insert === '\n');

    if (isContentEmpty) {
        console.log('Blog content cannot be empty.');
        return;
    }

    const blogData = {
      id: currentBlogId,
      title: blogTitle,
      subtitle: blogSubtitle, // Include subtitle in saved data
      content: blogContent,
      delta: blogDelta,
      author: currentUser ? currentUser.username : 'Unknown'
    };

    console.log("handleSaveBlog - Data to send:", blogData); // Log before sending

    try {
      const savedBlog = await saveBlog(blogData);
      if (savedBlog) {
        console.log("Blog saved/updated:", savedBlog);
        console.log(currentBlogId ? "Blog updated successfully!" : "Blog published successfully!");
        setCurrentBlogId(savedBlog.id);
        setCurrentBlogAuthor(savedBlog.author);
        setBlogLastUpdated(savedBlog.updatedAt || savedBlog.createdAt); // Update the date after saving
        // No need to touch isEditorReady here, it's managed by its effect
      } else {
        console.error("Failed to save/update blog.");
        console.log("Failed to save/update blog.");
      }
    } catch (error) {
      console.error("Error saving/updating blog:", error);
      console.log(`Error saving/updating blog: ${error.message}`);
    }
  }, [blogTitle, blogSubtitle, blogContent, blogDelta, currentBlogId, isLoggedIn, currentUser]);


  // Function to load user's stories (moved up)
  const loadUserStories = useCallback(async () => {
    if (!isLoggedIn || !currentUser) {
      console.log("Not logged in to view stories.");
      setUserStories([]);
      return;
    }
    console.log(`Loading stories for user: ${currentUser.username}`);
    try {
      const allBlogsData = await getBlogs(); // Fetch all blogs
      // Filter by current user and sort by updatedAt (or createdAt if updatedAt is not present)
      const filteredAndSortedStories = allBlogsData
        .filter(blog => blog.author === currentUser.username)
        .sort((a, b) => {
          const dateA = a.updatedAt || a.createdAt;
          const dateB = b.updatedAt || b.createdAt;
          return new Date(dateB) - new Date(dateA); // Descending order (most recent first)
        });
      setUserStories(filteredAndSortedStories);
      setCurrentPage('stories'); // Switch to stories view
      setShowAuthDropdown(false); // Close dropdown
      setOpenStoryDropdownId(null); // Close any open story dropdown
    } catch (error) {
      console.error("Failed to load user stories:", error);
      setUserStories([]);
    }
  }, [isLoggedIn, currentUser]);

  // Function to load all blogs for the homepage (moved up)
  const handleGoHome = useCallback(async () => {
    console.log("Loading all blogs for homepage...");
    try {
      // Before loading new data, set editor to not ready, and clear current blog data
      // This ensures that if the user clicks "Home" then immediately an article,
      // the editor is properly reset before loading new content.
      setIsEditorReady(false);
      setCurrentBlogId(null);
      setBlogTitle('');
      setBlogSubtitle(DEFAULT_SUBTITLE_PLACEHOLDER);
      setBlogContent('');
      setBlogDelta({ ops: [{ insert: '\n' }] }); // Set to an empty Quill Delta
      setCurrentBlogAuthor('');
      setBlogLastUpdated(null);

      const allBlogsData = await getBlogs();
      // Sort by updatedAt or createdAt in descending order
      const sortedBlogs = allBlogsData.sort((a, b) => {
        const dateA = a.updatedAt || a.createdAt;
        const dateB = b.updatedAt || b.createdAt;
        return new Date(dateB) - new Date(dateA);
      });
      setAllBlogs(sortedBlogs);
      setCurrentPage('home'); // Switch to homepage view
      setOpenStoryDropdownId(null); // Close any open story dropdown
    } catch (error) {
      console.error("Failed to load all blogs for homepage:", error);
      setAllBlogs([]);
    }
  }, []);

  // Modified handleDeleteBlog to accept an optional ID for deleting from lists
  const handleDeleteBlog = useCallback(async (idToDelete = currentBlogId) => {
    if (!isLoggedIn) {
      console.log("Please log in to delete a blog.");
      return;
    }
    if (!idToDelete) {
      console.log("No blog selected to delete.");
      return;
    }

    const confirmDelete = true; // Placeholder for custom modal confirmation
    if (confirmDelete) {
      try {
        const success = await deleteBlog(idToDelete);
        if (success) {
          console.log("Blog deleted successfully!");
          // If the deleted blog was the one currently open in the editor, clear the editor
          if (idToDelete === currentBlogId) {
            setCurrentBlogId(null);
            setBlogTitle('');
            setBlogSubtitle(DEFAULT_SUBTITLE_PLACEHOLDER); // Clear subtitle
            setBlogContent('');
            setBlogDelta({ ops: [{ insert: '\n' }] }); // Set to an empty Quill Delta
            setCurrentBlogAuthor('');
            setBlogLastUpdated(null);
            // isEditorReady will be managed by its dedicated effect
          }
          // Refresh lists based on current page
          if (currentPage === 'stories') {
            loadUserStories(); // Refresh stories list if on stories page
          } else if (currentPage === 'home') {
            handleGoHome(); // Refresh homepage list if on home page
          }
          // No page change needed, lists will refresh in place
          setOpenStoryDropdownId(null); // Close any open story dropdown
        } else {
          console.error("Failed to delete blog with ID:", idToDelete);
          console.log("Failed to delete blog.");
        }
      } catch (error) {
        console.error("Error deleting blog:", error);
        console.log(`Error deleting blog: ${error.message}`);
      }
    }
  }, [currentBlogId, isLoggedIn, loadUserStories, handleGoHome, currentPage]);


  const handleLoadNextOrPrevious = useCallback(async (direction) => {
    setIsEditorReady(false); // Clear editor state during transition
    console.log(`handleLoadNextOrPrevious: Loading ${direction} blog...`);
    const blogs = await getBlogs();
    if (!blogs || blogs.length === 0) {
      console.warn("handleLoadNextOrPrevious: No blogs available for navigation. Switching to new blog mode.");
      setCurrentBlogId(null);
      setBlogTitle('');
      setBlogSubtitle(DEFAULT_SUBTITLE_PLACEHOLDER); // Clear subtitle
      setBlogContent('');
      setBlogDelta({ ops: [{ insert: '\n' }] }); // Set to an empty Quill Delta
      setCurrentBlogAuthor('');
      setBlogLastUpdated(null); // Clear the date
      // isEditorReady will be set by the new useEffect
      return;
    }

    const currentIndex = blogs.findIndex(blog => blog.id === currentBlogId);
    let nextIndex;

    if (direction === 'next') {
      nextIndex = (currentIndex + 1) % blogs.length;
    } else { // 'prev'
      nextIndex = (currentIndex - 1 + blogs.length) % blogs.length;
    }

    const nextBlog = blogs[nextIndex];
    if (nextBlog) {
      console.log(`handleLoadNextOrPrevious: Switching to blog ID: ${nextBlog.id}`);
      await loadBlog(nextBlog.id); // This will eventually set isEditorReady via the effect
    } else {
        console.warn("handleLoadNextOrPrevious: Could not find next/previous blog. Switching to new blog mode.");
        setCurrentBlogId(null);
        setBlogTitle('');
        setBlogSubtitle(DEFAULT_SUBTITLE_PLACEHOLDER); // Clear subtitle
        setBlogContent('');
        setBlogDelta({ ops: [{ insert: '\n' }] }); // Set to an empty Quill Delta
        setCurrentBlogAuthor('');
        setBlogLastUpdated(null); // Clear the date
        // isEditorReady will be set by the new useEffect
    }
  }, [currentBlogId, loadBlog]);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    try {
      let data;
      if (authMode === 'login') {
        data = await authService.login(authUsername, authPassword);
      } else {
        data = await authService.register(authUsername, authPassword);
      }
      setIsLoggedIn(true);
      setCurrentUser(data.user);
      setAuthUsername('');
      setAuthPassword('');
      setShowAuthForm(false); // Hide form on successful auth
      console.log(data.message);
      await loadInitialBlogData();
    } catch (error) {
      console.error("Auth error:", error);
      console.log(error.message);
    }
  };

  const handleLogout = useCallback(() => {
    authService.logout();
    setIsLoggedIn(false);
    setCurrentUser(null);
    setShowAuthDropdown(false); // Close dropdown on logout
    console.log("You have been logged out.");
    loadInitialBlogData();
  }, [loadInitialBlogData]);


  // Determine if the save/publish button should be visible
  const canSave = isLoggedIn &&
                  currentPage === 'editor' && // Only show on editor page
                  (
                    (blogTitle && blogTitle.trim() !== '') || // Title has content
                    (blogSubtitle && blogSubtitle.trim() !== '' && blogSubtitle.trim() !== DEFAULT_SUBTITLE_PLACEHOLDER) || // Subtitle has content (and isn't just the default placeholder)
                    (blogContent && blogContent.trim() !== '') || // HTML content has content
                    (blogDelta && blogDelta.ops && blogDelta.ops.length > 1) // Delta has more than just an empty paragraph
                  ) &&
                  (
                    !currentBlogId || // If it's a new blog (no currentBlogId)
                    (currentUser && currentBlogAuthor === currentUser.username) // Or if it's an existing blog and the current user is the author
                  );


  console.log(`App Render - isEditorReady: ${isEditorReady} currentBlogId: ${currentBlogId} User: ${currentUser ? currentUser.username : 'Guest'} LoggedIn: ${isLoggedIn} CurrentPage: ${currentPage}`);

  return (
    <div className="App">
      <header className="App-header">
        {/* Blog Editor title now acts as a home button */}
        <h1 className="app-title" onClick={handleGoHome}>Blog Editor</h1>

        <div className="header-actions-right"> {/* New wrapper for right-aligned actions */}
          {isLoggedIn && (
            <>
              {/* Publish/Update Button - now conditionally rendered based on canSave */}
              {canSave && ( // Only show if canSave is true
                <button className="write-button save-button" onClick={handleSaveBlog}>
                  {currentBlogId ? 'Update' : 'Publish'}
                </button>
              )}
              {/* Write New Blog Button */}
              <button className="write-button" onClick={handleNewBlog}>
                Write
              </button>
            </>
          )}

          <div className="auth-section" ref={authDropdownRef}> {/* Attach ref here */}
            {isLoggedIn ? (
              <div className="user-info">
                <span className="username-display" onClick={() => setShowAuthDropdown(!showAuthDropdown)}> {/* Clickable username */}
                  {currentUser && currentUser.username}
                </span>
                {showAuthDropdown && ( /* Conditional rendering of dropdown */
                  <div className="auth-dropdown-menu">
                    <button onClick={loadUserStories}>My Stories</button> {/* Changed to My Stories button */}
                    <button onClick={handleLogout} className="logout-button">Logout</button>
                  </div>
                )}
              </div>
            ) : (
              <div className="auth-buttons">
                <button className="auth-button" onClick={() => {setShowAuthForm(true); setAuthMode('login');}}>Login</button> {/* Toggle form */}
                <button className="auth-button" onClick={() => {setShowAuthForm(true); setAuthMode('register');}}>Register</button> {/* Toggle form */}
              </div>
            )}
          </div>
        </div> {/* End header-actions-right */}
      </header>

      {/* Authentication Form (conditionally rendered as a modal-like overlay) */}
      {showAuthForm && !isLoggedIn && (
        <form onSubmit={handleAuthSubmit} className="auth-form">
          <h4>{authMode === 'login' ? 'Login' : 'Register'}</h4>
          <input
            type="text"
            placeholder="Username"
            value={authUsername}
            onChange={(e) => setAuthUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={authPassword}
            onChange={(e) => setAuthPassword(e.target.value)}
            required
          />
          <button type="submit">{authMode === 'login' ? 'Submit' : 'Register'}</button>
          <button type="button" onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}>
            Switch to {authMode === 'login' ? 'Register' : 'Login'}
          </button>
          <button type="button" className="close-form-button" onClick={() => setShowAuthForm(false)}>
            X
          </button>
        </form>
      )}

      {/* Conditionally render Editor, Stories, or Home page */}
      {currentPage === 'editor' && (
        <>
          {/* Blog Navigation Buttons - now outside the header and centered */}
          <div className="nav-buttons-container">
            <div className="nav-buttons">
              {/* Removed Home, Previous, Next, and Delete buttons */}
            </div>
          </div>

          {/* GLOBAL QUILL TOOLBAR CONTAINER - now below nav buttons and centered */}
          {/* It must always be the DOM for Quill to find it, even if hidden */}
          <div
            id="global-quill-toolbar"
            className="quill-toolbar-container"
            // Use display: none when not editable to completely hide it
            style={{ display: (isLoggedIn && currentUser?.username === currentBlogAuthor) ? 'block' : 'none' }}
          >
            {/* Quill will automatically populate this div with its toolbar items */}
            {/* Do NOT add any child elements inside this div yourself */}
          </div>

          <main className="editor-main-content">
            <div
              ref={titleRef}
              className="blog-title-editable"
              contentEditable={isLoggedIn && currentUser?.username === currentBlogAuthor}
              data-placeholder="Title"
              onInput={handleTitleChange}
              onFocus={() => setIsTitleFocused(true)} // Set focused state to true
              onBlur={() => setIsTitleFocused(false)}   // Set focused state to false
              // dangerouslySetInnerHTML removed
            />
            {/* Subtitle Editable Area */}
            <div
              ref={subtitleRef}
              className="blog-subtitle-editable" // New class for subtitle
              contentEditable={isLoggedIn && currentUser?.username === currentBlogAuthor}
              data-placeholder={DEFAULT_SUBTITLE_PLACEHOLDER} // Placeholder for subtitle
              onInput={handleSubtitleChange}
              onFocus={() => setIsSubtitleFocused(true)} // Set focused state to true
              onBlur={() => setIsSubtitleFocused(false)}   // Set focused state to false
            />
            {currentBlogAuthor && currentPage !== 'editor' && <p className="blog-author">By: {currentBlogAuthor}</p>}
            {blogLastUpdated && (
              <p className="blog-date-stamp">
                Last updated: {new Date(blogLastUpdated).toLocaleDateString()}
              </p>
            )}

            {isEditorReady && ( // Only render QuillEditor when isEditorReady is true
              <QuillEditor
                ref={quillEditorRef}
                key={currentBlogId || 'new-blog-editor'} // Use key to force remount on blog change
                initialContent={blogContent}
                initialDelta={blogDelta}
                onContentChange={handleContentChange}
                toolbarId="global-quill-toolbar" // Pass the ID to QuillEditor
                readOnly={!isLoggedIn || currentUser?.username !== currentBlogAuthor}
                placeholder={isLoggedIn && currentUser?.username === currentBlogAuthor ? 'Start writing your blog post here...' : ''}
              />
            )}
          </main>
        </>
      )}

      {currentPage === 'stories' && (
        <div className="stories-page-container">
          <h2>My Stories</h2>
          {isLoggedIn && userStories.length > 0 ? (
            <ul className="stories-list" ref={storiesListRef}>
              {userStories.map(blog => (
                <li key={blog.id} className="story-item">
                  <div className="story-info">
                    <span className="story-title" onClick={() => loadBlog(blog.id)}>
                      {blog.title || 'Untitled Blog'}
                    </span>
                    {blog.subtitle && (
                      <span className="story-subtitle-small">
                        {blog.subtitle}
                      </span>
                    )}
                    <span className="story-date-small">
                      {new Date(blog.updatedAt || blog.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="story-actions-container">
                    <button
                      className="story-dropdown-toggle"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenStoryDropdownId(openStoryDropdownId === blog.id ? null : blog.id);
                      }}
                    >
                      &#x25BC;
                    </button>
                    {openStoryDropdownId === blog.id && (
                      <div className="story-dropdown-menu">
                        <button onClick={() => {
                          loadBlog(blog.id);
                          setOpenStoryDropdownId(null);
                        }}>Edit</button>
                        <button onClick={() => {
                          handleDeleteBlog(blog.id);
                          setOpenStoryDropdownId(null);
                        }}>Delete</button>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-stories-message">
              {isLoggedIn ? "You haven't written any stories yet." : "Please log in to see your stories."}
            </p>
          )}
        </div>
      )}

      {currentPage === 'home' && (
        <div className="home-page-container">
          <h2>All Articles</h2>
          {allBlogs.length > 0 ? (
            <ul className="articles-list">
              {allBlogs.map(blog => (
                <li key={blog.id} className="article-item" onClick={() => loadBlog(blog.id)}>
                  <span className="article-title-main">{blog.title || 'Untitled Blog'}</span>
                  {blog.subtitle && (
                    <span className="article-subtitle-main">
                      {blog.subtitle}
                    </span>
                  )}
                  <span className="article-author-small">{blog.author}</span>
                  <span className="article-date-small">
                    {new Date(blog.updatedAt || blog.createdAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-articles-message">No articles found. Start writing one!</p>
          )}
        </div>
      )}
    </div>
  );
}

export default App;