import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useArticleActions } from "../hooks/useArticleActions";
import WorkspaceTabs from "./WorkspaceTabs";
import SearchBar from "./SearchBar";
import { getWorkspaceName } from "../constants/workspaces";
import { useAuth } from "../hooks/useAuth";

export default function ArticleList() {
  const [articles, setArticles] = useState([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const { deleteArticle } = useArticleActions();
  const { getAuthHeader, user } = useAuth();

  const searchQuery = searchParams.get("search") || "";

  const canEditArticle = (article) => {
    if (!user || !article) return false;
    return user.role === "admin" || article.userId === user.id;
  };

  // Fetch articles list when component mounts or workspace changes or search query changes
  useEffect(() => {
    if (searchQuery) {
      performSearch(searchQuery);
    } else {
      loadArticles();
      setSearchResults(null);
    }
  }, [selectedWorkspace, searchQuery]);

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

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to fetch articles: ${res.status} ${errorText}`);
      }

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

  const performSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }

    setSearchLoading(true);
    try {
      let url = `/api/articles/search?q=${encodeURIComponent(query.trim())}`;
      if (selectedWorkspace !== null) {
        url += `&workspaceId=${selectedWorkspace}`;
      }

      console.log("Searching with URL:", url);

      const res = await fetch(url, {
        headers: getAuthHeader(),
      });

      if (res.status === 401) {
        throw new Error("Session expired. Please login again.");
      }

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Search response error:", res.status, errorText);
        throw new Error(
          `Failed to search articles: ${res.status} ${errorText}`
        );
      }

      const data = await res.json();
      console.log("Search results:", data);

      setSearchResults(data);
      setArticles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to search articles:", err);
      setSearchResults([]);
      setArticles([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearch = (query) => {
    if (query.trim()) {
      setSearchParams({ search: query });
    } else {
      setSearchParams({});
    }
  };

  // Generate create article URL with workspace preselected
  const getCreateArticleUrl = () => {
    if (selectedWorkspace) {
      return `/new?workspace=${selectedWorkspace}`;
    }
    return "/new";
  };

  const highlightText = (text, query) => {
    if (!query || !text) return text;

    try {
      const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(${escapedQuery})`, "gi");
      return text.toString().replace(regex, "<mark>$1</mark>");
    } catch (err) {
      console.error("Error highlighting text:", err);
      return text;
    }
  };

  const displayArticles = searchResults || articles;
  const isSearchMode = !!searchQuery;

  const pageTitle = isSearchMode
    ? `Search Results for "${searchQuery}"`
    : selectedWorkspace === null
    ? "All Articles"
    : getWorkspaceName(selectedWorkspace);

  return (
    <div className="list">
      <WorkspaceTabs
        currentWorkspace={selectedWorkspace}
        onWorkspaceChange={setSelectedWorkspace}
      />

      <div className="search-section">
        <SearchBar onSearch={handleSearch} initialQuery={searchQuery} />
      </div>

      <div className="list-header">
        <h2>
          {pageTitle} ({displayArticles.length})
          {isSearchMode && searchResults && (
            <span className="search-info"> • Sorted by relevance</span>
          )}
        </h2>

        <Link to={getCreateArticleUrl()} className="create-new-btn">
          {articles.length === 0
            ? "Create First Article"
            : "Create New Article"}
        </Link>
      </div>

      {(loading || searchLoading) && (
        <div className="loading">
          {isSearchMode ? "Searching articles..." : "Loading articles..."}
        </div>
      )}

      {!loading &&
        !searchLoading &&
        isSearchMode &&
        displayArticles.length === 0 && (
          <div className="empty-search-results">
            <p>No articles found for "{searchQuery}"</p>
            <button
              onClick={() => setSearchParams({})}
              className="clear-search-btn"
            >
              Clear search
            </button>
          </div>
        )}

      <ul>
        {displayArticles.map((a) => (
          <li key={a.id} className="article-item">
            <Link to={`/view/${a.id}`} className="article-title">
              {isSearchMode ? (
                <div
                  dangerouslySetInnerHTML={{
                    __html: highlightText(a.title, searchQuery),
                  }}
                />
              ) : (
                a.title
              )}
            </Link>

            {isSearchMode && a.content && (
              <div className="search-snippet">
                <div
                  className="snippet-text"
                  dangerouslySetInnerHTML={{
                    __html: highlightText(
                      a.content.length > 200
                        ? a.content.substring(0, 200) + "..."
                        : a.content,
                      searchQuery
                    ),
                  }}
                />
              </div>
            )}

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

      {!loading &&
        !searchLoading &&
        !isSearchMode &&
        displayArticles.length === 0 && (
          <div className="empty-state">
            <p>No articles found in this workspace.</p>
          </div>
        )}
    </div>
  );
}
