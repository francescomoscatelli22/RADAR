// Mini-server per l'anteprima telefono (strumento di sviluppo, non fa parte dell'app).
// Serve design/phone-preview.html su http://localhost:3100 senza installare nulla.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const dir = dirname(fileURLToPath(import.meta.url));
const file = join(dir, "phone-preview.html");

createServer(async (_req, res) => {
  try {
    const html = await readFile(file);
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(html);
  } catch {
    res.writeHead(500);
    res.end("phone-preview.html non trovato");
  }
}).listen(3100, () => console.log("Anteprima telefono: http://localhost:3100"));
