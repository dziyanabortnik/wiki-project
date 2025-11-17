import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ArticleList from './components/ArticleList';
import ArticleForm from './components/ArticleForm';
import ArticleView from './components/ArticleView';
import ArticleEdit from './components/ArticleEdit';
import NotificationManager from './components/NotificationManager';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ArticleList />} />
        <Route path="/new" element={<ArticleForm />} />
        <Route path="/view/:id" element={<ArticleView />} />
        <Route path="/edit/:id" element={<ArticleEdit />} />
      </Routes>

      <NotificationManager/>
    </Router>
  );
}
