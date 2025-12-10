import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";

export default function VersionHistoryPage() {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load article info
    fetch(`http://localhost:3000/articles/${id}`)
      .then((res) => res.json())
      .then(setArticle)
      .catch(console.error);

    // Load version history
    fetch(`http://localhost:3000/articles/${id}/versions`)
      .then((res) => res.json())
      .then((data) => {
        setVersions(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading versions:", err);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="container">Loading versions...</div>;
  if (!article) return <div className="container">Article not found</div>;

  const oldVersions = versions.filter(
    (v) => v.version < article.currentVersion
  );

  return (
    <div className="container">
      <div className="page-header">
        <h1>Version History</h1>
        <div className="article-info">
          <h2>{article.title}</h2>
          <Link to={`/view/${id}`} className="back-link">
            Back to article
          </Link>
        </div>
      </div>

      <div className="versions-list">
        <div className="current-version-info">
          <h3>Current: Version {article.currentVersion}</h3>
          <p>
            Last modified: {new Date(article.updatedAt).toLocaleString()}
            {article.currentVersion > 1 && (
              <span className="changes-count">
                {article.currentVersion - 1} change
                {article.currentVersion - 1 !== 1 ? "s" : ""}
              </span>
            )}
          </p>
        </div>

        {oldVersions.length > 0 ? (
          <>
            <h3 className="history-title">
              Previous versions ({oldVersions.length})
            </h3>

            <div className="versions-table">
              <div className="table-header">
                <div className="col-version">Version</div>
                <div className="col-date">Created</div>
                <div className="col-title">Title</div>
                <div className="col-actions">View</div>
              </div>

              {oldVersions
                .sort((a, b) => b.version - a.version)
                .map((version) => (
                  <div key={version.id} className="version-row">
                    <div className="col-version">
                      <strong>v{version.version}</strong>
                      {version.version === 1 && (
                        <span className="original-badge">Original</span>
                      )}
                    </div>
                    <div className="col-date">
                      {new Date(version.createdAt).toLocaleString()}
                    </div>
                    <div className="col-title">{version.title}</div>
                    <div className="col-actions">
                      <Link
                        to={`/view/${id}?version=${version.version}`}
                        className="view-link"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                ))}
            </div>
          </>
        ) : (
          <div className="no-history">
            <p>No previous versions found.</p>
            <p>This article hasn't been modified since creation.</p>
          </div>
        )}
      </div>

      <div className="article-actions">
        <Link to="/" className="back-link">
          Back to list
        </Link>
      </div>
    </div>
  );
}
