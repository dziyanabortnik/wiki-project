import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function SearchBar({ onSearch, initialQuery = "" }) {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { getAuthHeader } = useAuth();

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!searchQuery.trim()) {
      navigate("/");
      return;
    }

    setIsSearching(true);

    try {
      // Use custom handler if provided
      if (onSearch) {
        await onSearch(searchQuery);
      } else {
        // Use default approach - update URL with search parameter
        navigate(`/?search=${encodeURIComponent(searchQuery)}`);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClear = () => {
    setSearchQuery("");
    navigate("/");
  };

  const isSearchPage = location.pathname === "/" && location.search.includes("search");

  return (
    <form onSubmit={handleSearch} className="search-bar">
      <div className="search-input-group">
        <input
          type="text"
          placeholder="Search articles by title or content..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
          disabled={isSearching}
        />

        {searchQuery && (
          <button
            type="button"
            onClick={handleClear}
            className="search-clear-btn"
            aria-label="Clear search"
          >
            x
          </button>
        )}

        <button
          type="submit"
          className="search-submit-btn"
          disabled={isSearching || !searchQuery.trim()}
        >
          {isSearching ? "Searching..." : "Search"}
        </button>
      </div>

      {searchQuery && (
        <div className="search-hint">
          <small>Press Enter to search or clear to show all articles</small>
        </div>
      )}
    </form>
  );
}
