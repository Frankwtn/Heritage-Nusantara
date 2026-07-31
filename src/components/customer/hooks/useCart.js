import { useState } from 'react'

export function useCart() {
  const [cart, setCart] = useState({}) // { [itemId]: { qty, note } }

  function addToCart(id) {
    setCart(prev => ({
      ...prev,
      [id]: { qty: (prev[id]?.qty ?? 0) + 1, note: prev[id]?.note ?? '' },
    }))
  }

  function removeFromCart(id) {
    setCart(prev => {
      const newQty = (prev[id]?.qty ?? 0) - 1
      if (newQty <= 0) {
        const next = { ...prev }
        delete next[id]
        return next
      }
      return { ...prev, [id]: { ...prev[id], qty: newQty } }
    })
  }

  function updateNote(id, note) {
    setCart(prev => ({ ...prev, [id]: { ...prev[id], note } }))
  }

  function clearCart() {
    setCart({})
  }

  const cartCount = Object.values(cart).reduce((a, { qty }) => a + qty, 0)

  return { cart, cartCount, addToCart, removeFromCart, updateNote, clearCart }
}
