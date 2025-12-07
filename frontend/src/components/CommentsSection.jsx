import { useState, useEffect } from 'react';

export default function CommentsSection({ articleId }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [author, setAuthor] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingComment, setEditingComment] = useState(null);
  const [editContent, setEditContent] = useState('');

  // Load comments when component mounts
  useEffect(() => {
    if (articleId) {
      loadComments();
    }
  }, [articleId]);

  const loadComments = async () => {
    try {
      const res = await fetch(`http://localhost:3000/articles/${articleId}/comments`);
      if (!res.ok) throw new Error('Failed to load comments');
      const data = await res.json();
      setComments(data);
    } catch (err) {
      console.error('Error loading comments:', err);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoading(true);

    try {
      const res = await fetch(`http://localhost:3000/articles/${articleId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newComment.trim(),
          author: author.trim() || 'Anonymous'
        })
      });

      if (!res.ok) throw new Error('Failed to post comment');

      const createdComment = await res.json();
      setComments(prev => [...prev, createdComment]);
      setNewComment('');
      setAuthor('');
    } catch (err) {
      alert('Error posting comment: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (comment) => {
    setEditingComment(comment.id);
    setEditContent(comment.content);
  };

  const handleCancelEdit = () => {
    setEditingComment(null);
    setEditContent('');
  };

  const handleUpdateComment = async (commentId) => {
    if (!editContent.trim()) return;

    try {
      const res = await fetch(`http://localhost:3000/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: editContent.trim()
        })
      });

      if (!res.ok) throw new Error('Failed to update comment');

      const updatedComment = await res.json();
      setComments(prev => prev.map(comment => 
        comment.id === commentId ? updatedComment : comment
      ));
      setEditingComment(null);
      setEditContent('');
    } catch (err) {
      alert('Error updating comment: ' + err.message);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;

    try {
      const res = await fetch(`http://localhost:3000/comments/${commentId}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Failed to delete comment');

      setComments(prev => prev.filter(comment => comment.id !== commentId));
    } catch (err) {
      alert('Error deleting comment: ' + err.message);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="comments-section">
      <h3>Comments ({comments.length})</h3>

      <form onSubmit={handleSubmitComment} className="comment-form">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          rows="3"
          required
          className="comment-textarea"
        />
        
        <div className="comment-form-footer">
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Your name (optional)"
            className="comment-author-input"
          />
          <button 
            type="submit" 
            disabled={loading || !newComment.trim()}
            className="submit-comment-btn"
          >
            {loading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>

      <div className="comments-list">
        {comments.length === 0 ? (
          <p className="no-comments">No comments yet</p>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="comment-item">
              <div className="comment-header">
                <span className="comment-author">{comment.author}</span>
                <span className="comment-date">{formatDate(comment.createdAt)}</span>
              </div>
              
              {editingComment === comment.id ? (
                <div className="comment-edit">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows="3"
                    className="comment-edit-textarea"
                  />
                  <div className="comment-edit-actions">
                    <button 
                      onClick={() => handleUpdateComment(comment.id)}
                      className="save-edit-btn"
                    >
                      Save
                    </button>
                    <button 
                      onClick={handleCancelEdit}
                      className="cancel-edit-btn"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="comment-content">{comment.content}</div>
                  <div className="comment-actions">
                    <button
                      onClick={() => handleStartEdit(comment)}
                      className="edit-comment-btn"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="delete-comment-btn"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
