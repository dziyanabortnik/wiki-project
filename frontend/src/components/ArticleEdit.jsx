import { useState, useEffect, forwardRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AttachmentManager from "./AttachmentManager";
import socket from "../services/socket";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useAuth } from "../hooks/useAuth";

const QuillEditor = forwardRef(({ value, onChange }, ref) => (
  <ReactQuill ref={ref} value={value} onChange={onChange} />
));

export default function ArticleEdit() {
  const { id } = useParams();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedWorkspace, setSelectedWorkspace] = useState("uncategorized");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [articleExists, setArticleExists] = useState(true);
  const [attachments, setAttachments] = useState([]);
  const [newAttachments, setNewAttachments] = useState([]);

  const navigate = useNavigate();
  const { getAuthHeader } = useAuth();

  // Load article data when component mounts
  useEffect(() => {
    setLoading(true);
    fetch(`/api/articles/${id}`, {
      headers: getAuthHeader(),
    })
      .then((res) => {
        if (!res.ok) {
          if (res.status === 404) {
            setArticleExists(false);
            setError("Article not found");
          } else if (res.status === 401) {
            setError("Session expired. Please login again.");
          } else {
            throw new Error("Failed to load article");
          }
          return null;
        }
        return res.json();
      })
      .then((article) => {
        if (article) {
          setTitle(article.title);
          setContent(article.content);
          setSelectedWorkspace(article.workspaceId || "uncategorized");
          setAttachments(article.attachments || []);
          setArticleExists(true);
        }
      })
      .catch((err) => {
        console.error("Failed to load article:", err);
        setError("Failed to load article");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  // Real-time updates via WebSocket
  useEffect(() => {
    if (!id) return;

    socket.emit("join-article", id);
    const handleArticleUpdate = (updatedArticle) => {
      if (updatedArticle.id === id) {
        setTitle(updatedArticle.title || "");
        setContent(updatedArticle.content || "");
        setSelectedWorkspace(updatedArticle.workspaceId || "uncategorized");
        setAttachments(updatedArticle.attachments || []);
      }
    };

    socket.on("article-updated", handleArticleUpdate);
    return () => {
      socket.off("article-updated", handleArticleUpdate);
    };
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!articleExists) {
      setError("Cannot update: Article no longer exists");
      return;
    }

    if (!title.trim() || !content.trim()) {
      setError("Title and content are required.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/articles/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          title,
          content,
          workspaceId: selectedWorkspace,
        }),
      });

      if (res.status === 401) {
        throw new Error("Session expired. Please login again.");
      }

      if (res.status === 404) {
        setArticleExists(false);
        throw new Error("Article not found - it may have been deleted");
      }

      let data;
      try {
        data = await res.json();
      } catch (parseErr) {
        throw new Error("Server returned invalid JSON");
      }

      if (!res.ok) {
        throw new Error(data?.error || "Failed to update article");
      }

      console.log("Article updated:", data);

      // Upload new attachments if any
      if (newAttachments.length > 0) {
        console.log(`Uploading ${newAttachments.length} new attachments...`);
        const formData = new FormData();
        newAttachments.forEach((attachment) => {
          formData.append("files", attachment.file);
        });

        try {
          const attachmentRes = await fetch(`/api/articles/${id}/attachments`, {
            method: "POST",
            headers: getAuthHeader(),
            body: formData,
          });

          if (!attachmentRes.ok) {
            const errorText = await attachmentRes.text();
            console.error("Failed to upload attachments:", errorText);
            setError(`Failed to upload attachments: ${errorText}`);
          } else {
            console.log("New attachments uploaded successfully");
          }
        } catch (attachmentErr) {
          console.error("Error uploading new attachments:", attachmentErr);
        }

        setNewAttachments([]);
      }

      navigate(`/view/${id}`);
    } catch (err) {
      console.error("Update failed:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  if (!articleExists && !loading) {
    return (
      <div className="article">
        <h2>Article Not Found</h2>
        <div className="error-message">
          The article you're trying to edit does not exist or has been deleted.
        </div>
        <button onClick={() => navigate("/")} className="cancel-button">
          Back to Articles List
        </button>
      </div>
    );
  }

  return (
    <div className="article">
      <h2>Edit Article</h2>
      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          disabled={!articleExists || loading}
          className="create-input"
        />

        <QuillEditor value={content} onChange={setContent} />

        <div className="workspace-selector">
          <label>Workspace: </label>
          <select
            value={selectedWorkspace}
            onChange={(e) => setSelectedWorkspace(e.target.value)}
            required
            disabled={!articleExists || loading}
          >
            <option value="uncategorized">Uncategorized</option>
            <option value="nature">Nature & Science</option>
            <option value="culture">Culture & Arts</option>
            <option value="tech">Technology</option>
            <option value="education">Education</option>
          </select>
        </div>

        <AttachmentManager
          articleId={id}
          attachments={attachments}
          onAttachmentsChange={setAttachments}
          newAttachments={newAttachments}
          onNewAttachmentsChange={setNewAttachments}
          creationMode={false}
        />

        <div className="form-actions">
          <button
            type="submit"
            disabled={loading || !articleExists}
            className="create-button"
          >
            {loading ? "Updating..." : "Update Article"}
          </button>

          <button
            type="button"
            onClick={handleCancel}
            disabled={loading}
            className="cancel-button"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
