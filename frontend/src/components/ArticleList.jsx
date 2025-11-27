import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useArticleActions } from '../hooks/useArticleActions';
import WorkspaceTabs from './WorkspaceTabs';
import { workspaceNames, getWorkspaceName } from '../constants/workspaces';

export default function ArticleList() {
  const [articles, setArticles] = useState([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [loading, setLoading] = useState(false);
  const { deleteArticle } = useArticleActions();

  // Fetch articles list when component mounts or workspace changes
  useEffect(() => {
    loadArticles();
  }, [selectedWorkspace]);

  const loadArticles = async () => {
    setLoading(true);
    try {
      const baseUrl = 'http://localhost:3000/articles';
      const url = selectedWorkspace !== null 
        ? `${baseUrl}?workspaceId=${selectedWorkspace}`
        : baseUrl;

      console.log('Fetching from URL:', url);
      
      const res = await fetch(url);
      console.log('Response status:', res.status);
      
      if (!res.ok) throw new Error('Failed to fetch articles');
      
      const data = await res.json();
      console.log('Received articles:', data);
      setArticles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch articles:', err);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, title) => {
    await deleteArticle(id, title, () => {
      setArticles(articles.filter(article => article.id !== id));
    });
  };

  // Generate create article URL with workspace preselected
  const getCreateArticleUrl = () => {
    if (selectedWorkspace) {
      return `/new?workspace=${selectedWorkspace}`;
    }
    return '/new';
  };

  const pageTitle = selectedWorkspace === null 
    ? 'All Articles' 
    : getWorkspaceName(selectedWorkspace);

  return (
    <div className='list'>
      <WorkspaceTabs
        currentWorkspace={selectedWorkspace}
        onWorkspaceChange={setSelectedWorkspace}
      />

      <div className="list-header">
        <h2>{pageTitle} ({articles.length})</h2>
        
        <Link to={getCreateArticleUrl()} className='create-new-btn'>
          {articles.length === 0 ? 'Create First Article' : 'Create New Article'}
        </Link>
      </div>

      {loading && <div className="loading">Loading articles...</div>}

      <ul>
        {articles.map(a => (
          <li key={a.id} className='article-item'>
            <Link to={`/view/${a.id}`} className='article-title'>{a.title}</Link>
            
            <div className="article-actions">
              <Link to={`/edit/${a.id}`} className="edit-link">Edit</Link>
              <button onClick={() => handleDelete(a.id, a.title)} className="delete-btn">Delete</button>
            </div>
          </li>
        ))}
      </ul>

      {!loading && articles.length === 0 && (
        <div className="empty-state">
          <p>No articles found in this workspace.</p>
        </div>
      )}
    </div>
  );
}
