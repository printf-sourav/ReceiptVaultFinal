# ReceiptVault Daily Heartbeat

ReceiptVault runs a background process every morning at 8:00 AM IST. It checks your receipts, predicts what you need, monitors your subscriptions, and scans your email — all so you never miss a return deadline, overpay for a forgotten subscription, or run out of essentials. Here is exactly what it does each morning.

OpenClaw is the orchestration layer behind this heartbeat. It schedules each skill, applies safety rules, and ensures alerts remain concise, timely, and non-spammy.

## 8:00 AM — Deadline Watch

Every morning, ReceiptVault queries all stored receipts looking for items with return windows closing within the next 1, 3, or 7 days. For each match, it sends you a WhatsApp message like: "Return window for your Croma purchase closes in 3 days — 2026-05-10. Act now if you want to return it." It never sends duplicate reminders for the same receipt on the same day, and it respects your quiet hours so you won't be woken up by an alert at midnight.

## 8:05 AM — Consumable Reorder Check

At 8:05 AM, the system looks at every consumable item you've purchased more than once — things like milk, toothpaste, detergent, or cooking oil. It calculates how often you typically buy each item by averaging the gaps between past purchases. When it predicts you'll need to reorder within 3 days, it sends a helpful nudge: "Running low on olive oil? Your usual reorder is due around 2026-05-06. Order here: [Amazon India link]." The link opens a pre-filled Amazon search so you can reorder in one tap.

## 8:10 AM — Subscription Renewal Check

At 8:10 AM, ReceiptVault checks for any active subscriptions renewing within 7 days. For each one, it sends you the service name, renewal amount, and date — along with simple reply options: "Netflix renews on 2026-05-09 for INR 649. Reply KEEP to continue or CANCEL to record cancellation intent." If you reply CANCEL, the system records your intent and provides the cancellation URL, but it never cancels anything on your behalf. Your money, your decision.

## 8:15 AM — Weekly Spending Summary (Mondays only)

Every Monday at 8:15 AM, ReceiptVault compiles your spending from the past week. It sends you a clean summary: total amount spent, a breakdown by store (so you can see where most of your money went), and your single biggest purchase. Think of it as a friendly weekly budget check-in that takes zero effort on your part.

## 8:20 AM — Gmail Sync

At 8:20 AM, ReceiptVault scans your Gmail inbox for order confirmations and invoices from Amazon, Flipkart, Zomato, Swiggy, and BigBasket received in the last 24 hours. It extracts store names, amounts, items, and dates automatically using AI — then stores them as receipts just like a photo scan. No user action needed. Your online purchases are tracked alongside your in-store receipts, giving you a complete spending picture without lifting a finger.
