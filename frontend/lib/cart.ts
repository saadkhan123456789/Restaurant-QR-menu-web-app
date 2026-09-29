import { useEffect, useState } from "react";

export type CartItem = {
  menuItemId: number;
  name: string;
  price: number;
  quantity: number;
};

const CART_KEY = "restaurant_cart_items";
const NOTES_KEY = "restaurant_cart_notes";
const CART_EVENT = "cart-updated";

function dispatchCartUpdate() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CART_EVENT));
  }
}

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  dispatchCartUpdate();
}

export function addToCart(item: {
  menuItemId: number;
  name: string;
  price: number;
}) {
  const items = getCart();
  const existing = items.find((i) => i.menuItemId === item.menuItemId);
  if (existing) {
    existing.quantity += 1;
  } else {
    items.push({ ...item, quantity: 1 });
  }
  saveCart(items);
}

export function updateQuantity(menuItemId: number, quantity: number) {
  let items = getCart();
  if (quantity <= 0) {
    items = items.filter((i) => i.menuItemId !== menuItemId);
  } else {
    const existing = items.find((i) => i.menuItemId === menuItemId);
    if (existing) existing.quantity = quantity;
  }
  saveCart(items);
}

export function removeFromCart(menuItemId: number) {
  const items = getCart().filter((i) => i.menuItemId !== menuItemId);
  saveCart(items);
}

export function clearCart() {
  saveCart([]);
  setNotes("");
}

export function getCartCount(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.quantity, 0);
}

export function getCartTotal(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.quantity * i.price, 0);
}

export function getNotes(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(NOTES_KEY) ?? "";
}

export function setNotes(notes: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(NOTES_KEY, notes);
}

export function useCartItems(): CartItem[] {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const update = () => setItems(getCart());
    update();
    window.addEventListener(CART_EVENT, update);
    return () => window.removeEventListener(CART_EVENT, update);
  }, []);

  return items;
}
