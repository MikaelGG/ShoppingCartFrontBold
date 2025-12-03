import axios from 'axios';
import './css/Products.css'
import API from '../config/AxiosConfig.jsx'
import { useEffect, useState } from 'react';
import { useCart } from '../context/CartContext';

export default function ProductCard({ product, onAddToCart }) {
    const [quantity, setQuantity] = useState(0);

    return (
        <div className="product-card">
            <h3 className="product-name">{product.name}</h3>
            <img
                src={product.photo}
                alt={product.name}
                className="product-image"
            />
            <p className="product-description">{product.description}</p>
            <div className="product-spacer" />
            <div className="product-footer">
                <span className="product-price">
                    Precio ${product.price}
                </span>
                <div className="quantity-controls">
                    <button
                        onClick={() => setQuantity(q => Math.max(0, q - 1))}
                        className="quantity-btn"
                    >
                        -
                    </button>
                    <span className="quantity-display">{quantity}</span>
                    <button
                        onClick={() => setQuantity(q => q + 1)}
                        className="quantity-btn"
                    >
                        +
                    </button>
                </div>
                <button
                    className="add-to-cart-btn"
                    onClick={() => {
                        onAddToCart(product, quantity);
                        setQuantity(0);
                    }}
                >
                    Agregar al carrito
                </button>
            </div>
        </div>
    );
};

export function Products({ selectedType, searchQuery }) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const { addToCart } = useCart();

    useEffect(() => {
        setLoading(true);
        let url = '';
        if (searchQuery && searchQuery.trim() !== "") {
            url = `/api/products/searcher?name=${encodeURIComponent(searchQuery)}`;
        } else if (selectedType) {
            url = `/api/products/product/${selectedType}`;
        } else {
            url = '/api/products';
        }
        API.get(url).then(res => setProducts(res.data))
            .catch(() => setProducts([]))
            .finally(() => setLoading(false));
    }, [selectedType, searchQuery]);

    return (
        <div className="products-container">
            {loading ? (
                <div className="loading-message">Cargando...</div>
            ) : products.length === 0 && searchQuery ? (
                <div className="not-found-message">Producto no encontrado</div>
            ) : products.length === 0 ? (
                <div className="no-products-message">No hay productos para mostrar</div>
            ) : (
                <div className="products-grid">
                    {products.map(product => (
                        <ProductCard key={product.code} product={product} onAddToCart={addToCart} />
                    ))}
                </div>
            )}
        </div>
    );
}
