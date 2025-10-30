import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function ArticleList() {
  const [articles, setArticles] = useState([]);

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


  return (
    <div className='list'>
      <h2>Articles</h2>
      <Link to="/new">Create New Article</Link>
      <ul>
        {articles.map(a => (
          <li key={a.id}>
            <Link to={`/view/${a.id}`}>{a.title}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
