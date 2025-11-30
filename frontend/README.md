# Frontend Setup Guide

This frontend is a static HTML/CSS/JavaScript application. Here are several ways to run it:

## Option 1: Simple HTTP Server (Recommended - Easiest)

### Using Python's built-in HTTP server:

```bash
# Navigate to the frontend directory
cd Stroke-Website-Project/frontend

# Python 3
python -m http.server 3000

# Or Python 2
python -m SimpleHTTPServer 3000
```

Then open your browser and go to: `http://localhost:3000`

## Option 2: Using Node.js http-server

If you have Node.js installed:

```bash
# Install http-server globally (one time)
npm install -g http-server

# Navigate to frontend directory
cd Stroke-Website-Project/frontend

# Start the server
http-server -p 3000
```

Then open: `http://localhost:3000`

## Option 3: Using VS Code Live Server Extension

1. Install the "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"
4. The page will automatically open in your browser

## Option 4: Direct File Opening (Limited)

You can directly open `index.html` in your browser, but some features may not work due to CORS restrictions when making API calls.

## Option 5: Using Flask (If you prefer)

If you want to use Flask as mentioned in requirements.txt:

```bash
cd Stroke-Website-Project/frontend
python -m pip install -r requirements.txt
python server.py  # (You'll need to create a simple Flask server)
```

## Important Notes:

1. **Backend must be running**: Make sure your FastAPI backend is running on `http://localhost:8000`
   ```bash
   cd ../backend
   python server.py
   ```

2. **CORS**: The backend is configured to accept requests from any origin, so you should be able to make API calls from any of these methods.

3. **Starting point**: 
   - Landing page: `http://localhost:3000/index.html` or `http://localhost:3000/`
   - Sign in: `http://localhost:3000/signin.html`
   - Sign up: `http://localhost:3000/signup.html`
   - Prediction: `http://localhost:3000/prediction.html` (requires login)

## Recommended Setup:

1. **Terminal 1** - Run backend:
   ```bash
   cd Stroke-Website-Project/backend
   python server.py
   ```

2. **Terminal 2** - Run frontend:
   ```bash
   cd Stroke-Website-Project/frontend
   python -m http.server 3000
   ```

3. Open browser and go to: `http://localhost:3000`


