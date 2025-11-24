# Frontend + Backend Integration (Development)

This project includes a simple static frontend (HTML pages at project root) and an Express backend in `web_backend/`.

Quick start (macOS / zsh):

1. Copy example env and fill values:

```bash
cp web_backend/.env.example web_backend/.env
# edit web_backend/.env and set OPENAI_GPT_KEY if available
```

2. Install dependencies and run the backend (from project root):

```bash
cd web_backend
npm install
# create/dev DB if needed
npx prisma migrate dev
npm run dev
```

3. Open the frontend pages served by the backend in your browser:

- http://localhost:4000/dashborad.html
- http://localhost:4000/login.html
- http://localhost:4000/legistration.html
- http://localhost:4000/myplan.html
- http://localhost:4000/userprofile.html
- http://localhost:4000/detail.html
- http://localhost:4000/feedback.html

Notes:
- The backend serves the static files (dev-only). In production you should build and serve the frontend separately (or from a CDN).
- If you don't have an OpenAI API key, the system fallback will return default recommendations.
- The frontend uses a small client helper at `/js/api.js` to call `/api/*` endpoints and stores JWT in `localStorage`.

Next steps you may want me to do:
- Render recommendation lists into `dashborad.html` and `myplan.html` with real data.
- Improve form validation & error UI on `login.html` and `legistration.html`.
- Add automated tests for auth flows.
