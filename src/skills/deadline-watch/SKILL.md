# Deadline Watch

## Purpose
Monitors receipt return deadlines and sends proactive WhatsApp reminders before the return window closes.

## Trigger
Runs daily at 8:00 AM IST via `node-cron` schedule: `0 8 * * *`

## Inputs
- Supabase `receipts` table: queries rows where `return_deadline_date` is within the next 7 days
- User preferences from `memory/{userPhone}/prefs.yaml` (quiet hours, max alerts per hour)

## Outputs
- WhatsApp messages sent to users with upcoming return deadlines (1, 3, or 7 days remaining)
- Console logs for each alert sent

## Rate Limiting
- Respects quiet hours (default 22:00–08:00) — no alerts during this window
- Maximum 3 alerts per hour per user (configurable via prefs.yaml)
- In-memory counter keyed by `userPhone:currentHour`

## How to Test
1. Insert a test receipt into Supabase with `return_deadline_date` set to 1, 3, or 7 days from today
2. Call `runDeadlineWatch()` directly (exported for manual invocation)
3. Verify WhatsApp message is received on the test phone number
4. Test quiet hours by setting `quiet_hours_start` to the current hour in prefs.yaml
5. Test rate limiting by inserting 4+ receipts for the same user — only 3 alerts should fire
