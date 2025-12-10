import { useEffect, useState } from "react";
import {
  useParams,
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { useArticleActions } from "../hooks/useArticleActions";
import socket from "../services/socket";
import { getWorkspaceName } from "../constants/workspaces";
import CommentsSection from "./CommentsSection";

export default function ArticleView() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const versionNumber = searchParams.get("version");
  const [article, setArticle] = useState(null);
  const [isHistorical, setIsHistorical] = useState(false);
  const [versionsCount, setVersionsCount] = useState(0);
  const { deleteArticle, loading, error } = useArticleActions();
  const navigate = useNavigate();

  //Fetch article data
  useEffect(() => {
    let url = `http://localhost:3000/articles/${id}`;
    if (versionNumber) {
      url = `http://localhost:3000/articles/${id}/versions/${versionNumber}`;
      setIsHistorical(true);
    }

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setArticle(data);
        if (data.isHistorical) setIsHistorical(true);
      })
      .catch(console.error);

    // Load versions count only
    fetch(`http://localhost:3000/articles/${id}/versions`)
      .then((res) => res.json())
      .then((versions) => setVersionsCount(versions.length))
      .catch(console.error);
  }, [id, versionNumber]);

  // Real-time updates
  useEffect(() => {
    if (!id || isHistorical) return;

    socket.emit("join-article", id);
    const handler = (updatedArticle) => {
      if (updatedArticle.id === id) setArticle(updatedArticle);
    };
    socket.on("article-updated", handler);
    return () => socket.off("article-updated", handler);
  }, [id, isHistorical]);

  const handleDelete = async () => {
    await deleteArticle(id, article?.title || "Article", () => navigate("/"));
  };

  const handleViewAttachment = (attachment) => {
    if (!attachment?.path) {
      alert("Cannot open attachment");
      return;
    }

    let url = attachment.path;
    if (!url.startsWith('http')) {
      url = `http://localhost:3000${url.startsWith("/") ? "" : "/"}${url}`;
    }
    window.open(url, "_blank");
  };

  if (!article) return <div>Loading...</div>;

  const displayAttachments = article.attachments || [];

  return (
    <div className="view">
      {isHistorical && (
        <div className="historical-warning">
          <strong>You are viewing version {versionNumber}</strong>
          <br />
          <small>Created: {new Date(article.createdAt).toLocaleString()}</small>
          <br />
          <div className="historical-actions">
            <Link to={`/article/${id}/versions`} className="history-link">
              Back to version history
            </Link>
          </div>
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="article-header">
        <h2>{article.title}</h2>
        <div className="article-meta">
          <span className="workspace-badge">
            {getWorkspaceName(article.workspaceId)}
          </span>
          {!isHistorical && versionsCount > 1 && (
            <span className="versions-count">
              <Link to={`/article/${id}/versions`}>
                {versionsCount - 1} change{versionsCount - 1 !== 1 ? "s" : ""}
              </Link>
            </span>
          )}
        </div>
      </div>

      <div
        dangerouslySetInnerHTML={{ __html: article.content }}
        className="view-article"
      />

      {displayAttachments.length > 0 && (
        <div className="article-attachments">
          <h3>Attachments ({displayAttachments.length})</h3>
          <div className="attachments-list">
            {displayAttachments.map((attachment) => (
              <div key={attachment.id || attachment.filename}>
                <span
                  className="attachment-name"
                  onClick={() => handleViewAttachment(attachment)}
                >
                  {attachment.originalName}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isHistorical && <CommentsSection articleId={id} />}

      <div className="article-actions">
        {!isHistorical && (
          <Link to={`/edit/${article.id}`} className="edit-link">
            Edit Article
          </Link>
        )}
        {!isHistorical && (
          <button 
            onClick={handleDelete} 
            className="delete-btn"
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete Article'}
          </button>
        )}
        <Link to="/" className="back-link">
          Back to list
        </Link>
      </div>
    </div>
  );
}
