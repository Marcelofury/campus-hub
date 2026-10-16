import "dotenv/config";
import cors from "cors";
import express from "express";
import swaggerUi from "swagger-ui-express";
import openapi from "./docs/openapi.js";
import apiRoutes from "./routes/api.routes.js";
import { authenticate } from "./services/data-source.js";
import { loadDataSource } from "./services/data-source.js";
import { errorHandler, notFound } from "./middleware/error.middleware.js";

const app = express();
const port = Number(process.env.PORT || 4000);

const configuredOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const localOrigin = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

app.use(
  cors({
    origin(origin, callback) {
      const allowed =
        !origin ||
        configuredOrigins.includes(origin) ||
        (process.env.NODE_ENV !== "production" && localOrigin.test(origin));
      callback(null, allowed);
    },
  }),
);
app.use(express.json({ limit: "1mb" }));
app.get("/api/openapi.json", (_request, response) => response.json(openapi));
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openapi, { explorer: true }));

app.use(async (request, _response, next) => {
  if (request.path === "/api/auth/me") {
    const token = request.header("authorization")?.replace(/^Bearer\s+/i, "") || request.header("x-local-token");
    request.user = await authenticate(token);
  }
  next();
});
app.use("/api", apiRoutes);
app.use(notFound);
app.use(errorHandler);

await loadDataSource();

if (process.env.NODE_ENV !== "test") {
  app.listen(port, () => console.log(`Campus Hub API listening on http://localhost:${port}`));
}

export default app;
