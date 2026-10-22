# Inventory Management System

This project has two parts:
- Backend: Spring Boot + Java + MySQL
- Frontend: React + Vite

## 1) Start the backend
Open PowerShell in the backend project folder:

```powershell
cd "C:\Users\HYGUETTE\IdeaProjects\inventory_management_system"
.
\mvnw spring-boot:run
```

If the backend is not built yet, run:

```powershell
cd "C:\Users\HYGUETTE\IdeaProjects\inventory_management_system"
.
\mvnw clean install
.
\mvnw spring-boot:run
```

If port 8080 is already in use, stop the old Java process first, then rerun:

```powershell
Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
Stop-Process -Id <PID> -Force
```

## 2) Start the frontend
Open a second PowerShell terminal in the frontend project folder:

```powershell
cd "C:\Users\HYGUETTE\IdeaProjects\inventory_management_frontend"
npm install
npm run dev -- --host 0.0.0.0
```

Then open:
- Frontend: http://localhost:5173
- Backend: http://localhost:8080

## 3) Useful checks
Backend health/test:

```powershell
cd "C:\Users\HYGUETTE\IdeaProjects\inventory_management_system"
.
\mvnw test
```

Frontend build check:

```powershell
cd "C:\Users\HYGUETTE\IdeaProjects\inventory_management_frontend"
npm run build
```

## 4) Project setup notes
- MySQL database should be running on `localhost:3306`
- Database name: `inventory_management`
- Backend config is in `src/main/resources/application.properties`
- Frontend API base URL is configured in `src/services/api.js`

## 5) Quick copy-paste commands
```powershell
# Backend
cd "C:\Users\HYGUETTE\IdeaProjects\inventory_management_system"
.
\mvnw spring-boot:run

# Frontend
cd "C:\Users\HYGUETTE\IdeaProjects\inventory_management_frontend"
npm install
npm run dev -- --host 0.0.0.0
```
