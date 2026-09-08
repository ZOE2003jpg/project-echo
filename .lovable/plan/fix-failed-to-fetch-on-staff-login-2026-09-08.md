# Fix "Failed to fetch" on staff login

## What's actually wrong

The Pitch Capital server is healthy. I called the login address directly and it answered normally (it correctly replied "admin not found" for a fake email), so the credentials path and the server are fine.

The failure happens in the browser, before the answer is ever read. The app asks the browser to send site cookies along with every request to pitchcapital.ng. The Pitch Capital server replies with an "open to everyone" sharing rule, and browsers refuse that exact combination — cookies plus open sharing — so the request is blocked and shows up as "Failed to fetch". Nothing about your email or password is involved.

The app doesn't need those cookies: it already signs in with a token that it stores and sends on every later request.

## The fix

- Stop sending browser cookies with API calls (remove the cookie-sharing option in the app's request helper). Everything continues to authenticate through the existing token.
- Make failures readable: when the browser blocks or can't reach the server, show "Cannot reach the Pitch Capital server. Please check your connection and try again." instead of the raw "Failed to fetch".
- Keep the real server messages (for example, wrong password or account not found) showing as-is on the login screens.

## Technical notes

- `src/lib/api-client.ts`: remove `credentials: "include"` from the `fetch` call; wrap the `fetch` in a try/catch that rethrows a friendly network error. Auth stays on the `Authorization: Bearer` header sourced from `pc_admin_session_token`.
- Verified: `OPTIONS/POST https://pitchcapital.ng/api/admin/login.php` returns `Access-Control-Allow-Origin: *` and a JSON body, confirming the endpoint and CORS preflight are fine and that `credentials: "include"` is the blocker.
- No server, endpoint, or credential changes needed.

## Verification

Sign in on the admin and staff login pages from the preview and confirm the dashboard loads, and that a wrong password shows the server's message rather than a network error.
