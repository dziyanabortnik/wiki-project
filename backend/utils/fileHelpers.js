const fs = require('fs');
const path = require('path');

const deleteAttachmentFiles = (attachments, uploadDir) => {
  if (attachments && attachments.length > 0) {
    attachments.forEach((attachment) => {
      const diskFile = path.join(uploadDir, attachment.filename);
      if (fs.existsSync(diskFile)) {
        fs.unlinkSync(diskFile);
      }
    });
  }
};

const createAttachmentObjects = (files) => {
  return files.map((file) => ({
    id: Date.now() + "-" + Math.round(Math.random() * 1e9),
    filename: file.filename,
    originalName: file.originalname,
    path: `/uploads/${file.filename}`,
    mimetype: file.mimetype,
    size: file.size,
    uploadedAt: new Date().toISOString(),
  }));
};

module.exports = {
  deleteAttachmentFiles,
  createAttachmentObjects
};
