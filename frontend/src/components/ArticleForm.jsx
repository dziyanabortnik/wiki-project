import { useState, forwardRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import "../App.css";
import AttachmentManager from "./AttachmentManager";
import { workspaceNames } from '../constants/workspaces';
import { useAuth } from '../hooks/useAuth';

const QuillEditor = forwardRef(({ value, onChange }, ref) => (
  <ReactQuill ref={ref} value={value} onChange={onChange} />
));

export default function ArticleForm() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedWorkspace, setSelectedWorkspace] = useState("uncategorized");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [attachments, setAttachments] = useState([]);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { getAuthHeader } = useAuth();

  // Auto-select workspace from URL parameter
  useEffect(() => {
    const workspaceFromUrl = searchParams.get('workspace');
    if (workspaceFromUrl && workspaceNames[workspaceFromUrl]) {
      setSelectedWorkspace(workspaceFromUrl);
      console.log('Auto-selected workspace from URL:', workspaceFromUrl);
    }
  }, [searchParams]);

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
      const articleRes = await fetch('/api/articles', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({
          title,
          content,
          workspaceId: selectedWorkspace || null,
        }),
      });

      if (articleRes.status === 401) {
        throw new Error('Session expired. Please login again.');
      }

      if (!articleRes.ok) {
        const errorText = await articleRes.text();
        console.error("Server response:", errorText);
        throw new Error(errorText || `Failed to create article (${articleRes.status})`);
      }

      const articleData = await articleRes.json();
      const articleId = articleData.article.id;
      console.log('Article created with ID:', articleId);

       // Upload attachments if any
      if (attachments.length > 0) {
        console.log(`Uploading ${attachments.length} attachments...`);
        
        const formData = new FormData();
        attachments.forEach(attachment => {
          formData.append('files', attachment.file);
        });

        try {
          console.log('Uploading attachments...');
          const attachmentRes = await fetch(`/api/articles/${articleId}/attachments`, {
            method: 'POST',
            headers: getAuthHeader(),
            body: formData,
          });

          if (!attachmentRes.ok) {
            const errorText = await attachmentRes.text();
            console.warn('Failed to upload attachments:', errorText);
          } else {
            console.log('Attachments uploaded successfully');
          }
        } catch (attachmentErr) {
          console.error('Error uploading attachments:', attachmentErr);
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

        <div className="workspace-selector">
          <label>Select Workspace: </label>

          <select
            value={selectedWorkspace}
            onChange={(e) => setSelectedWorkspace(e.target.value)}
            required
          >
            <option value="uncategorized">Uncategorized</option>
            <option value="nature">Nature & Science</option>
            <option value="culture">Culture & Arts</option>
            <option value="tech">Technology</option>
            <option value="education">Education</option>
          </select>
        </div>

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
