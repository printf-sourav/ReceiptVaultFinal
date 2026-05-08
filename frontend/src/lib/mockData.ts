import { addDays, subDays, format } from 'date-fns';

const now = new Date();

export interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
}

export interface Receipt {
  id: string;
  store: string;
  storeLogo: string;
  item: string;
  amount: number;
  date: Date;
  category: 'Electronics' | 'Food' | 'Fashion' | 'Groceries' | 'Other';
  paymentMode: string;
  returnDeadline: Date | null;
  warrantyExpiry: Date | null;
  imageUrl: string;
  items: ReceiptItem[];
  aiExtracted: boolean;
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  cycle: 'month' | 'year';
  renewsIn: number;
  urgent: boolean;
}

export const receipts: Receipt[] = [
  {
    id: '1',
    store: 'Reliance Digital',
    storeLogo: 'RD',
    item: 'Samsung 55" QLED TV',
    amount: 82990,
    date: subDays(now, 5),
    category: 'Electronics',
    paymentMode: 'Credit Card',
    returnDeadline: addDays(now, 2),
    warrantyExpiry: addDays(now, 365),
    imageUrl: 'https://placehold.co/400x300/111827/63B3ED?text=Receipt',
    items: [
      { name: 'Samsung 55" QLED TV', quantity: 1, price: 79990 },
      { name: 'Extended Warranty', quantity: 1, price: 2000 },
      { name: 'HDMI Cable', quantity: 1, price: 1000 },
    ],
    aiExtracted: true,
  },
  {
    id: '2',
    store: 'Myntra',
    storeLogo: 'MY',
    item: 'Nike Air Force 1',
    amount: 7495,
    date: subDays(now, 3),
    category: 'Fashion',
    paymentMode: 'UPI',
    returnDeadline: addDays(now, 5),
    warrantyExpiry: null,
    imageUrl: 'https://placehold.co/400x300/111827/B794F4?text=Receipt',
    items: [
      { name: 'Nike Air Force 1', quantity: 1, price: 7495 },
    ],
    aiExtracted: true,
  },
  {
    id: '3',
    store: 'Flipkart',
    storeLogo: 'FK',
    item: 'boAt Airdopes 141',
    amount: 1299,
    date: subDays(now, 2),
    category: 'Electronics',
    paymentMode: 'Debit Card',
    returnDeadline: addDays(now, 1),
    warrantyExpiry: addDays(now, 365),
    imageUrl: 'https://placehold.co/400x300/111827/63B3ED?text=Receipt',
    items: [
      { name: 'boAt Airdopes 141', quantity: 1, price: 1299 },
    ],
    aiExtracted: true,
  },
  {
    id: '4',
    store: 'Amazon.in',
    storeLogo: 'AZ',
    item: 'Kindle Paperwhite',
    amount: 11999,
    date: subDays(now, 10),
    category: 'Electronics',
    paymentMode: 'Credit Card',
    returnDeadline: null,
    warrantyExpiry: addDays(now, 355),
    imageUrl: 'https://placehold.co/400x300/111827/63B3ED?text=Receipt',
    items: [
      { name: 'Kindle Paperwhite (11th Gen)', quantity: 1, price: 11999 },
    ],
    aiExtracted: true,
  },
  {
    id: '5',
    store: 'Zomato',
    storeLogo: 'ZO',
    item: 'Weekend dinner',
    amount: 847,
    date: subDays(now, 1),
    category: 'Food',
    paymentMode: 'UPI',
    returnDeadline: null,
    warrantyExpiry: null,
    imageUrl: 'https://placehold.co/400x300/111827/F6AD55?text=Receipt',
    items: [
      { name: 'Butter Chicken', quantity: 1, price: 349 },
      { name: 'Garlic Naan x2', quantity: 2, price: 98 },
      { name: 'Dal Makhani', quantity: 1, price: 249 },
      { name: 'Gulab Jamun', quantity: 1, price: 99 },
      { name: 'Delivery Fee', quantity: 1, price: 52 },
    ],
    aiExtracted: true,
  },
  {
    id: '6',
    store: 'BigBasket',
    storeLogo: 'BB',
    item: 'Monthly groceries',
    amount: 3240,
    date: subDays(now, 4),
    category: 'Groceries',
    paymentMode: 'UPI',
    returnDeadline: null,
    warrantyExpiry: null,
    imageUrl: 'https://placehold.co/400x300/111827/68D391?text=Receipt',
    items: [
      { name: 'Tata Salt 1kg', quantity: 2, price: 48 },
      { name: 'Fortune Oil 1L', quantity: 1, price: 189 },
      { name: 'Aashirvaad Atta 5kg', quantity: 1, price: 299 },
      { name: 'Amul Butter 500g', quantity: 1, price: 275 },
      { name: 'Mixed Fruits & Vegs', quantity: 1, price: 2429 },
    ],
    aiExtracted: true,
  },
  {
    id: '7',
    store: 'D-Mart',
    storeLogo: 'DM',
    item: 'Weekly vegetables',
    amount: 560,
    date: subDays(now, 2),
    category: 'Groceries',
    paymentMode: 'Cash',
    returnDeadline: null,
    warrantyExpiry: null,
    imageUrl: 'https://placehold.co/400x300/111827/68D391?text=Receipt',
    items: [
      { name: 'Tomatoes 1kg', quantity: 1, price: 60 },
      { name: 'Onions 2kg', quantity: 1, price: 80 },
      { name: 'Potatoes 2kg', quantity: 1, price: 70 },
      { name: 'Mixed vegetables', quantity: 1, price: 350 },
    ],
    aiExtracted: false,
  },
  {
    id: '8',
    store: 'Croma',
    storeLogo: 'CR',
    item: 'realme Buds',
    amount: 999,
    date: subDays(now, 12),
    category: 'Electronics',
    paymentMode: 'UPI',
    returnDeadline: subDays(now, 2),
    warrantyExpiry: addDays(now, 353),
    imageUrl: 'https://placehold.co/400x300/111827/63B3ED?text=Receipt',
    items: [
      { name: 'realme Buds Air 5', quantity: 1, price: 999 },
    ],
    aiExtracted: true,
  },
  {
    id: '9',
    store: 'Swiggy',
    storeLogo: 'SW',
    item: 'Lunch order',
    amount: 342,
    date: subDays(now, 0),
    category: 'Food',
    paymentMode: 'UPI',
    returnDeadline: null,
    warrantyExpiry: null,
    imageUrl: 'https://placehold.co/400x300/111827/F6AD55?text=Receipt',
    items: [
      { name: 'Veg Biryani', quantity: 1, price: 199 },
      { name: 'Raita', quantity: 1, price: 49 },
      { name: 'Coke 300ml', quantity: 1, price: 40 },
      { name: 'Delivery Fee', quantity: 1, price: 54 },
    ],
    aiExtracted: true,
  },
  {
    id: '10',
    store: 'Nykaa',
    storeLogo: 'NK',
    item: 'Skincare set',
    amount: 2100,
    date: subDays(now, 6),
    category: 'Other',
    paymentMode: 'Credit Card',
    returnDeadline: addDays(now, 8),
    warrantyExpiry: null,
    imageUrl: 'https://placehold.co/400x300/111827/B794F4?text=Receipt',
    items: [
      { name: 'Vitamin C Serum', quantity: 1, price: 899 },
      { name: 'Moisturizer SPF 50', quantity: 1, price: 749 },
      { name: 'Face Wash', quantity: 1, price: 452 },
    ],
    aiExtracted: true,
  },
  {
    id: '11',
    store: 'H&M',
    storeLogo: 'HM',
    item: 'Winter jacket',
    amount: 4999,
    date: subDays(now, 7),
    category: 'Fashion',
    paymentMode: 'Credit Card',
    returnDeadline: addDays(now, 14),
    warrantyExpiry: null,
    imageUrl: 'https://placehold.co/400x300/111827/B794F4?text=Receipt',
    items: [
      { name: 'Puffer Jacket - Black', quantity: 1, price: 4999 },
    ],
    aiExtracted: true,
  },
  {
    id: '12',
    store: 'JioMart',
    storeLogo: 'JM',
    item: 'Household items',
    amount: 1850,
    date: subDays(now, 8),
    category: 'Groceries',
    paymentMode: 'UPI',
    returnDeadline: null,
    warrantyExpiry: null,
    imageUrl: 'https://placehold.co/400x300/111827/68D391?text=Receipt',
    items: [
      { name: 'Detergent 2kg', quantity: 1, price: 450 },
      { name: 'Floor Cleaner 1L', quantity: 2, price: 300 },
      { name: 'Tissues Box x5', quantity: 1, price: 350 },
      { name: 'Soap Bar x6', quantity: 1, price: 250 },
      { name: 'Dish Soap 750ml', quantity: 2, price: 500 },
    ],
    aiExtracted: false,
  },
  {
    id: '13',
    store: 'Decathlon',
    storeLogo: 'DC',
    item: 'Running shoes',
    amount: 3499,
    date: subDays(now, 3),
    category: 'Fashion',
    paymentMode: 'Debit Card',
    returnDeadline: addDays(now, 30),
    warrantyExpiry: null,
    imageUrl: 'https://placehold.co/400x300/111827/B794F4?text=Receipt',
    items: [
      { name: 'Kiprun KS500 Running Shoes', quantity: 1, price: 3499 },
    ],
    aiExtracted: true,
  },
  {
    id: '14',
    store: 'Boat Lifestyle',
    storeLogo: 'BT',
    item: 'Speaker',
    amount: 2299,
    date: subDays(now, 14),
    category: 'Electronics',
    paymentMode: 'Credit Card',
    returnDeadline: null,
    warrantyExpiry: addDays(now, 351),
    imageUrl: 'https://placehold.co/400x300/111827/63B3ED?text=Receipt',
    items: [
      { name: 'boAt Stone 1200 Speaker', quantity: 1, price: 2299 },
    ],
    aiExtracted: true,
  },
  {
    id: '15',
    store: 'Lenskart',
    storeLogo: 'LK',
    item: 'Eyeglasses',
    amount: 5499,
    date: subDays(now, 5),
    category: 'Other',
    paymentMode: 'UPI',
    returnDeadline: addDays(now, 7),
    warrantyExpiry: addDays(now, 365),
    imageUrl: 'https://placehold.co/400x300/111827/B794F4?text=Receipt',
    items: [
      { name: 'Vincent Chase Frame', quantity: 1, price: 2499 },
      { name: 'Blu-cut Lenses', quantity: 1, price: 3000 },
    ],
    aiExtracted: true,
  },
];

