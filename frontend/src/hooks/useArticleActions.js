import { useState } from "react";

export function useArticleActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const deleteArticle = async (id, title, onSuccess) => {
    console.log("Deleting article:", id, title);
    
    if (!window.confirm(`Delete article "${title}"?`)) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`http://localhost:3000/articles/${id}`, {
        method: "DELETE",
      });

      console.log("Delete response status:", res.status);

      if (res.status === 404) {
        throw new Error("Article not found - it may have been already deleted");
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to delete article");
      }

      console.log("Article deleted successfully");
      onSuccess?.();
    } catch (err) {
      console.error("Delete error:", err);
      setError(err.message);
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return { deleteArticle, loading, error };
}
