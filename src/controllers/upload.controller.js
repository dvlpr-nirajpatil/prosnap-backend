const sharp = require("sharp");
const s3Client = require("../config/aws");
const { PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { response, logger } = require("../core");
const { v4: uuidv4 } = require("uuid");

const BUCKET = process.env.AWS_S3_BUCKET_NAME;
const REGION = process.env.AWS_REGION || "us-east-1";

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// HELPER FUNCTIONS
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
function buildS3Url(key) {
  const encodedKey = key
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  if (REGION === "us-east-1") {
    return `https://${BUCKET}.s3.amazonaws.com/${encodedKey}`;
  }

  return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${encodedKey}`;
}

async function putObjectToS3({ Key, Body, ContentType, ACL = "public-read" }) {
  const cmd = new PutObjectCommand({
    Bucket: BUCKET,
    Key,
    Body,
    ContentType,
  });
  await s3Client.send(cmd);
}

async function deleteObjectFromS3(Key) {
  const cmd = new DeleteObjectCommand({
    Bucket: BUCKET,
    Key,
  });
  await s3Client.send(cmd);
}

function extractS3Key(url) {
  if (!url) return null;

  const value = String(url).trim();

  // Allow callers to pass raw object keys directly.
  if (!value.startsWith("http://") && !value.startsWith("https://")) {
    return value.replace(/^\/+/, "");
  }

  try {
    const parsed = new URL(value);
    return decodeURIComponent(parsed.pathname).replace(/^\/+/, "");
  } catch (_err) {
    return null;
  }
}

async function processImage(buffer, mimetype) {
  const mime = (mimetype || "").toLowerCase();

  const isHeic =
    mime === "image/heic" ||
    mime === "image/heif" ||
    mime === "image/heic-sequence" ||
    mime === "image/heif-sequence";

  // ---------------- HEIC / HEIF ----------------
  if (isHeic) {
    try {
      const out = await sharp(buffer).rotate().heif({ quality: 80 }).toBuffer();

      return {
        buffer: out,
        contentType: mime.includes("heif") ? "image/heif" : "image/heic",
        extension: "heic",
      };
    } catch (e) {
      return {
        buffer,
        contentType: mime.includes("heif") ? "image/heif" : "image/heic",
        extension: "heic",
      };
    }
  }

  const out = await sharp(buffer)
    .rotate()
    .resize({ width: 800 })
    .webp({ quality: 70 })
    .toBuffer();

  return {
    buffer: out,
    contentType: "image/webp",
    extension: "webp",
  };
}

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// UPLOAD SINGLE IMAGE
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

module.exports.uploadSingleImage = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return response(res, 400, "No image file provided");

    const mime = (file.mimetype || "").toLowerCase();

    if (!mime.startsWith("image/")) {
      return response(res, 400, "Only image files are allowed");
    }

    const processed = await processImage(file.buffer, mime);

    const key = `images/${req.user.id}/${uuidv4()}.${processed.extension}`;

    await putObjectToS3({
      Key: key,
      Body: processed.buffer,
      ContentType: processed.contentType,
    });

    return res.status(200).json({
      success: true,
      message: "Image uploaded successfully",
      data: {
        url: buildS3Url(key),
        key,
        type: processed.extension,
        size: `${Math.round(processed.buffer.length / 1024)} KB`,
      },
    });
  } catch (e) {
    logger.error("UPLOAD_SINGLE_IMAGE_ERROR", e);
    return response(res, 500, "Internal Server Error");
  }
};

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// UPLOAD MULTIPLE IMAGES
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

module.exports.uploadMultipleImages = async (req, res) => {
  try {
    const files = req.files;
    if (!files?.length) {
      x;
      return response(res, 400, "No image files provided");
    }

    const uploads = await Promise.all(
      files.map(async (file) => {
        const { buffer, contentType, extension } = await processImage(
          file.buffer,
          file.mimetype,
        );

        const key = `images/${req.user.id}/${uuidv4()}.${extension}`;

        await putObjectToS3({
          Key: key,
          Body: buffer,
          ContentType: contentType,
        });

        return buildS3Url(key);
      }),
    );

    return response(res, 200, "Images uploaded successfully", uploads);
  } catch (e) {
    logger.error("UPLOAD_MULTIPLE_IMAGES_ERROR", e);
    return response(res, 500, "Internal Server Error");
  }
};

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// DELETE IMAGE
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
module.exports.deleteImage = async (req, res) => {
  try {
    const { key } = req.body;

    if (!key) {
      return response(res, 400, "Image key is required");
    }

    const s3Key = extractS3Key(key);

    if (!s3Key) {
      return response(res, 400, "Invalid image key");
    }

    await deleteObjectFromS3(s3Key);

    return response(res, 200, "Image deleted successfully");
  } catch (e) {
    logger.error("DELETE_IMAGE_ERROR", e);
    return response(res, 500, "Internal Server Error");
  }
};
