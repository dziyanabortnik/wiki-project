import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

export default function ArticleView() {
  const { id } = useParams();
  const [article, setArticle] = useState(null);

  // Fetch article data when component mounts or ID changes
  useEffect(() => {
    fetch(`http://localhost:3000/articles/${id}`)
      .then(res => res.json())
      .then(setArticle)
      .catch(console.error);
  }, [id]);

  if (!article) return <div>Loading...</div>;

  return (
    <div className='view'>
      <h2>{article.title}</h2>
      <div dangerouslySetInnerHTML={{ __html: article.content }} />
      <Link to="/">Back to list</Link>
    </div>
  );
}
