import Header from "./HeaderNav";
import { useState } from "react";
import CartMenu from "./CartMenu"

export default function Layout({ children }) {

  const [cartOpen, setCartOpen] = useState(false);

  return (
    <div>
      {/* Header siempre arriba */}
      <Header onCartClick={() => setCartOpen(true)} />
      <CartMenu open={cartOpen} onClose={() => setCartOpen(false)} />

      {/* Aquí se renderizan las páginas */}
      <main>
        {children}
      </main>

    </div>
  );
}
