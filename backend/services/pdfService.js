const PDFDocument = require("pdfkit");
const path = require("path");
const { Article } = require("../models");
const { ERRORS } = require("../constants/errorMessages");
const { htmlToText } = require("html-to-text");
const fs = require("fs");

class PDFService {
  constructor() {
    this.margin = 50;
    this.fonts = this.loadFonts();
  }

  // Load fonts for PDF generation, fallback to Helvetica if custom fonts not found
  loadFonts() {
    const fontsDir = path.join(__dirname, "../assets/fonts");

    const fonts = {
      regular: path.join(fontsDir, "DejaVuSans.ttf"),
      bold: path.join(fontsDir, "DejaVuSans-Bold.ttf"),
      italic: path.join(fontsDir, "DejaVuSans-Oblique.ttf"),
    };

    // Check if font files exist, use Helvetica as fallback
    for (const [name, fontPath] of Object.entries(fonts)) {
      if (!fs.existsSync(fontPath)) {
        console.warn(
          `Font not found: ${fontPath}, using Helvetica for ${name}`
        );
        if (name === "regular") fonts.regular = "Helvetica";
        else if (name === "bold") fonts.bold = "Helvetica-Bold";
        else if (name === "italic") fonts.italic = "Helvetica-Oblique";
      }
    }

    return fonts;
  }

  async generateArticlePDF(articleId) {
    try {
      const db = require("../models");

      const includeOptions = [
        {
          model: db.User,
          as: "user",
          attributes: ["id", "name", "email"],
        },
      ];

      if (db.Attachment) {
        includeOptions.push({
          model: db.Attachment,
          as: "attachments",
          attributes: ["id", "filename", "originalName", "mimeType", "path"],
        });
      }

      // Fetch article with all related data
      const article = await Article.findByPk(articleId, {
        include: includeOptions,
      });

      if (!article) {
        throw new Error(ERRORS.ARTICLE_NOT_FOUND);
      }

      // Create PDF document
      const doc = new PDFDocument({
        size: "A4",
        margin: this.margin,
        info: {
          Title: article.title,
          Author: article.user?.name || "Unknown",
          Subject: "Wiki Article Export",
          Creator: "Wiki App",
          CreationDate: new Date(),
        },
        autoFirstPage: true,
        bufferPages: true,
      });

      // Register custom fonts if available
      if (this.fonts.regular.includes(".ttf")) {
        doc.registerFont("DejaVuSans", this.fonts.regular);
        doc.registerFont("DejaVuSans-Bold", this.fonts.bold);
        doc.registerFont("DejaVuSans-Oblique", this.fonts.italic);
      }

      const buffers = [];
      doc.on("data", buffers.push.bind(buffers));

      // Build PDF content
      this.addHeader(doc, article);
      this.addMetadata(doc, article);

      if (article.attachments?.length) {
        this.addAttachmentsSection(doc, article);
      }

      this.addContent(doc, article);

      doc.end();

      // Return PDF as buffer
      return new Promise((resolve) => {
        doc.on("end", () => {
          resolve(Buffer.concat(buffers));
        });
      });
    } catch (error) {
      console.error("PDF generation error:", error);
      throw error;
    }
  }

  addHeader(doc, article) {
    const fontFamily = this.fonts.regular.includes(".ttf")
      ? "DejaVuSans"
      : "Helvetica";

    // Article title
    doc
      .font(fontFamily + "-Bold")
      .fontSize(24)
      .text(article.title, { align: "center" })
      .moveDown(1);

    // Separator line
    doc
      .moveTo(this.margin, doc.y)
      .lineTo(doc.page.width - this.margin, doc.y)
      .lineWidth(2)
      .stroke()
      .moveDown(1);
  }

  addMetadata(doc, article) {
    const fontFamily = this.fonts.regular.includes(".ttf")
      ? "DejaVuSans"
      : "Helvetica";

    doc
      .font(fontFamily + "-Oblique")
      .fontSize(10)
      .text("Article Details:", { underline: true })
      .moveDown(0.5);

    const metadata = [];

    if (article.user) {
      metadata.push(`Author: ${article.user.name}`);
    }

    metadata.push(
      `Created: ${new Date(article.createdAt).toLocaleDateString()}`
    );
    metadata.push(
      `Last updated: ${new Date(article.updatedAt).toLocaleDateString()}`
    );

    if (article.workspaceId) {
      const workspaceNames = {
        uncategorized: "Uncategorized",
        nature: "Nature & Science",
        culture: "Culture & Arts",
        tech: "Technology",
        education: "Education",
      };
      metadata.push(
        `Workspace: ${
          workspaceNames[article.workspaceId] || article.workspaceId
        }`
      );
    }

    doc
      .font(fontFamily)
      .fontSize(10)
      .list(metadata, { bulletRadius: 2 })
      .moveDown(2);
  }

  addAttachmentsSection(doc, article) {
    const fontFamily = this.fonts.regular.includes(".ttf")
      ? "DejaVuSans"
      : "Helvetica";

    doc
      .font(fontFamily + "-Bold")
      .fontSize(12)
      .text("Attachments:", { underline: true })
      .moveDown(0.5);

    // List each attachment with clickable link
    article.attachments.forEach((attachment, index) => {
      const name =
        attachment.originalName || attachment.filename || "Unnamed file";

      // Create URL for PDF clickable link
      let fileUrl = null;
      if (attachment.path) {
        fileUrl = attachment.path.startsWith("http")
          ? attachment.path
          : `http://localhost:3000${
              attachment.path.startsWith("/") ? "" : "/"
            }${attachment.path}`;
      }

      // Attachment as clickable link in PDF
      doc
        .font(fontFamily)
        .fontSize(10)
        .fillColor("blue")
        .text(`${index + 1}. ${name}`, {
          link: fileUrl,
          underline: true,
        })
        .fillColor("black");

      // File details
      if (attachment.mimeType) {
        doc
          .font(fontFamily + "-Oblique")
          .fontSize(8)
          .text(`   Type: ${attachment.mimeType}`);
      }

      if (attachment.path) {
        doc
          .font(fontFamily + "-Oblique")
          .fontSize(8)
          .text(`   Path: ${attachment.path}`);
      }

      doc.moveDown(0.3);
    });

    doc.moveDown(1);
  }

  addContent(doc, article) {
    const fontFamily = this.fonts.regular.includes(".ttf")
      ? "DejaVuSans"
      : "Helvetica";

    doc
      .font(fontFamily + "-Bold")
      .fontSize(12)
      .text("Content:", { underline: true })
      .moveDown(0.5);

    // Convert HTML to plain text for PDF
    const plainText = htmlToText(article.content || "", {
      wordwrap: false,
      preserveNewlines: true,
      selectors: [
        { selector: "a", options: { ignoreHref: false } },
        { selector: "img", format: "skip" },
        { selector: "h1", options: { uppercase: false } },
        { selector: "h2", options: { uppercase: false } },
        { selector: "h3", options: { uppercase: false } },
      ],
    });

    // Article content
    doc
      .font(fontFamily)
      .fontSize(12)
      .text(plainText, {
        align: "left",
        width: doc.page.width - 2 * this.margin,
        lineGap: 5,
        paragraphGap: 10,
      });
  }
}

module.exports = new PDFService();
