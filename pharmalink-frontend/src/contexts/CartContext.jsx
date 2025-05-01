import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (medicine) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === medicine._id);
      if (existingItem) {
        return prevItems.map(item =>
          item.id === medicine._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevItems, {
        id: medicine._id,
        name: medicine.name,
        brand: medicine.brand,
        price: medicine.price,
        quantity: 1,
        image: medicine.image,
        prescription: medicine.prescription,
        pharmacy: {
          id: medicine.pharmacy._id,
          name: medicine.pharmacy.name,
          distance: medicine.pharmacy.distance,
          rating: medicine.pharmacy.rating,
          deliveryTime: medicine.pharmacy.deliveryTime,
        },
      }];
    });
  };

  const removeFromCart = (medicineId) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== medicineId));
  };

  const updateQuantity = (medicineId, change) => {
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === medicineId
          ? { ...item, quantity: Math.max(1, item.quantity + change) }
          : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export default CartContext; 