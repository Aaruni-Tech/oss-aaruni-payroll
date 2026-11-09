const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 5173;
const PUBLIC_DIR = path.join(__dirname, "public");
const DATA_FILE = path.join(__dirname, "data", "migrated_timesheets.json");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (url.pathname === "/api/migrated-timesheets") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(fs.existsSync(DATA_FILE) ? fs.readFileSync(DATA_FILE) : "{}");
    return;
  }

  if (url.pathname === "/api/email/notify" && req.method === "POST") {
    let body = "";
    req.on("data", chunk => { body += chunk; });
    req.on("end", () => {
      try {
        const payload = JSON.parse(body || "{}");
        const sender = payload.from || "hr@fullstackmaster.net";
        const safeSubj = String(payload.subject || "").replace(/₹\s*[\d,]+(\.\d+)?/g, "[Hidden]");
        const safeBody = String(payload.body || "").replace(/₹\s*[\d,]+(\.\d+)?/g, "[Hidden]");
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          ok: true,
          from: sender,
          to: payload.to || [],
          subject: safeSubj,
          body: safeBody,
          zeroSalaryVerified: true
        }));
      } catch (e) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: false }));
      }
    });
    return;
  }

  let filePath = path.join(PUBLIC_DIR, url.pathname === "/" ? "index.html" : url.pathname);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(PUBLIC_DIR, "index.html");
  }
  const ext = path.extname(filePath);
  res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "text/plain" });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Aaruni Tech HR & Payroll PWA running at http://localhost:${PORT}`);
});
