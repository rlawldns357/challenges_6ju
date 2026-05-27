# challenges_6ju

AI 기초 탄탄 클럽 6주 챌린지 - 최종 졸업 과제

집중 시간을 추적하고 분석하는 **풀스택 웹 앱** (뜯모도로 타이머 + 대시보드).

## Tech Stack
- **Frontend:** React 18, React Router, Recharts
- **Backend:** Python (Flask) + SQLite
- **Deployment:** GitHub Pages (frontend) / Railway (backend)

## Project structure

```
challenges_6ju/
  backend/         # Flask API
    main.py
    requirements.txt
  frontend/        # React app
    package.json
    public/
    src/
      pages/
        TimerPage.js
        HistoryPage.js
        DashboardPage.js
      api.js
      App.js
  railway.json     # Railway deploy config
```

## Local development

### 1. Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate    # (Windows: .venv\Scripts\activate)
pip install -r requirements.txt
python main.py               # http://localhost:5000
```

### 2. Frontend
```bash
cd frontend
npm install
npm start                    # http://localhost:3000
```

## Deployment

### Backend → Railway
```bash
npm install -g @railway/cli
railway login
railway init
railway up
```
Railway가 주는 public URL을 메모해 둡니다 (예: https://challenges-6ju.up.railway.app).

### Frontend → GitHub Pages
.env 파일에 백엔드 URL을 넣고 빌드/배포:
```bash
cd frontend
echo "REACT_APP_API_BASE=https://your-backend.up.railway.app" > .env
npm run build
npm run deploy
```
배포되면 주소: https://rlawldns357.github.io/challenges_6ju

## API
- `GET /subjects`, `POST /subjects`, `DELETE /subjects/<id>`
- `GET /sessions?subject_id&range`, `POST /sessions`, `DELETE /sessions/<id>`
- `GET /stats`
