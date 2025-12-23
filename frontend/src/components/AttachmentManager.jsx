import { useState } from "react";
import { useAuth } from "../hooks/useAuth";

export default function AttachmentManager({
  articleId,
  attachments = [],
  onAttachmentsChange,
  newAttachments = [],
  onNewAttachmentsChange,
  creationMode = false,
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const { getAuthHeader, isAuthenticated } = useAuth();

  // Handle file selection and preview
  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files.length) return;

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
    ];

    const invalidFiles = Array.from(files).filter(
      (file) => !allowedTypes.includes(file.type)
    );

    if (invalidFiles.length > 0) {
      setError(
        `Invalid file types: ${invalidFiles
          .map((f) => f.name)
          .join(", ")}. Only images (JPG, PNG, GIF, WebP) and PDFs are allowed.`
      );
      e.target.value = "";
      return;
    }

    const newFiles = Array.from(files).map((file) => ({
      id: Date.now() + "-" + Math.random(),
      originalName: file.name,
      file,
      mimetype: file.type,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      previewUrl: URL.createObjectURL(file),
    }));

    if (creationMode) {
      onAttachmentsChange?.([...attachments, ...newFiles]);
    } else {
      onNewAttachmentsChange?.([...newAttachments, ...newFiles]);
    }
    e.target.value = "";
    setError("");
  };

  // Remove attachment (either new or existing)
  const handleRemoveAttachment = async (attachmentId, isNew = false) => {
    if (creationMode) {
      onAttachmentsChange?.(attachments.filter((a) => a.id !== attachmentId));
      return;
    }

    if (isNew) {
      onNewAttachmentsChange?.(
        newAttachments.filter((a) => a.id !== attachmentId)
      );
      return;
    }

    if (!window.confirm("Are you sure you want to remove this attachment?"))
      return;

    try {
      const res = await fetch(
        `/api/articles/${articleId}/attachments/${attachmentId}`,
        {
          method: "DELETE",
          headers: getAuthHeader(),
        }
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Delete failed with status ${res.status}`
        );
      }

      onAttachmentsChange?.(attachments.filter((a) => a.id !== attachmentId));
    } catch (err) {
      console.error("Error removing attachment:", err);
      alert("Error removing attachment: " + err.message);
    }
  };

  // Generate URL for attachment preview or download
  const getHrefFor = (attachment, isNew) => {
    if ((creationMode || isNew) && attachment.previewUrl) {
      return attachment.previewUrl;
    }
    if (attachment.path) {
      if (
        attachment.path.startsWith("http://") ||
        attachment.path.startsWith("https://")
      ) {
        return attachment.path;
      }
      return `http://localhost:3000${
        attachment.path.startsWith("/") ? "" : "/"
      }${attachment.path}`;
    }
    return null;
  };

  const filesToShow = creationMode
    ? attachments
    : [...attachments, ...newAttachments];

  return (
    <div className="attachments-section">
      <h3>Attachments</h3>

      {error && <div className="error-message">{error}</div>}

      {isAuthenticated ? (
        <div className="file-upload">
          <input
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.gif,.webp,.pdf"
            onChange={handleFileUpload}
            disabled={uploading}
          />
        </div>
      ) : (
        <div>
          <p>Please login to upload attachments.</p>
        </div>
      )}

      <div className="attachments-list">
        {filesToShow.length === 0 ? (
          <p>No attachments yet</p>
        ) : (
          filesToShow.map((a) => {
            const isNew = newAttachments.some((n) => n.id === a.id);
            const href = getHrefFor(a, isNew);
            return (
              <div key={a.id}>
                <div>
                  {href ? (
                    <a href={href} target="_blank" rel="noopener noreferrer">
                      {a.originalName}
                      <span>{isNew ? "(new)" : ""}</span>
                    </a>
                  ) : (
                    <span>{a.originalName}</span>
                  )}
                  <span>({(a.size / 1024).toFixed(1)} KB)</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveAttachment(a.id, isNew)}
                >
                  Remove
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
