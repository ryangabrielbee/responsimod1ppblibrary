import app from "./src/app.js";

const port = Number(process.env.PORT || 3001);
const host = "0.0.0.0";

app.listen(port, host, () => {
  console.log(`Aksara API berjalan di http://${host}:${port}`);
});
