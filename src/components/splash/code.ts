/*
  Righe di codice Python (AI generativa) che scorrono sullo sfondo della schermata iniziale.
  Non viene mai eseguito: è solo scenografia. Ogni riga sta in ~40 caratteri, perché la colonna è stretta.
  Tipo riga: "k" = importazioni e definizioni (si illuminano di giallo col ping del radar),
             "c" = commenti, senza tipo = codice normale.
*/
export type CodeLine = { t: string; k?: "k" | "c" };

const raw: Array<string | [string, "k" | "c"]> = [
  ["import torch", "k"],
  ["import torch.nn as nn", "k"],
  ["from diffusers import DiffusionPipeline", "k"],
  ["from transformers import AutoTokenizer", "k"],
  "",
  ["# genera immagini dal testo", "c"],
  "pipe = DiffusionPipeline.from_pretrained(",
  '    "stabilityai/sdxl-turbo",',
  "    torch_dtype=torch.float16,",
  ').to("cuda")',
  "",
  'prompt = "radar neon sopra una città"',
  "image = pipe(prompt, steps=4).images[0]",
  'image.save("segnale.png")',
  "",
  ["class Attention(nn.Module):", "k"],
  ["    def __init__(self, dim, heads=8):", "k"],
  "        super().__init__()",
  "        self.heads = heads",
  "        self.scale = (dim // heads) ** -0.5",
  "        self.qkv = nn.Linear(dim, dim * 3)",
  "        self.out = nn.Linear(dim, dim)",
  "",
  ["    def forward(self, x):", "k"],
  "        q, k, v = self.qkv(x).chunk(3, -1)",
  "        att = q @ k.transpose(-2, -1)",
  "        att = (att * self.scale).softmax(-1)",
  "        return self.out(att @ v)",
  "",
  ["# ciclo di denoising", "c"],
  "for t in scheduler.timesteps:",
  "    noise = unet(latents, t, emb).sample",
  "    latents = scheduler.step(",
  "        noise, t, latents",
  "    ).prev_sample",
  "",
  'tok = AutoTokenizer.from_pretrained("gpt2")',
  'ids = tok("il futuro è", return_tensors="pt")',
  "out = model.generate(**ids, max_new_tokens=64)",
  "print(tok.decode(out[0]))",
  "",
  ["def embed(texts: list[str]) -> Tensor:", "k"],
  "    batch = tok(texts, padding=True)",
  "    with torch.no_grad():",
  "        h = encoder(**batch).last_hidden_state",
  "    return F.normalize(h.mean(1), dim=-1)",
  "",
  ["# ricerca per significato", "c"],
  "scores = embed(query) @ embed(docs).T",
  "top = scores.topk(5).indices.tolist()",
  "",
  "video = pipe_video(",
  "    prompt, num_frames=48, fps=24",
  ").frames",
  'export_to_video(video, "clip.mp4")',
  "",
  ["# da testo a oggetto 3D", "c"],
  "mesh = text_to_3d(prompt, steps=64)",
  'mesh.export("oggetto.glb")',
  "",
  "loss = F.mse_loss(pred, target)",
  "loss.backward()",
  "optimizer.step()",
  "optimizer.zero_grad()",
  "",
  ["@torch.inference_mode()", "k"],
  ["def sample(model, z, steps=50):", "k"],
  "    for i in reversed(range(steps)):",
  "        z = model.denoise(z, i / steps)",
  "    return vae.decode(z)",
  "",
];

export const CODE_LINES: CodeLine[] = raw.map((l) =>
  typeof l === "string" ? { t: l } : { t: l[0], k: l[1] },
);

// 5 colonne: sul telefono se ne vedono 3 (le due esterne compaiono solo su schermi larghi).
// Ognuna parte da un punto diverso del testo, così non si vede la stessa riga ripetuta di fianco.
export const CODE_COLUMNS = [3, 1, 0, 2, 4].map((k, i) => {
  const shift = (k * 17) % CODE_LINES.length;
  return {
    lines: [...CODE_LINES.slice(shift), ...CODE_LINES.slice(0, shift)],
    seconds: [95, 80, 110, 85, 100][i], // velocità diverse: effetto "profondità"
    reverse: i % 2 === 1, // colonne alterne scorrono verso il basso
    outer: i === 0 || i === 4,
  };
});
