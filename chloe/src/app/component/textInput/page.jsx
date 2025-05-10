'use client'
import { useState, useRef } from 'react' // Import useRef
import styles from './page.module.css' // Make sure this path is correct

export default function Input() {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [response, setResponse] = useState('')
    const [currentPrompt, setCurrentPrompt] = useState('') // State to hold the div's content

    const editableDivRef = useRef(null); // Create a ref for the div

    // Function to update currentPrompt state when div content changes
    const handleDivInput = (e) => {
        setCurrentPrompt(e.currentTarget.innerText);
    };

    const handleSubmit = async (event) => {
      // If handleSubmit is called by a form submission or a direct button click,
      // event might be present and you might want to prevent default.
      // If called manually after an Enter key press, event might not be relevant here
      // or you might pass the original keyboard event.
      if (event && typeof event.preventDefault === 'function') {
        event.preventDefault();
      }

      if (!currentPrompt.trim()) { // Don't submit if prompt is empty
          setError("Please enter a prompt.");
          return;
      }

      setIsLoading(true)
      setError('')
      setResponse('')

      try {
        const res = await fetch('/api/chat', { // Use absolute path for API route
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt: currentPrompt }), // Use state for prompt
        })

        if (!res.ok) {
          const errorData = await res.json()
          throw new Error(errorData.error || `API REQ FAILED: ${res.status}`)
        }

        const data = await res.json()
        setResponse(data.response)
        // Optionally clear the input after successful submission
        // setCurrentPrompt(''); // Clear the state
        // if (editableDivRef.current) {
        //   editableDivRef.current.innerText = ''; // Clear the div content
        // }

      } catch (err) {
        setError(err.message)
        console.error('Error fetching response:', err)
      } finally {
        setIsLoading(false)
      }
    }

    // Handle keydown specifically for "Enter" to submit
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { // Submit on Enter (but not Shift+Enter for newline)
            e.preventDefault(); // Prevent adding a new line in the div
            handleSubmit();     // Call handleSubmit without the event, or pass e if needed
        }
    };

    return (
      <div className={styles.formContainer}> {/* A container for input and button */}
        <div
          ref={editableDivRef} // Assign the ref
          className={styles.inputContainer} // Your existing class
          contentEditable='true'
          spellCheck='false'
          onInput={handleDivInput} // Update state on input
          onKeyDown={handleKeyDown} // Handle Enter key for submission
          role="textbox" // For accessibility
          aria-multiline="true" // For accessibility
          suppressContentEditableWarning={true} // Suppresses React warning about contentEditable
        />
        <button onClick={handleSubmit} disabled={isLoading} className={styles.submitButton}>
          {isLoading ? 'Sending...' : 'Send'}
        </button>

        {error && <p className={styles.errorText}>Error: {error}</p>}
        {response && (
          <div className={styles.responseTextContainer}>
            <h2>Response:</h2>
            <pre>{response}</pre>
          </div>
        )}
      </div>
    )
}