// Same backend every page talks to — see
// .claude/skills/outfitmixer-backend-ecommerce for why this is a separate
// Node/Express/SQLite server (server/) rather than folded into the Vite
// frontend. No env-based config yet since there's only ever one backend
// URL during local dev; revisit once a real deploy target exists.
export const API_URL = 'http://localhost:4000'
