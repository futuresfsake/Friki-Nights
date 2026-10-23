# Friki Nights

Real-time chat application for night owls and geeks. Built with Node.js, Express, and Socket.IO.

## Features

- Real-time messaging with Socket.IO
- User avatars with deterministic color assignment
- Typing indicators (single and multi-user)
- Online user list with status indicators
- Emoji shortcode support (35+ shortcodes like `:fire:` `:rocket:` `:heart:`)
- Auto-linking URLs in messages
- Notification sounds for incoming messages (Web Audio API)
- Unread message counter in browser tab
- Scroll-to-bottom floating button
- Dark/Light theme toggle with localStorage persistence
- Mobile-responsive with slide-out sidebar
- Date separators between message groups
- Live character counter with color warnings

## Tech Stack

- **Backend:** Node.js, Express, Socket.IO
- **Frontend:** Vanilla JS, CSS custom properties
- **Real-time:** WebSocket via Socket.IO

## Setup

```bash
npm install
npm start
```

Open `http://localhost:3000` in your browser.

## Development

```bash
npm run dev
```

## License

MIT