export const subscriptions: Subscription[] = [
  { id: 's1', name: 'Netflix Premium', amount: 649, cycle: 'month', renewsIn: 4, urgent: false },
  { id: 's2', name: 'Spotify Premium', amount: 119, cycle: 'month', renewsIn: 12, urgent: false },
  { id: 's3', name: 'Amazon Prime', amount: 1499, cycle: 'year', renewsIn: 45, urgent: false },
  { id: 's4', name: 'YouTube Premium', amount: 189, cycle: 'month', renewsIn: 2, urgent: true },
  { id: 's5', name: 'Disney+ Hotstar', amount: 899, cycle: 'year', renewsIn: 90, urgent: false },
];

export const spendingByMonth = [
  { month: 'Jul', amount: 28900 },
  { month: 'Aug', amount: 19800 },
  { month: 'Sep', amount: 22100 },
  { month: 'Oct', amount: 31500 },
  { month: 'Nov', amount: 18200 },
  { month: 'Dec', amount: 24830 },
];

export const spendingByWeek = [
  { day: 'Mon', amount: 3400 },
  { day: 'Tue', amount: 1200 },
  { day: 'Wed', amount: 5600 },
  { day: 'Thu', amount: 2100 },
  { day: 'Fri', amount: 4300 },
  { day: 'Sat', amount: 6800 },
  { day: 'Sun', amount: 1430 },
];

