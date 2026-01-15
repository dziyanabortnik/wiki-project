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
import { useAuth } from "../hooks/useAuth";

export default function ArticleView() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const versionNumber = searchParams.get("version");
  const [article, setArticle] = useState(null);
  const [isHistorical, setIsHistorical] = useState(false);
  const [versionsCount, setVersionsCount] = useState(0);
  const { deleteArticle, loading, error } = useArticleActions();
  const navigate = useNavigate();
  const { getAuthHeader, user } = useAuth();

  const canEditArticle = () => {
    if (!user || !article) return false;
    return user.role === "admin" || article.userId === user.id;
  };

  //Fetch article data
  useEffect(() => {
    let url = `/api/articles/${id}`;
    let isHistoricalMode = false;

    if (versionNumber) {
      url = `/api/versions/${id}/versions/${versionNumber}`;
      isHistoricalMode = true;
    }

    console.log("Fetching from:", url);
    fetch(url, {
      headers: getAuthHeader(),
    })
      .then((res) => {
        console.log("Response status:", res.status);
        if (res.status === 401) {
          throw new Error("Session expired. Please login again.");
        }
        if (res.status === 404) {
          throw new Error("Article or version not found");
        }
        return res.json();
      })
      .then((data) => {
        console.log("Received data:", data);
        setArticle(data);
        setIsHistorical(isHistoricalMode || data.isHistorical);
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setError(err.message);
      });

    if (!versionNumber) {
      fetch(`/api/versions/${id}/versions`, {
        headers: getAuthHeader(),
      })
        .then((res) => {
          if (res.status === 401) {
            throw new Error("Session expired. Please login again.");
          }
          return res.json();
        })
        .then((versions) => {
          console.log("Versions loaded:", versions);
          setVersionsCount(Array.isArray(versions) ? versions.length : 0);
        })
        .catch((err) => {
          console.error("Failed to load versions:", err);
          setVersionsCount(0);
        });
    }
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
    if (!url.startsWith("http")) {
      url = `http://localhost:3000${url.startsWith("/") ? "" : "/"}${url}`;
    }
    window.open(url, "_blank");
  };

  const handleExportPDF = async () => {
    try {
      console.log(`Exporting article ${id} to PDF...`);

      const response = await fetch(`/api/articles/${id}/export`, {
        headers: getAuthHeader(),
      });

      if (response.status === 401) {
        throw new Error("Please login to export articles");
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Export failed: ${response.status} ${errorText}`);
      }

      // Get PDF blob
      const pdfBlob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `article-${article?.title || id}-${new Date()
        .toISOString()
        .slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log("PDF exported successfully");
    } catch (err) {
      console.error("Export error:", err);
      alert(`Error exporting PDF: ${err.message}`);
    }
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
          {article.user && <small> by {article.user.name}</small>}
          <br />
          <div className="historical-actions">
            <Link to={`/versions/${id}`} className="history-link">
              Back to version history
            </Link>
          </div>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      <div className="article-header">
        <h2>{article.title}</h2>
        <div className="article-meta">
          <span className="workspace-badge">
            {getWorkspaceName(article.workspaceId)}
          </span>

          {article.user && (
            <div className="article-author">
              <div className="author-avatar">
                {article.user.name
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </div>
              <span>Created by {article.user.name}</span>
            </div>
          )}

          {!isHistorical && (
            <span className="versions-count">
              <Link to={`/versions/${id}`}>
                {versionsCount > 1 ? (
                  <>
                    {versionsCount - 1} change
                    {versionsCount - 1 !== 1 ? "s" : ""}
                  </>
                ) : (
                  "Version History"
                )}
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
        {!isHistorical && canEditArticle() && (
          <>
            <Link to={`/edit/${article.id}`} className="edit-link">
              Edit Article
            </Link>

            <button onClick={handleExportPDF} className="export-pdf-btn">
              Export as PDF
            </button>

            <button
              onClick={handleDelete}
              className="delete-btn"
              disabled={loading}
            >
              {loading ? "Deleting..." : "Delete Article"}
            </button>
          </>
        )}
        <Link to="/" className="back-link">
          Back to list
        </Link>
      </div>
    </div>
  );
}
