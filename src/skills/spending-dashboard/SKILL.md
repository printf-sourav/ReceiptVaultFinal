# Spending Dashboard

## Purpose
Sends a weekly spending summary to each user every Monday morning, including total spend, breakdown by store, and the single biggest purchase of the week.

## Trigger
Runs every Monday at 8:15 AM IST via `node-cron` schedule: `15 8 * * 1`

## Monday-Only Execution
The function checks `new Date().getDay() !== 1` at the top and returns early on non-Mondays. This is a safety guard in case the cron expression is misconfigured.

## Data Sources
- Supabase `receipts` table: all receipts from the past 7 days per user
- Groups by `store_name`, sums `total_amount`, identifies max purchase

## Message Format
```
Your week in spending:
Total: INR 4,500
Breakdown:
— BigBasket: INR 2,100
— Amazon: INR 1,800
— Swiggy: INR 600
Biggest purchase: Amazon — INR 1,800
Have a budget-friendly week ahead!
```

## How to Test
1. Insert several receipts for a test user with `purchase_date` within the last 7 days
2. Temporarily override the day check (or run on a Monday)
3. Call `runSpendingDashboard()` directly
4. Verify the WhatsApp message includes correct totals, breakdown, and biggest purchase
5. Test with zero receipts — should skip silently for that user
