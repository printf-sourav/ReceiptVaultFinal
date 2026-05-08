# Subscription Manager

## Purpose
Monitors active subscriptions and sends renewal reminders 7 days before renewal date. Users can reply with KEEP or CANCEL to express intent — but the system never auto-cancels any subscription.

## Trigger
Runs daily at 8:10 AM IST via `node-cron` schedule: `10 8 * * *`

## Inputs
- Supabase `subscriptions` table: rows where `status = 'active'` and `renewal_date` is within 7 days
- User preferences from `memory/{userPhone}/prefs.yaml`

## Outputs
- WhatsApp messages with subscription name, renewal date, amount, and KEEP/CANCEL reply options
- Console logs for each alert sent

## Cancellation Intent Behavior
- **NEVER auto-cancels** any subscription
- `runSubscriptionManager()` sends the renewal alert with KEEP/CANCEL reply options
- When the user replies "CANCEL" via WhatsApp, the **`/webhook/whatsapp` POST handler** takes over:
  1. **Step 1** — Sends a confirmation prompt: *"Are you sure you want to note cancellation intent for Netflix? Reply YES or NO."*
  2. **Step 2** — On "YES": records intent in `memory/{userPhone}/prefs.yaml`, appends to `logs/cancellation-intents.json`, and replies with the cancellation URL
  3. On "NO": clears the pending state, sends "No worries" message
- The subscription status in Supabase is **never changed** — only intent is recorded

## How to Test
1. Insert a row into the `subscriptions` table with `status = 'active'` and `renewal_date` = 3 days from today
2. Call `runSubscriptionManager()` directly
3. Verify WhatsApp message is received with KEEP/CANCEL options
4. Send "cancel" as a text message via WhatsApp and verify the intent is logged
5. Confirm no subscription status was actually changed in the database
