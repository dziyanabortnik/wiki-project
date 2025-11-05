import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useArticleActions } from '../hooks/useArticleActions';

export default function ArticleList() {
  const [articles, setArticles] = useState([]);
  const { deleteArticle } = useArticleActions();

  // Fetch articles list on component mount
  useEffect(() => {
    fetch('http://localhost:3000/articles')
      .then(res => res.json())
      .then(data => {
        // Handle case where response is not an array
        if (!Array.isArray(data)) {
          console.warn('Expected array but got', data);
          setArticles([]);
        } else {
          setArticles(data);
        }
      })
      .catch(err => {
        console.error('Failed to fetch articles', err);
        setArticles([]);
      });
  }, []);

  const handleDelete = async (id, title) => {
    await deleteArticle(id, title, () => {
      setArticles(articles.filter(article => article.id !== id));
    });
  };

  return (
    <div className='list'>
      <h2>Articles</h2>

      <Link to='/new' className='create-new-btn'>Create New Article</Link>

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
    </div>
  );
}
