# SmartSlider - AI-Powered Presentation Reviewer

SmartSlider is a web application that analyzes technical presentation slides (PDF or PPTX) using Google's Gemini 3 Pro model. It identifies errors, suggests quality enhancements, and highlights pedagogical strengths.

## 🚀 Developer Guide

Follow these steps to set up and run the project locally.

### Prerequisites

*   **Node.js** (v18 or higher)
*   A **Google Gemini API Key** (Get one here: [aistudio.google.com](https://aistudio.google.com))

### Installation & Setup

1.  **Clone the repository**
    ```bash
    git clone https://github.com/Newton-School/SmartSlider.git
    cd SmartSlider
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**
    Create a `.env` file in the root directory. Add your Gemini API Key with the `VITE_` prefix:
    
    ```env
    VITE_API_KEY=your_actual_gemini_api_key_here
    ```
    
    > **Note:** The app uses `VITE_API_KEY` for local development security.

4.  **Run the Application**
    ```bash
    npm run dev
    ```
    
    The app will start at `http://localhost:5173`.

### How to Verify

1.  Open `http://localhost:5173` in your browser.
2.  Enter a dummy subject in the "Subject / Course Name" field (e.g., "Introduction to React").
3.  Upload a **PDF** or **PPTX** file (must be under 100MB).
4.  Wait for the progress bar to complete ("Reviewing...").
5.  Verify that all 3 result cards (Errors, Improvements, Strengths) are populated.

### Troubleshooting

*   **Error: "process is not defined" or API Key missing**: Ensure you created the `.env` file in the root directory and named the variable `VITE_API_KEY`.
*   **Error: "400 Bad Request"**: The file might be corrupted or in an unsupported legacy format (old `.ppt` binary files). Only modern `.pptx` (XML-based) and `.pdf` files are supported.
*   **Stuck at 95%**: Check the browser console (F12) for network errors.
