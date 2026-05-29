<<<<<<< HEAD
# Scholarship Bloom

This workspace contains a split frontend and backend implementation for a scholarship recommendation system.

## Frontend

Location: `frontend`

- React app scaffolded with `create-react-app` style structure
- Uses responsive soft-color UI with card-based layout
- Includes registration, document uploads, recommendation list, progress bar, and notification panel

### Run frontend

```powershell
cd frontend
npm install
npm start
```

## Backend

Location: `backend`

- Flask API with CORS enabled
- `/api/status` health check
- `/api/recommendations` accepts profile + documents and returns matching scholarships
- `/api/documents` returns required document list

### Train backend ML model

```powershell
cd backend
python -m venv venv
venv\Scripts\Activate.ps1
pip install -r requirements.txt
python train_model.py
```

### Run backend

```powershell
cd backend
python -m venv venv
venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

## Notes

- Frontend is currently client-side only and can be extended to call the Flask API endpoints.
- The backend provides a simple recommendation engine based on income, CGPA, category, course, and location.
=======
# Scholarship Bloom

This workspace contains a split frontend and backend implementation for a scholarship recommendation system.

## Frontend

Location: `frontend`

- React app scaffolded with `create-react-app` style structure
- Uses responsive soft-color UI with card-based layout
- Includes registration, document uploads, recommendation list, progress bar, and notification panel

### Run frontend

```powershell
cd frontend
npm install
npm start
```

## Backend

Location: `backend`

- Flask API with CORS enabled
- `/api/status` health check
- `/api/recommendations` accepts profile + documents and returns matching scholarships
- `/api/documents` returns required document list

### Train backend ML model

```powershell
cd backend
python -m venv venv
venv\Scripts\Activate.ps1
pip install -r requirements.txt
python train_model.py
```

### Run backend

```powershell
cd backend
python -m venv venv
venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

## Notes

- Frontend is currently client-side only and can be extended to call the Flask API endpoints.
- The backend provides a simple recommendation engine based on income, CGPA, category, course, and location.
>>>>>>> 51e11720cff3768d449587e0d97fd34cdc7967b7
