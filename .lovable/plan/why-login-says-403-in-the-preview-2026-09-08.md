# Why login says "403" in the preview

## What I checked just now

- The login call works fine from this project's own server: it reaches pitchcapital.ng and returns a real answer.
- Calling the same address on the preview web address returns a Lovable "Forbidden" page instead of reaching the app at all.
- The pitchcapital.ng server still sends its browser-permission header twice (`Access-Control-Allow-Origin: *` repeated), which browsers reject, so the browser cannot call it directly either.

So yes: the preview environment is blocking the call, not your password and not the app code.

## The fix

1. Publish the app. On a published site the `/api/public/...` address is allowed through, so login will work end to end. This is the immediate unblock.
2. Add a clear message for the blocked case: if the app gets a "Forbidden" page instead of a real answer, show "Sign-in isn't available in the preview. Please use the published site." rather than "Request failed: 403".
3. Permanent cleanup (optional, on your server): remove the duplicated permission header from pitchcapital.ng so the repeated header disappears. Once that's done the browser could talk to the API directly and the go-between would no longer be needed.

## Technical notes

- Proxy route: `src/routes/api/public/pc.$.ts` — verified working locally (`POST /api/public/pc/admin/login.php` returns upstream 401 JSON for a fake account).
- Preview host returns 401/403 HTML for that path; the `/api/public/*` bypass applies to published deployments.
- `src/lib/api-client.ts`: when a response is not JSON and the status is 401/403, throw the preview-specific message instead of the raw status.
- No change to credentials, endpoints, or the login flow itself.

## Verification

Publish, open the published URL, sign in on the admin and staff login screens, confirm the dashboard loads and a wrong password shows the server's own message.
