import { Clock, Utensils, ChefHat as CookIcon } from 'lucide-react'

export const ORDER_STATUS_CONFIG = {
  Pending: {
    label: 'Pending',
    icon:  Clock,
    bg:    'bg-amber-50',
    border:'border-amber-200',
    text:  'text-amber-700',
    dot:   'bg-amber-400',
  },
  Cooking: {
    label: 'Cooking',
    icon:  CookIcon,
    bg:    'bg-blue-50',
    border:'border-blue-200',
    text:  'text-blue-700',
    dot:   'bg-blue-400',
  },
  Served: {
    label: 'Served',
    icon:  Utensils,
    bg:    'bg-emerald-50',
    border:'border-emerald-200',
    text:  'text-emerald-700',
    dot:   'bg-emerald-400',
  },
}

export const PAYMENT_STATUS_CONFIG = {
  Unpaid:    { label: 'Unpaid',         text: 'text-red-600',     bg: 'bg-red-50',     border: 'border-red-200' },
  Requested: { label: 'Bill Requested', text: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200' },
  Paid:      { label: 'Paid',           text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
}

export const CATEGORIES = ['All', 'Food', 'Drink', 'Dessert']

export const CATEGORY_LABELS = {
  Food:    'Food',
  Drink:   'Drink',
  Dessert: 'Dessert',
}
