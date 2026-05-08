import { z } from "zod";

export const ReceiptItemSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().min(1).default(1),
  unit_price: z.number().min(0),
  total_price: z.number().min(0),
  is_consumable: z.boolean().default(false),
});

export const ReceiptSchema = z.object({
  store_name: z.string().min(1).default("Unknown Store"),
  purchase_date: z.string().nullable().default(null),
  total_amount: z.number().min(0),
  currency: z.string().length(3).default("INR"),
  items: z.array(ReceiptItemSchema).default([]),
  return_deadline_days: z.number().nullable().default(null),
  warranty_months: z.number().nullable().default(null),
  receipt_number: z.string().nullable().default(null),
  date_inferred: z.boolean().default(false),
  parse_error: z.boolean().default(false),
});

export type ValidatedReceipt = z.infer<typeof ReceiptSchema>;
export type ReceiptItem = z.infer<typeof ReceiptItemSchema>;

export function validateReceiptData(raw: unknown): ValidatedReceipt {
  const result = ReceiptSchema.safeParse(raw);

  if (!result.success) {
    console.error("Zod validation errors:", result.error.issues);
    return ReceiptSchema.parse({ total_amount: 0 });
  }

  const data = result.data;
  if (data.purchase_date === null) {
    data.date_inferred = true;
  }

  return data;
}
