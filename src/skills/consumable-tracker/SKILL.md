# Consumable Tracker

## Purpose
Predicts when users will run out of frequently purchased consumable items (food, toiletries, household supplies) and sends proactive reorder suggestions with Amazon India links.

## Trigger
Runs daily at 8:05 AM IST via `node-cron` schedule: `5 8 * * *`

## Algorithm
1. Queries all consumable items from `receipt_items` table (where `is_consumable = true`)
2. Groups purchases by user and item name
3. For items with 2+ purchases, calculates average interval between purchases
4. Predicts next reorder date: `last_purchase_date + average_interval`
5. If predicted reorder is within 3 days, sends a WhatsApp notification

## Inputs
- Supabase `receipt_items` table (joined with `receipts` for user_phone and purchase_date)
- User preferences from `memory/{userPhone}/prefs.yaml`

## Outputs
- WhatsApp messages with reorder suggestions and Amazon India search links
- Updated `memory/{userPhone}/patterns.yaml` with computed reorder intervals
- Console logs for each alert sent

## How to Test
1. Insert 2+ receipts for the same user containing the same consumable item (e.g., "milk") with purchase dates showing a pattern (e.g., every 7 days)
2. Set the last purchase date so that the predicted next purchase is within 3 days
3. Call `runConsumableTracker()` directly
4. Verify WhatsApp message with Amazon link is received
5. Check `memory/{phone}/patterns.yaml` is updated with reorder interval data
