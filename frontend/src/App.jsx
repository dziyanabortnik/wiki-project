import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import ArticleList from "./components/ArticleList";
import ArticleForm from "./components/ArticleForm";
import ArticleView from "./components/ArticleView";
import ArticleEdit from "./components/ArticleEdit";
import NotificationManager from "./components/NotificationManager";
import VersionHistoryPage from "./components/VersionHistory";
import Register from "./components/Register";
import Login from "./components/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import UserManagement from "./components/UserManagement";
import "./App.css";

function App() {
  return (
    <Router>
      <Navbar />
      <div className="container">
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <ArticleList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/new"
            element={
              <ProtectedRoute>
                <ArticleForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/view/:id"
            element={
              <ProtectedRoute>
                <ArticleView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/edit/:id"
            element={
              <ProtectedRoute>
                <ArticleEdit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/versions/:id"
            element={
              <ProtectedRoute>
                <VersionHistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute requireAdmin>
                <UserManagement />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <NotificationManager />
    </Router>
  );
}

export default App;
