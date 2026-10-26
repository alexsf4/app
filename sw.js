// Service worker: primero internet (para ver siempre lo más nuevo), y si no hay conexión usa lo guardado.
const CACHE = "app-29-v1";
const BASE = [
  "./", "./index.html", "./manifest.json", "./listas.json",
  "./icon-192.png", "./icon-512.png",
  "./baile/chica_cuerpo.png", "./baile/chica_manoL.png", "./baile/chica_manoR.png",
  "./baile/chico_brazoL.png", "./baile/chico_brazoR.png", "./baile/chico_cuerpo.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => Promise.allSettled(BASE.map((u) => c.add(u)))).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  // Solo archivos de esta misma web; GitHub, YouTube y demás servicios no se tocan.
  if (req.method !== "GET" || url.origin !== self.location.origin) return;
  // La música (peticiones por tramos) la maneja el navegador directamente.
  if (req.headers.has("range") || url.pathname.endsWith(".mp3")) return;

  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.status === 200) {
          const copia = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copia));
        }
        return res;
      })
      .catch(() =>
        caches.match(req, { ignoreSearch: true }).then((r) => r || (req.mode === "navigate" ? caches.match("./index.html") : Response.error()))
      )
  );
});
