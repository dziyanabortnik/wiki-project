import { useState, useEffect, forwardRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const QuillEditor = forwardRef(({ value, onChange }, ref) => (
  <ReactQuill ref={ref} value={value} onChange={onChange} />
));

export default function ArticleEdit() {
  const { id } = useParams();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [articleExists, setArticleExists] = useState(true);
  const navigate = useNavigate();

  // Load article data when component mounts
  useEffect(() => {
    setLoading(true);
    fetch(`http://localhost:3000/articles/${id}`)
      .then(res => {
        if (!res.ok) {
          if (res.status === 404) {
            setArticleExists(false);
            setError('Article not found');
          } else {
            throw new Error('Failed to load article');
          }
          return null;
        }
        return res.json();
      })
      .then(article => {
        if (article) {
          setTitle(article.title);
          setContent(article.content);
          setArticleExists(true);
        }
      })
      .catch(err => {
        console.error('Failed to load article:', err);
        setError('Failed to load article');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!articleExists) {
      setError('Cannot update: Article no longer exists');
      return;
    }

    if (!title.trim() || !content.trim()) {
      setError('Title and content are required.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`http://localhost:3000/articles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      });

      if (res.status === 404) {
        setArticleExists(false);
        throw new Error('Article not found - it may have been deleted');
      }

      let data;
      try {
        data = await res.json();
      } catch (parseErr) {
        throw new Error('Server returned invalid JSON');
      }

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to update article');
      }

      console.log('Article updated:', data);
      navigate('/');
    } catch (err) {
      console.error('Update failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  if (!articleExists && !loading) {
    return (
      <div className='article'>
        <h2>Article Not Found</h2>
        <div className="error-message">
          The article you're trying to edit does not exist or has been deleted.
        </div>
        <button 
          onClick={() => navigate('/')}
          className='cancel-button'
        >
          Back to Articles List
        </button>
      </div>
    );
  }

  return (
    <div className='article'>
      <h2>Edit Article</h2>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          disabled={!articleExists || loading}
          className='create-input'
        />

        <QuillEditor value={content} onChange={setContent} />

        <div className="form-actions">
          <button 
            type="submit" 
            disabled={loading || !articleExists}
            className='create-button'
          >
            {loading ? 'Updating...' : 'Update Article'}
          </button>

          <button 
            type="button" 
            onClick={handleCancel} 
            disabled={loading}
            className='cancel-button'
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}