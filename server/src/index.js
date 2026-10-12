import { createGameServer } from './app.js';

const PORT = Number(process.env.PORT) || 3000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
// Local development gets a known phrase; a deployed server must set its own.
const DEV_PHRASE = 'hollowmere';
const ACCESS_PHRASE = process.env.ACCESS_PHRASE || (process.env.NODE_ENV === 'production' ? '' : DEV_PHRASE);
if (!ACCESS_PHRASE) {
  console.error('ACCESS_PHRASE must be set in production.');
  process.exit(1);
}
if (ACCESS_PHRASE === DEV_PHRASE) console.log(`Development access phrase: "${DEV_PHRASE}"`);

const { http } = createGameServer({ clientOrigin: CLIENT_ORIGIN, accessPhrase: ACCESS_PHRASE });
http.listen(PORT, () => {
  console.log(`Friki Nights server on :${PORT}, allowing ${CLIENT_ORIGIN}`);
});
