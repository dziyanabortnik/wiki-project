const PDFDocument = require("pdfkit");
const path = require("path");
const { Article } = require("../models");
const { ERRORS } = require("../constants/errorMessages");
const { htmlToText } = require("html-to-text");
const fs = require("fs");

const FONT_CONSTANTS = {
  REGULAR: "regular",
  BOLD: "bold",
  ITALIC: "italic",
};

class PDFService {
  constructor() {
    this.margin = 50;
    this.fonts = this.loadFonts();
    this.fontConstants = FONT_CONSTANTS;
  }

  // Get base URL from environment variables
  getBaseUrl() {
    if (process.env.BASE_URL) {
      return process.env.BASE_URL;
    }

    const host = process.env.HOST || "localhost";
    const port = process.env.PORT || 3000;

    if (
      port === "80" ||
      port === "443" ||
      process.env.NODE_ENV === "production"
    ) {
      return `http${process.env.NODE_ENV === "production" ? "s" : ""}://${host}`;
    }

    return `http://${host}:${port}`;
  }

  // Helper to get font family name consistently
  getFontFamily(fontWeight = FONT_CONSTANTS.REGULAR) {
    const isCustomFont =
      this.fonts[FONT_CONSTANTS.REGULAR] &&
      this.fonts[FONT_CONSTANTS.REGULAR].includes(".ttf");

    if (!isCustomFont) {
      // System fonts
      switch (fontWeight) {
        case FONT_CONSTANTS.BOLD:
          return "Helvetica-Bold";
        case FONT_CONSTANTS.ITALIC:
          return "Helvetica-Oblique";
        default:
          return "Helvetica";
      }
    }

    // Custom fonts
    switch (fontWeight) {
      case FONT_CONSTANTS.BOLD:
        return "DejaVuSans-Bold";
      case FONT_CONSTANTS.ITALIC:
        return "DejaVuSans-Oblique";
      default:
        return "DejaVuSans";
    }
  }

  loadFonts() {
    const fontsDir = path.join(__dirname, "../assets/fonts");

    const fonts = {
      [FONT_CONSTANTS.REGULAR]: path.join(fontsDir, "DejaVuSans.ttf"),
      [FONT_CONSTANTS.BOLD]: path.join(fontsDir, "DejaVuSans-Bold.ttf"),
      [FONT_CONSTANTS.ITALIC]: path.join(fontsDir, "DejaVuSans-Oblique.ttf"),
    };

    // Check if font files exist, use Helvetica as fallback
    for (const [weight, fontPath] of Object.entries(fonts)) {
      if (!fs.existsSync(fontPath)) {
        console.warn(
          `Font not found: ${fontPath}, using Helvetica for ${weight}`,
        );
        if (weight === FONT_CONSTANTS.REGULAR) fonts[weight] = "Helvetica";
        else if (weight === FONT_CONSTANTS.BOLD)
          fonts[weight] = "Helvetica-Bold";
        else if (weight === FONT_CONSTANTS.ITALIC)
          fonts[weight] = "Helvetica-Oblique";
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
      if (
        this.fonts[FONT_CONSTANTS.REGULAR] &&
        this.fonts[FONT_CONSTANTS.REGULAR].includes(".ttf")
      ) {
        doc.registerFont("DejaVuSans", this.fonts[FONT_CONSTANTS.REGULAR]);
        doc.registerFont("DejaVuSans-Bold", this.fonts[FONT_CONSTANTS.BOLD]);
        doc.registerFont(
          "DejaVuSans-Oblique",
          this.fonts[FONT_CONSTANTS.ITALIC],
        );
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
    // Article title
    doc
      .font(this.getFontFamily(FONT_CONSTANTS.BOLD))
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
    doc
      .font(this.getFontFamily(FONT_CONSTANTS.ITALIC))
      .fontSize(10)
      .text("Article Details:", { underline: true })
      .moveDown(0.5);

    const metadata = [];

    if (article.user) {
      metadata.push(`Author: ${article.user.name}`);
    }

    metadata.push(
      `Created: ${new Date(article.createdAt).toLocaleDateString()}`,
    );
    metadata.push(
      `Last updated: ${new Date(article.updatedAt).toLocaleDateString()}`,
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
        }`,
      );
    }

    doc
      .font(this.getFontFamily())
      .fontSize(10)
      .list(metadata, { bulletRadius: 2 })
      .moveDown(2);
  }

  addAttachmentsSection(doc, article) {
    doc
      .font(this.getFontFamily(FONT_CONSTANTS.BOLD))
      .fontSize(12)
      .text("Attachments:", { underline: true })
      .moveDown(0.5);

    // List each attachment with clickable link
    article.attachments.forEach((attachment, index) => {
      const name =
        attachment.originalName || attachment.filename || "Unnamed file";

      // Create dynamic URL for PDF clickable link
      let fileUrl = null;
      if (attachment.path) {
        if (attachment.path.startsWith("http")) {
          fileUrl = attachment.path;
        } else {
          const baseUrl = this.getBaseUrl();
          fileUrl = `${baseUrl}${attachment.path.startsWith("/") ? "" : "/"}${attachment.path}`;
        }
      }

      // Attachment as clickable link in PDF
      doc
        .font(this.getFontFamily())
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
          .font(this.getFontFamily(FONT_CONSTANTS.ITALIC))
          .fontSize(8)
          .text(`   Type: ${attachment.mimeType}`);
      }

      if (attachment.path) {
        doc
          .font(this.getFontFamily(FONT_CONSTANTS.ITALIC))
          .fontSize(8)
          .text(`   Path: ${attachment.path}`);
      }

      doc.moveDown(0.3);
    });

    doc.moveDown(1);
  }

  addContent(doc, article) {
    doc
      .font(this.getFontFamily(FONT_CONSTANTS.BOLD))
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
      .font(this.getFontFamily())
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
