import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";

export default function CommentsSection({ articleId }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingComment, setEditingComment] = useState(null);
  const [editContent, setEditContent] = useState("");
  const { user, getAuthHeader, isAuthenticated } = useAuth();

  // Load comments when component mounts or articleId changes
  useEffect(() => {
    if (articleId) {
      loadComments();
    }
  }, [articleId]);

  const loadComments = async () => {
    try {
      const res = await fetch(`/api/articles/${articleId}/comments`, {
        headers: getAuthHeader(),
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Please login to view comments");
        }
        throw new Error("Failed to load comments");
      }

      const data = await res.json();
      setComments(data);
    } catch (err) {
      console.error("Error loading comments:", err);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoading(true);

    try {
      const res = await fetch(`/api/articles/${articleId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          content: newComment.trim(),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to post comment");
      }

      const data = await res.json();
      const createdComment = data.comment || data;

      setComments((prev) => [createdComment, ...prev]);
      setNewComment("");
    } catch (err) {
      alert("Error posting comment: " + err.message);
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
    setEditContent("");
  };

  const handleUpdateComment = async (commentId) => {
    if (!editContent.trim()) return;

    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          content: editContent.trim(),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update comment");
      }

      const data = await res.json();
      const updatedComment = data.comment || data;

      setComments((prev) =>
        prev.map((comment) =>
          comment.id === commentId ? updatedComment : comment
        )
      );
      setEditingComment(null);
      setEditContent("");
    } catch (err) {
      alert("Error updating comment: " + err.message);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Delete this comment?")) return;

    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
        headers: getAuthHeader(),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete comment");
      }

      setComments((prev) => prev.filter((comment) => comment.id !== commentId));
    } catch (err) {
      alert("Error deleting comment: " + err.message);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Helper function to get display name from comment
  const getDisplayName = (comment) => {
    return comment.user?.name || comment.author || "User";
  };

  // Helper function to get avatar initials from name
  const getAvatarInitials = (comment) => {
    const name = getDisplayName(comment);
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="comments-section">
      <h3>Comments ({comments.length})</h3>

      {isAuthenticated ? (
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
            <div className="user-info">
              <span>
                Posting as: <strong>{user?.name || "User"}</strong>
              </span>
            </div>
            <button
              type="submit"
              disabled={loading || !newComment.trim()}
              className="submit-comment-btn"
            >
              {loading ? "Posting..." : "Post"}
            </button>
          </div>
        </form>
      ) : (
        <div className="login-prompt">
          <p>
            Please <a href="/login">login</a> to post comments.
          </p>
        </div>
      )}

      <div className="comments-list">
        {comments.length === 0 ? (
          <p className="no-comments">No comments yet</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="comment-item">
              <div className="comment-header">
                <div className="comment-author">
                  <div className="comment-avatar">
                    {getAvatarInitials(comment)}
                  </div>
                  <span>
                    {getDisplayName(comment)}
                    {comment.user?.id === user?.id && (
                      <span className="you-badge"> (you)</span>
                    )}
                  </span>
                </div>
                <span className="comment-date">
                  {formatDate(comment.createdAt)}
                </span>
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
                  {comment.user?.id === user?.id && (
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
                  )}
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
