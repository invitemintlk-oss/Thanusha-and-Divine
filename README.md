# Thanusha & Divine - Wedding Invitation

Digital wedding invitation covering both events:

- **Holy Matrimony** - 16 Dec 2026, 3.30 PM - St. Sebastian's Church, Katuwapitiya, Negombo
- **Homecoming** - 20 Dec 2026, 7.00 PM - The Maze, Glass House Venue

All wedding details live in `src/invitation.ts`.

## Admin panel - `/admin`

Generates personalised invitation links and WhatsApp messages.

1. Pick a prefix (Mr., Mrs., Miss, Mr. & Mrs., Family, Dear) and type the guest name.
2. Choose what the guest is invited to: **Both**, **Church only** or **Homecoming only**.
3. Click **Generate Link**, then **Copy Link Only** or **Copy Full Message**.

Link format: `{baseURL}/{guestName}?p={prefix}&e={both|church|homecoming}`.
The invitation only shows the events the guest was invited to.

## Development

```bash
npm install
npm run dev
```

RSVPs are sent to the Google Apps Script in `code.gs`. Set `VITE_GOOGLE_SCRIPT_URL`
(in `.env` locally and in the Vercel project settings) to that script's web-app URL.
