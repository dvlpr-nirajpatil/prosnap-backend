const { upload } = require("../controllers");
const { protectRoute } = require("../middlewares");
const multerUpload = require("../middlewares/upload");
const router = require("express").Router();

router.post("/single", protectRoute, multerUpload.single("image"), upload.uploadSingleImage);
router.post(
  "/multiple",
  protectRoute,
  multerUpload.array("images", 10),
  upload.uploadMultipleImages,
);
router.delete("/", protectRoute, upload.deleteImage);

module.exports = router;
