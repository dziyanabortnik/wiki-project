import { useState, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import '../App.css'

const QuillEditor = forwardRef(({ value, onChange }, ref) => (
  <ReactQuill ref={ref} value={value} onChange={onChange} />
));

export default function ArticleForm() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Title is required.');
      return;
    }

    const textOnly = content.replace(/<[^>]*>/g, '').trim();
    if (!textOnly) {
      setError('Content is required.');
      return;
    }

    if (!title.trim() || !content.trim()) {
      setError('Title and content are required.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('http://localhost:3000/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      });

      let data;
      try {
        data = await res.json();
      } catch (parseErr) {
        throw new Error('Server returned invalid JSON');
      }

      if (!res.ok) {
        console.error('Server error:', data);
        throw new Error(data?.error || 'Failed to create article');
      }

      console.log('Article created:', data);
      navigate('/');
    } catch (err) {
      console.error('Submission failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='article'>
      <h2>Create New Article</h2>

      {error && (
        <div className='error-message'>
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className='create-input'
        />
        <QuillEditor value={content} onChange={setContent} />
        <button type="submit" disabled={loading} className='create-button'>
          {loading ? 'Submitting...' : 'Submit'}
        </button>
      </form>
    </div>
  );
}
