// The only file you change when the API moves.
// Local:       http://127.0.0.1:8000/api
// Production:  https://YOUR-API-HOST/api   (must be https when the board is on Netlify)
window.APP_CONFIG = {
  API_BASE_URL: "http://127.0.0.1:8000/api",
  POLL_INTERVAL_MS: 10000   // 10 seconds, as the brief requires
};
