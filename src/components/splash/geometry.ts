// Misure condivise della schermata iniziale (artboard 390 x 844, come il frame Figma).

// converte "unità Figma" in una misura CSS (--u è definita in splash.css)
export const u = (n: number) => `calc(var(--u) * ${n})`;

export const SWEEP_START = 0.3; // secondi: quando parte la lancetta
export const SWEEP_PERIOD = 1.6; // secondi per un giro
export const ARM_ANGLE = -45; // la lancetta a riposo punta in alto a destra
export const CLUSTER_CENTER = { x: 195, y: 300 }; // centro del radar nell'artboard

// ritardo con cui la lancetta "illumina" un punto (angolo rispetto al centro)
export const passDelay = (dx: number, dy: number) => {
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  const turn = (((angle - ARM_ANGLE) % 360) + 360) % 360;
  return SWEEP_START + (turn / 360) * SWEEP_PERIOD;
};
