import { useState, forwardRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import '../App.css'
import AttachmentManager from './AttachmentManager';

const QuillEditor = forwardRef(({ value, onChange }, ref) => (
  <ReactQuill ref={ref} value={value} onChange={onChange} />
));

export default function ArticleForm() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [attachments, setAttachments] = useState([]);
  const navigate = useNavigate();

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      attachments.forEach(attachment => {
        if (attachment.previewUrl) {
          URL.revokeObjectURL(attachment.previewUrl);
        }
      });
    };
  }, [attachments]);

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
      const articleRes = await fetch('http://localhost:3000/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      });

      if (!articleRes.ok) {
        const errorText = await articleRes.text();
        throw new Error(errorText || `Failed to create article (${articleRes.status})`);
      }

      const articleData = await articleRes.json();
      const articleId = articleData.id;
      console.log('Article created with ID:', articleId);

       // Upload attachments if any
      if (attachments.length > 0) {
        console.log(`Uploading ${attachments.length} attachments...`);
        
        for (const attachment of attachments) {
          try {
            const formData = new FormData();
            formData.append('files', attachment.file);

            console.log(`Uploading attachment: ${attachment.originalName}`);
            const attachmentRes = await fetch(`http://localhost:3000/articles/${articleId}/attachments`, {
              method: 'POST',
              body: formData,
            });

            if (!attachmentRes.ok) {
              const errorText = await attachmentRes.text();
              console.warn(`Failed to upload attachment ${attachment.originalName}:`, errorText);
            } else {
              console.log(`Attachment uploaded: ${attachment.originalName}`);
            }
          } catch (attachmentErr) {
            console.error(`Error uploading attachment ${attachment.originalName}:`, attachmentErr);
          }
        }
      }

      console.log('Article creation completed:', articleData);
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

        <AttachmentManager
          articleId={null}
          attachments={attachments}
          onAttachmentsChange={setAttachments}
          creationMode={true}
        />

        <button type="submit" disabled={loading} className='create-button'>
          {loading ? 'Submitting...' : 'Submit'}
        </button>
      </form>
    </div>
  );
}
