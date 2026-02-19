const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const compression = require("compression");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const logger = require("./core/logger");
const response = require("./core/response");
const winstonMorgan = require("./middlewares/winston_morgan_middleware");
const errorHandler = require("./middlewares/error_handler");
const notFound = require("./middlewares/not_found");
const sanitizeRequest = require("./middlewares/sanitize.middleware");

const routes = require("./routes");

const app = express();

/* =========================
   GLOBAL SECURITY MIDDLEWARES
   ========================= */
app.use(helmet());

app.use(
  cors({
    origin: "*", // restrict in production
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

/* =========================
   RATE LIMITING
   ========================= */
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: "Too many requests from this IP, please try again later.",
  }),
);

/* =========================
   PERFORMANCE & LOGGING
   ========================= */
app.use(compression());
app.use(winstonMorgan(logger));

/* =========================
   BODY PARSERS
   ========================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* =========================
   SANITIZATION
   ========================= */
app.use(sanitizeRequest);

/* =========================
   VALIDATIONS
   ========================= */
// app.use((req, res, next) => {
//   if (
//     req.method === "POST" &&
//     (!req.body || Object.keys(req.body).length === 0)
//   ) {
//     return res.status(400).json({
//       success: false,
//       message: "JSON payload is missing",
//     });
//   }
//   next();
// });

/* =========================
   HEALTH CHECK
   ========================= */
app.get("/", (req, res) => {
  response(res, 200, "Hi From Reshimgathi Server");
});

/* =========================
   ROUTES
   ========================= */
app.use("/api/v1", routes);

/* =========================
   ERROR HANDLING
   ========================= */
app.use(notFound);
app.use(errorHandler);

module.exports = app;
