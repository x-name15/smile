import { createServer } from "node:http";

const server = createServer((req, res) => {
  res.setHeader("Content-Type", "application/json");

  if (req.url === "/users" && req.method === "GET") {
    res.writeHead(200);
    res.end(
      JSON.stringify([{ id: "1", name: "Ada", metadata: { createdBy: "system" } }]),
    );
    return;
  }

  if (req.url?.startsWith("/users/") && req.method === "GET") {
    const brokenMode = process.env.BROKEN === "1";
    res.writeHead(200);
    res.end(
      JSON.stringify(
        brokenMode
          ? { id: 123, metadata: { createdBy: "system" } }
          : { id: "abc123", name: "Ada", metadata: { createdBy: "system" } },
      ),
    );
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: "not found" }));
});

const PORT = 4321;
server.listen(PORT, () => {
  console.log(`Test server listening on http://localhost:${PORT}`);
});