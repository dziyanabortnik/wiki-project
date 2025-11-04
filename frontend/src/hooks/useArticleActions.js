import { useState } from 'react';

export function useArticleActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const deleteArticle = async (id, title, onSuccess) => {
    if (!window.confirm(`Delete article "${title}"?`)) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`http://localhost:3000/articles/${id}`, {
        method: 'DELETE',
      });

      if (res.status === 404) {
        throw new Error('Article not found - it may have been already deleted');
      }

      if (!res.ok) {
        throw new Error('Failed to delete article');
      }

      onSuccess?.();
    } catch (err) {
      setError(err.message);
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return { deleteArticle, loading, error };
}
