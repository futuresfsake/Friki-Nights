import { createGameServer } from './app.js';

const PORT = Number(process.env.PORT) || 3000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

const { http } = createGameServer({ clientOrigin: CLIENT_ORIGIN });
http.listen(PORT, () => {
  console.log(`Friki Nights server on :${PORT}, allowing ${CLIENT_ORIGIN}`);
});
