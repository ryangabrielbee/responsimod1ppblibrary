// @ts-nocheck
import express from "express";
import { dispatch } from "./dispatch.js";

const app = express();
app.disable("x-powered-by");

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

app.use(express.json({ limit: "32kb" }));

app.use(async (req, res, next) => {
  try {
    const query = req.originalUrl.includes("?")
      ? req.originalUrl.slice(req.originalUrl.indexOf("?") + 1)
      : "";
    const result = await dispatch({
      method: req.method,
      pathname: req.path,
      searchParams: new URLSearchParams(query),
      body: req.body,
    });
    res.status(result.status).json(result.body);
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }
  const invalidJson = error instanceof SyntaxError;
  res.status(invalidJson ? 400 : 500).json({
    success: false,
    message: invalidJson ? "Body JSON tidak valid." : "Terjadi kesalahan pada server.",
  });
});

export default app;