export const categoryBreakdown = [
  { name: 'Food', emoji: '🍕', percent: 28, amount: 6952, color: '#F6AD55' },
  { name: 'Electronics', emoji: '⚡', percent: 35, amount: 8690, color: '#63B3ED' },
  { name: 'Fashion', emoji: '👗', percent: 18, amount: 4469, color: '#B794F4' },
  { name: 'Groceries', emoji: '🛒', percent: 12, amount: 2980, color: '#68D391' },
  { name: 'Other', emoji: '📦', percent: 7, amount: 1739, color: '#4A5568' },
];

export const topMerchants = [
  { rank: 1, store: 'Reliance Digital', amount: 82990 },
  { rank: 2, store: 'Amazon.in', amount: 11999 },
  { rank: 3, store: 'Myntra', amount: 7495 },
  { rank: 4, store: 'Lenskart', amount: 5499 },
  { rank: 5, store: 'H&M', amount: 4999 },
];

export const getCategoryColor = (category: string): string => {
  const map: Record<string, string> = {
    Electronics: '#63B3ED',
    Food: '#F6AD55',
    Fashion: '#B794F4',
    Groceries: '#68D391',
    Other: '#4A5568',
  };
  return map[category] || '#4A5568';
};

export const formatIndianCurrency = (amount: number): string => {
  const str = Math.round(amount).toString();
  if (str.length <= 3) return '₹' + str;
  let result = str.slice(-3);
  let remaining = str.slice(0, -3);
  while (remaining.length > 2) {
    result = remaining.slice(-2) + ',' + result;
    remaining = remaining.slice(0, -2);
  }
  if (remaining.length > 0) {
    result = remaining + ',' + result;
  }
  return '₹' + result;
};

export const formatDate = (date: Date): string => {
  return format(date, 'dd/MM/yyyy');
};

export const getDaysLeft = (deadline: Date | null): number | null => {
  if (!deadline) return null;
  const diff = deadline.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};
