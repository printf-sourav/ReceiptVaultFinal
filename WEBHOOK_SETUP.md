# Webhook Tunneling Setup

ReceiptVault already exposes the WhatsApp webhook at `POST /webhook/whatsapp`. To let Meta reach your local machine, run the server on port `3000` and expose it with a tunnel.

## 1. Start the app

```bash
npm run dev
```

## 2. Open a tunnel

Use either ngrok or cloudflared.

### ngrok

```bash
ngrok http 3000
```

### cloudflared

```bash
cloudflared tunnel --url http://localhost:3000
```

## 3. Copy the public URL

Set `WEBHOOK_PUBLIC_URL` to the tunnel URL, for example:

```env
WEBHOOK_PUBLIC_URL=https://abcd-1234.ngrok-free.app
```

The webhook callback Meta should use is:

```text
https://abcd-1234.ngrok-free.app/webhook/whatsapp
```

## 4. Configure Meta

In the WhatsApp webhook settings, set:

- Callback URL: your tunnel URL plus `/webhook/whatsapp`
- Verify token: the same value as `META_VERIFY_TOKEN`

## 5. Verify

When the server starts, it will log the callback URL if `WEBHOOK_PUBLIC_URL` is set.

If Meta still cannot verify the webhook, check:

- the tunnel is still running
- the app is listening on port `3000`
- `META_VERIFY_TOKEN` matches exactly
- the callback URL uses `https`