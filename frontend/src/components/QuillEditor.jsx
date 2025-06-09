// src/components/QuillEditor.jsx
import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react'; // Added forwardRef, useImperativeHandle
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import Delta from 'quill-delta'; // Ensure this is imported

const toolbarOptions = [
  [{ 'header': [1, 2, 3, 4, false] }],
  ['bold', 'italic', 'blockquote'],
  ['link', 'image'],
  [{ 'list': 'ordered'}, { 'list': 'bullet' }],
  ['clean']
];

// Made QuillEditor a forwardRef component to allow parent to pass a ref
const QuillEditor = forwardRef(({ initialContent = '', initialDelta = null, onContentChange, toolbarId, readOnly = false }, ref) => { // Added readOnly prop
  const quillEditorRef = useRef(null);
  const quillInstanceRef = useRef(null);
  const toolbarContainerRef = useRef(null);
  const isQuillInitializedRef = useRef(false);

  // Helper function to handle setting content, prioritizing Delta
  const setQuillContent = (quill, contentHtml, contentDelta, source = 'silent') => {
    if (!quill) return;

    let deltaToSet;

    if (contentDelta) {
      if (contentDelta instanceof Delta) {
        deltaToSet = contentDelta;
        console.log("QuillEditor.jsx: Delta is instance.");
      } else if (typeof contentDelta === 'object' && contentDelta.ops) {
        try {
          deltaToSet = new Delta(contentDelta);
          console.log("QuillEditor.jsx: Rehydrated Delta from plain object.");
        } catch (e) {
          console.error("QuillEditor.jsx: Error rehydrating Delta:", contentDelta, e);
          deltaToSet = new Delta();
        }
      } else {
        console.warn("QuillEditor.jsx: initialDelta neither Delta instance nor plain object. Setting empty Delta.");
        deltaToSet = new Delta();
      }
    } else if (contentHtml) {
      console.warn("QuillEditor.jsx: No valid initialDelta provided. Falling back to clipboard.convert HTML.");
      try {
        deltaToSet = quill.clipboard.convert(contentHtml);
      } catch (e) {
        console.error("QuillEditor.jsx: Error converting HTML via clipboard.convert:", e);
        deltaToSet = new Delta();
      }
    } else {
      deltaToSet = new Delta();
      console.log("QuillEditor.jsx: No initial content or Delta provided. Setting empty Delta.");
    }

    console.log("QuillEditor.jsx: Delta to set (first 50 chars):", JSON.stringify(deltaToSet).substring(0, 50) + "...");

    quill.setContents(deltaToSet, source);
    quill.setSelection(quill.getLength(), 0);
    console.log("QuillEditor.jsx: HTML after setContents (first 50 chars):", quill.root.innerHTML.substring(0, 50) + "...");
  };


  // Effect 1: Initialize Quill (runs only once per component instance mount controlled by key prop in parent)
  useEffect(() => {
    // This check is important for React.StrictMode re-renders
    if (isQuillInitializedRef.current) {
      console.log("QuillEditor.jsx: StrictMode re-render: Quill already initialized. Skipping re-init.");
      return;
    }

    if (!quillEditorRef.current) {
      console.log("QuillEditor.jsx: Editor content ref not available yet. Skipping init.");
      return;
    }

    // Use a setTimeout to give the DOM a moment to ensure the toolbar container is ready
    const initTimeout = setTimeout(() => {
        const currentToolbarContainer = document.getElementById(toolbarId);
        if (!currentToolbarContainer) {
          console.error(`QuillEditor.jsx: ERROR! Toolbar container with ID '${toolbarId}' NOT FOUND after timeout!`);
          return;
        }

        console.log(`QuillEditor.jsx: Toolbar container (ID: ${toolbarId}) found. outerHTML (snippet): ${currentToolbarContainer.outerHTML.substring(0, 100)}...`);
        console.log(`QuillEditor.jsx: Toolbar container dimensions: ${currentToolbarContainer.clientWidth}x${currentToolbarContainer.clientHeight}`);


        toolbarContainerRef.current = currentToolbarContainer;

        console.log("QuillEditor.jsx: Attempting to initialize Quill editor...");

        // Clear toolbar to prevent duplicates from previous mounts
        toolbarContainerRef.current.innerHTML = '';
        console.log("QuillEditor.jsx: Toolbar container cleared before Quill init.");

        quillInstanceRef.current = new Quill(quillEditorRef.current, {
          theme: 'snow',
          modules: {
            toolbar: toolbarOptions, // Your original toolbarOptions array
          },
          placeholder: 'Start writing your blog post here...',
        });

        // Your original logic to append Quill's internal toolbar to your external div
        const quillToolbarElement = quillInstanceRef.current.getModule('toolbar').container;

        // ADDED LOGS FOR TOOLBAR ATTACHMENT
        console.log("QuillEditor.jsx: Quill's internal toolbar element:", quillToolbarElement);
        if (quillToolbarElement) {
            console.log("QuillEditor.jsx: Quill's internal toolbar element outerHTML (snippet):", quillToolbarElement.outerHTML.substring(0, 100) + '...');
        }


        if (quillToolbarElement && quillToolbarElement !== toolbarContainerRef.current) {
            toolbarContainerRef.current.appendChild(quillToolbarElement);
            console.log("QuillEditor.jsx: Successfully appended Quill's toolbar to external container.");
        } else if (quillToolbarElement === toolbarContainerRef.current) {
            console.log("QuillEditor.jsx: Quill's toolbar container IS the provided container. No append needed.");
        } else {
            console.error("QuillEditor.jsx: Failed to get Quill's internal toolbar element for attachment.");
        }

        console.log("QuillEditor.jsx: Quill instance created:", quillInstanceRef.current);

        isQuillInitializedRef.current = true;

        // Attach the text-change listener - ONLY trigger onContentChange for user input
        quillInstanceRef.current.on('text-change', (delta, oldDelta, source) => {
          if (source === 'user') {
            const html = quillInstanceRef.current.root.innerHTML;
            const contentDelta = quillInstanceRef.current.getContents(); // Get the actual Delta from Quill
            // console.log("Quill text-change (user source). HTML:", html, "Delta:", contentDelta); // Keep this commented unless deep debugging
            onContentChange(html, contentDelta); // Update parent state with both HTML and Delta
          } else {
            // console.log("Quill text-change (API source, likely initial load or silent change). Ignoring state update."); // Keep commented
          }
        });

        // Call helper here during initialization
        console.log("QuillEditor.jsx: Applying initial content on init. HTML (snippet):", initialContent.substring(0, 50), "Delta (snippet):", JSON.stringify(initialDelta).substring(0,50));
        setQuillContent(quillInstanceRef.current, initialContent, initialDelta, 'silent');

        // Set initial readOnly state
        quillInstanceRef.current.enable(!readOnly);
        console.log("QuillEditor.jsx: Initial readOnly state set to:", readOnly, "Editor enabled:", !readOnly);

    }, 100); // 100ms delay to ensure DOM is ready

    // Cleanup function: runs when the component unmounts (due to key prop changing in parent)
    return () => {
      clearTimeout(initTimeout); // Clear the timeout if component unmounts before init
      if (quillInstanceRef.current && isQuillInitializedRef.current) {
        console.log("QuillEditor.jsx: Cleaning up Quill instance.");
        quillInstanceRef.current.off('text-change');
        quillInstanceRef.current = null;
        isQuillInitializedRef.current = false;

        if (quillEditorRef.current) quillEditorRef.current.innerHTML = '';
        if (toolbarContainerRef.current && toolbarContainerRef.current.contains(document.querySelector('.ql-toolbar'))) {
            // Only clear if Quill's toolbar is actually a child
            toolbarContainerRef.current.innerHTML = '';
            console.log("QuillEditor.jsx: Toolbar container cleared during cleanup.");
        }
      }
    };
  }, [toolbarId]); // Dependencies: only toolbarId (and implicitly, the key prop in App.jsx remounts QuillEditor)

  // Effect 2: Update Quill's content when the `initialContent` or `initialDelta` prop changes.
  useEffect(() => {
    if (quillInstanceRef.current && isQuillInitializedRef.current) {
      console.log("QuillEditor.jsx: initialContent/Delta prop changed. Re-applying content.");
      setQuillContent(quillInstanceRef.current, initialContent, initialDelta, 'silent');
    }
  }, [initialContent, initialDelta]);

  // Effect 3: Handle readOnly prop changes dynamically
  useEffect(() => {
    if (quillInstanceRef.current) {
      const shouldBeEnabled = !readOnly;
      if (quillInstanceRef.current.isEnabled() !== shouldBeEnabled) {
        quillInstanceRef.current.enable(shouldBeEnabled);
        console.log(`QuillEditor.jsx: ReadOnly prop changed to ${readOnly}. Editor enabled state set to ${shouldBeEnabled}.`);
      }
    }
  }, [readOnly]); // Dependency: readOnly prop

  // Expose Quill methods via ref to parent
  useImperativeHandle(ref, () => ({
    getEditor: () => quillInstanceRef.current,
    setContents: (delta) => quillInstanceRef.current && quillInstanceRef.current.setContents(delta),
    getContents: () => quillInstanceRef.current ? quillInstanceRef.current.getContents() : null,
    getHTML: () => quillInstanceRef.current ? quillInstanceRef.current.root.innerHTML : '',
    enable: (value) => { // Expose enable method directly
        if (quillInstanceRef.current) {
            quillInstanceRef.current.enable(value);
        }
    }
  }));

  return (
    <div
      ref={quillEditorRef}
      className="quill-editor-content-area"
    />
  );
});

export default QuillEditor;