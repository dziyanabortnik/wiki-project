import { useState, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const QuillEditor = forwardRef(({ value, onChange }, ref) => (
  <ReactQuill ref={ref} value={value} onChange={onChange} />
));

export default function ArticleForm() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      alert('Title and content are required.');
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
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='article'>
      <h2>Create New Article</h2>
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
