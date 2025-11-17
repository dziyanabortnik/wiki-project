import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate  } from 'react-router-dom';
import { useArticleActions } from '../hooks/useArticleActions';
import socket from '../services/socket';

export default function ArticleView() {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const { deleteArticle } = useArticleActions();
  const navigate = useNavigate();

  // Fetch article data when component mounts or ID changes
  useEffect(() => {
    fetch(`http://localhost:3000/articles/${id}`)
      .then(res => res.json())
      .then(setArticle)
      .catch(console.error);
  }, [id]);

  // Real-time updates via WebSocket
  useEffect(() => {
    if (!id) return;

    socket.emit('join-article', id);

    const handler = (updatedArticle) => {
      if (updatedArticle.id === id) {
        setArticle(updatedArticle);
        setAttachments(updatedArticle.attachments || []);
      }
    };

    socket.on('article-updated', handler);

    return () => {
      socket.off('article-updated', handler);
    };
  }, [id]); 

  const handleDelete = async () => {
    await deleteArticle(article.id, article.title, () => {
      navigate('/');
    });
  };

  // Open attachment in new window/tab
  const handleViewAttachment = (attachment) => {
    if (!attachment || !attachment.path) {
      console.error('Invalid attachment:', attachment);
      alert('Cannot open attachment: invalid file data');
      return;
    }
    
    const url = `http://localhost:3000${attachment.path.startsWith('/') ? '' : '/'}${attachment.path}`;
    console.log('Opening attachment URL:', url);
    
    try {
      new URL(url);
      if (attachment.mimetype.startsWith('image/') || attachment.mimetype === 'application/pdf') {
        window.open(url, '_blank', 'width=800,height=600');
      } else {
        window.open(url, '_blank');
      }
    } catch (urlError) {
      console.error('Invalid URL:', url, urlError);
      alert('Cannot open attachment: invalid URL format');
    }
  };

  if (!article) return <div>Loading...</div>;

  return (
    <div className='view'>
      <h2>{article.title}</h2>
      <div dangerouslySetInnerHTML={{ __html: article.content }} className='view-article'/>
      
      {article.attachments && article.attachments.length > 0 && (
        <div className="article-attachments">
          <h3>Attachments ({article.attachments.length})</h3>
          
          <div className="attachments-list">
            {article.attachments.map(attachment => (
              <div key={attachment.id}>
                <span className='attachment-name' onClick={() => handleViewAttachment(attachment)}>
                  {attachment.originalName}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="article-actions">
        <Link to={`/edit/${article.id}`} className="edit-link">Edit Article</Link>
        <button onClick={handleDelete} className="delete-btn">Delete Article</button>
        <Link to="/" className="back-link">Back to list</Link>
      </div>
    </div>
  );
}
