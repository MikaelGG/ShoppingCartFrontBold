import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ReactDOM from 'react-dom/client';
import Layout from './components/Layout';
import './theme.css';

import App from './pages/app/App'
import SignUpPage from './pages/SignUpPage';
import SignInPage from './pages/SignInPage';
import UserConfig from './pages/UserConfig';
import ShoppingCart from './pages/ShoppingCart';
import ShippingAddresses from './pages/ShippingAddresses';
import PurchaseRecords from './pages/PurchaseRecords';
import Administrators from './pages/Administrators';
import ManageProducts from './pages/ManageProducts';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <AuthProvider>
    <Index />
  </AuthProvider>
);

export default function Index() {
  return (
    <BrowserRouter>
      <CartProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/signin" element={<SignInPage />} />
            <Route path="/user-conf" element={<UserConfig />} />
            <Route path='/shopping-cart' element={<ShoppingCart />} />
            <Route path='/shipping-addresses' element={<ShippingAddresses />} />
            <Route path='/purchase-records' element={<PurchaseRecords />} />
            <Route path="/administrators" element={<Administrators />} />
            <Route path="/manage-products" element={<ManageProducts />} />
          </Routes>
        </Layout>
      </CartProvider>
    </BrowserRouter>
  );
}

