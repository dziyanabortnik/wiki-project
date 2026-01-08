import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useArticleActions } from "../hooks/useArticleActions";
import WorkspaceTabs from "./WorkspaceTabs";
import { workspaceNames, getWorkspaceName } from "../constants/workspaces";
import { useAuth } from "../hooks/useAuth";

export default function ArticleList() {
  const [articles, setArticles] = useState([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [loading, setLoading] = useState(false);
  const { deleteArticle } = useArticleActions();
  const { getAuthHeader, user } = useAuth();

  const canEditArticle = (article) => {
    if (!user || !article) return false;
    return user.role === "admin" || article.userId === user.id;
  };

  // Fetch articles list when component mounts or workspace changes
  useEffect(() => {
    loadArticles();
  }, [selectedWorkspace]);

  const loadArticles = async () => {
    setLoading(true);
    try {
      const baseUrl = "/api/articles";
      const url =
        selectedWorkspace !== null
          ? `${baseUrl}?workspaceId=${selectedWorkspace}`
          : baseUrl;

      const res = await fetch(url, {
        headers: getAuthHeader(),
      });

      if (res.status === 401) {
        throw new Error("Session expired. Please login again.");
      }

      if (!res.ok) throw new Error("Failed to fetch articles");

      const data = await res.json();
      setArticles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch articles:", err);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async (id, title) => {
    await deleteArticle(id, title, () => {
      setArticles(articles.filter((article) => article.id !== id));
    });
  };

  // Generate create article URL with workspace preselected
  const getCreateArticleUrl = () => {
    if (selectedWorkspace) {
      return `/new?workspace=${selectedWorkspace}`;
    }
    return "/new";
  };

  const pageTitle =
    selectedWorkspace === null
      ? "All Articles"
      : getWorkspaceName(selectedWorkspace);

  return (
    <div className="list">
      <WorkspaceTabs
        currentWorkspace={selectedWorkspace}
        onWorkspaceChange={setSelectedWorkspace}
      />

      <div className="list-header">
        <h2>
          {pageTitle} ({articles.length})
        </h2>

        <Link to={getCreateArticleUrl()} className="create-new-btn">
          {articles.length === 0
            ? "Create First Article"
            : "Create New Article"}
        </Link>
      </div>

      {loading && <div className="loading">Loading articles...</div>}

      <ul>
        {articles.map((a) => (
          <li key={a.id} className="article-item">
            <Link to={`/view/${a.id}`} className="article-title">
              {a.title}
            </Link>

            <div className="article-meta">
              <div className="article-author">
                <div className="author-avatar">
                  {a.userName
                    ? a.userName
                        .split(" ")
                        .map((w) => w[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)
                    : "AN"}
                </div>
                <span>{a.userName}</span>
              </div>

              <div className="article-actions">
                {canEditArticle(a) && (
                  <>
                    <Link to={`/edit/${a.id}`} className="edit-link">
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(a.id, a.title)}
                      className="delete-btn"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {!loading && articles.length === 0 && (
        <div className="empty-state">
          <p>No articles found in this workspace.</p>
        </div>
      )}
    </div>
  );
}
