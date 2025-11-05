import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate  } from 'react-router-dom';
import { useArticleActions } from '../hooks/useArticleActions';

export default function ArticleView() {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const { deleteArticle } = useArticleActions();
  const navigate = useNavigate();

  // Fetch article data when component mounts or ID changes
  useEffect(() => {
    fetch(`http://localhost:3000/articles/${id}`)
      .then(res => res.json())
      .then(setArticle)
      .catch(console.error);
  }, [id]);

  const handleDelete = async () => {
    await deleteArticle(article.id, article.title, () => {
      navigate('/');
    });
  };

  if (!article) return <div>Loading...</div>;

  return (
    <div className='view'>
      <h2>{article.title}</h2>
      <div dangerouslySetInnerHTML={{ __html: article.content }} className='view-article'/>

      <div className="article-actions">
        <Link to={`/edit/${article.id}`} className="edit-link">Edit Article</Link>
        <button onClick={handleDelete} className="delete-btn">Delete Article</button>
        <Link to="/" className="back-link">Back to list</Link>
      </div>
    </div>
  );
}
