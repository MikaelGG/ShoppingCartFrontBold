import React, { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import API from "../config/AxiosConfig";
import './css/ShoppingCart.css';

export default function ShoppingCart() {
    const { cart } = useCart();
    const { token } = useAuth();
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [addresses, setAddresses] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [userId, setUserId] = useState(null);
    const [expandedSections, setExpandedSections] = useState({
        address: false,
        buyerInfo: false,
        paymentGuide: false
    });
    const [dataBold, setDataBold] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    useEffect(() => {
        if (token) {
            const tkdec = jwtDecode(token);
            setUserId(tkdec.id);
            fetchUserData();
            fetchAddresses();
        }
    }, [token]);

    // Renderizar botón Bold cuando dataBold esté disponible
    useEffect(() => {
        if (!dataBold) return;

        console.log("🎨 Datos Bold recibidos:", dataBold);
        renderBoldButton();
    }, [dataBold]);

    const fetchUserData = async () => {
        try {
            const tokdecoded = jwtDecode(token);
            const response = await API.get(`/api/users/email?email=${tokdecoded.sub}`);
            setUserData(response.data);
        } catch (error) {
            console.error("Error fetching user data", error);
        }
    };

    const fetchAddresses = async () => {
        try {
            const tokdecoded = jwtDecode(token);
            const response = await API.get(`/api/shipping-addresses/ShippAdd?idClient=${tokdecoded.id}`);
            setAddresses(response.data);
        } catch (error) {
            console.error("Error fetching addresses", error);
        }
    };

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const renderBoldButton = () => {
        const container = document.getElementById("bold-button-container");
        if (!container) {
            console.error("❌ Container no encontrado");
            return;
        }

        console.log("🏗️ Creando botón Bold...");

        // Limpiar container
        container.innerHTML = "";

        // Crear el div del botón con ID único
        const buttonDiv = document.createElement("div");
        buttonDiv.id = "bold-checkout-button";
        buttonDiv.setAttribute("data-bold-button", "dark-L");
        buttonDiv.setAttribute("data-render-mode", "embedded");
        buttonDiv.setAttribute("data-api-key", dataBold.apiKey);
        buttonDiv.setAttribute("data-order-id", dataBold.orderId);
        buttonDiv.setAttribute("data-currency", "COP");
        buttonDiv.setAttribute("data-amount", dataBold.amount.toString());
        buttonDiv.setAttribute("data-integrity-signature", dataBold.integrityHash);
        buttonDiv.setAttribute("data-redirection-url", "https://main.dtwgf63ykehy5.amplifyapp.com/purchase-records");

        container.appendChild(buttonDiv);

        console.log("✅ Div del botón agregado");

        // Remover script anterior si existe
        const oldScript = document.querySelector('script[src*="boldPaymentButton.js"]');
        if (oldScript) {
            console.log("🗑️ Removiendo script anterior");
            oldScript.remove();
        }

        // Cargar el script
        const script = document.createElement("script");
        script.src = "https://checkout.bold.co/library/boldPaymentButton.js";
        script.async = true;

        script.onload = () => {
            console.log("✅ Script Bold cargado");

            // Esperar e inicializar BoldCheckout
            setTimeout(() => {
                if (window.BoldCheckout) {
                    console.log("🚀 Inicializando BoldCheckout...");
                    try {
                        // Configuración para el constructor
                        const config = {
                            apiKey: dataBold.apiKey,
                            orderId: dataBold.orderId,
                            currency: "COP",
                            amount: dataBold.amount,
                            integritySignature: dataBold.integrityHash,
                            redirectionUrl: "https://main.dtwgf63ykehy5.amplifyapp.com/purchase-records",
                            containerId: "bold-checkout-button" // Especificar el ID del contenedor
                        };

                        console.log("📝 Configuración:", config);

                        // Crear instancia CON configuración
                        const boldInstance = new window.BoldCheckout(config);
                        console.log("✅ BoldCheckout instanciado con config");

                        // Verificar configuración
                        const currentConfig = boldInstance.getConfig();
                        console.log("🔍 Config actual:", currentConfig);

                        // Iniciar el checkout embebido
                        boldInstance.startEmbeddedCheckout();
                        console.log("✅ startEmbeddedCheckout() ejecutado");

                        // Verificar el resultado después de un momento
                        setTimeout(() => {
                            const iframe = boldInstance.getCheckoutIframe();
                            console.log("🔍 Iframe del checkout:", iframe);

                            const boldButton = container.querySelector('#bold-checkout-button');
                            console.log("🔍 innerHTML del botón:", boldButton?.innerHTML);

                            const iframes = document.querySelectorAll('iframe');
                            console.log("🔍 Total de iframes en la página:", iframes.length);
                            iframes.forEach((iframe, idx) => {
                                console.log(`Iframe ${idx}:`, {
                                    src: iframe.src,
                                    width: iframe.width,
                                    height: iframe.height,
                                    parent: iframe.parentElement?.id
                                });
                            });
                        }, 1500);

                    } catch (error) {
                        console.error("❌ Error al inicializar BoldCheckout:", error);
                        console.error("Error completo:", error.message);
                        console.error("Stack:", error.stack);
                    }
                } else {
                    console.error("❌ BoldCheckout no está disponible");
                }
            }, 500);
        };

        script.onerror = (error) => {
            console.error("❌ Error al cargar script Bold:", error);
        };

        document.body.appendChild(script);
        console.log("📦 Script agregado al body");
    };

    const init = async () => {
        if (isProcessing) {
            console.log("⚠️ Ya se está procesando una solicitud");
            return;
        }

        setIsProcessing(true);

        try {
            const data = {
                amount: total,
                currency: "COP",
                idClient: userId,
                idAddress: selectedAddress.id,
                products: cart.map(item => ({
                    code: item.code,
                    photo: item.photo,
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price
                }))
            };

            console.log("📤 Enviando solicitud:", data);
            const resp = await API.post("/api/transactions", data);
            console.log("✅ Respuesta recibida:", resp.data);

            setDataBold(resp.data);
        } catch (error) {
            console.error("❌ Error creating transaction:", error);
            alert("Error al crear la transacción. Por favor intenta de nuevo.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <>
            <div className="cart-page">
                <h1 className="cart-title">Carrito de compras</h1>

                <div className="cart-layout">
                    <div className="cart-left">
                        <div className="cart-section">
                            <div
                                onClick={() => toggleSection("address")}
                                className="cart-section-header">
                                <h3>Dirección de envío</h3>
                                <span>{expandedSections.address ? "−" : "+"}</span>
                            </div>

                            {expandedSections.address && (
                                <div className="cart-section-body">
                                    {addresses.length === 0 ? (
                                        <div className="empty-address">
                                            <p>No tienes direcciones guardadas</p>
                                            <button
                                                onClick={() => setShowAddressModal(true)}
                                                className="btn-primary"
                                            >
                                                Agregar dirección
                                            </button>
                                        </div>
                                    ) : (
                                        <div>
                                            {addresses.map((address) => (
                                                <div
                                                    key={address.id}
                                                    className={`address-card ${selectedAddress?.id === address.id ? "selected" : ""}`}
                                                    onClick={() => setSelectedAddress(address)}
                                                >
                                                    <h4>{address.fullName}</h4>
                                                    <p>{address.addressLine1}</p>
                                                    {address.addressLine2 && <p>{address.addressLine2}</p>}
                                                    <p>{address.city}, {address.region}, {address.country}</p>
                                                    <p>Teléfono: {address.phone}</p>
                                                </div>
                                            ))}
                                            <button
                                                onClick={() => setShowAddressModal(true)}
                                                className="btn-outline"
                                            >
                                                Agregar otra dirección
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="cart-section">
                            <div
                                onClick={() => toggleSection("buyerInfo")}
                                className="cart-section-header"
                            >
                                <h3>Información del comprador</h3>
                                <span>{expandedSections.buyerInfo ? "−" : "+"}</span>
                            </div>

                            {expandedSections.buyerInfo && userData && (
                                <div className="cart-section-body">
                                    <div>
                                        <strong>Nombre completo:</strong>
                                        <p>{userData.fullName}</p>
                                    </div>
                                    <div>
                                        <strong>Correo electrónico:</strong>
                                        <p>{userData.email}</p>
                                    </div>
                                    <div>
                                        <strong>Número de teléfono:</strong>
                                        <p>{userData.phoneNumber}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="cart-section">
                            <div
                                onClick={() => toggleSection("paymentGuide")}
                                className="cart-section-header"
                            >
                                <h3>Guía para pagar</h3>
                                <span>{expandedSections.paymentGuide ? "−" : "+"}</span>
                            </div>

                            {expandedSections.paymentGuide && (
                                <div className="cart-section-body">
                                    <h4 className="highlight-title">Instrucciones de pago:</h4>
                                    <ol>
                                        <li>Verifica que todos tus datos estén correctos</li>
                                        <li>Selecciona tu dirección de envío</li>
                                        <li>Haz clic en "Ir a la pasarela de pagos"</li>
                                        <li>Serás redirigido a Bold, una pasarela 100% confiable</li>
                                        <li>Elige tu método de pago preferido</li>
                                        <li>Confirma tu compra y recibe la confirmación por email</li>
                                    </ol>

                                    <div className="payment-methods">
                                        <h4>Métodos de pago disponibles:</h4>
                                        <ul>
                                            <li>Tarjeta de crédito/débito (Visa, Mastercard, Maestro, American Express, Diners, etc..)</li>
                                            <li>Efectivo (PSE, Baloto, Efecty)</li>
                                            <li>Transferencia bancaria</li>
                                            <li>Billeteras digitales</li>
                                            <li>Nequi</li>
                                            <li>Botón Bancolombia</li>
                                        </ul>
                                    </div>

                                    <div className="payment-warning">
                                        <h4>⚠️ Importante:</h4>
                                        <p>
                                            Una vez confirmado el pago, recibirás un email con los detalles de tu compra.
                                            El envío se procesará en un plazo de 1-3 días hábiles.
                                        </p>
                                    </div>

                                    <div className="payment-link">
                                        <a
                                            href="https://bold.co/cf/legal"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            Ver derechos y seguridad de Bold
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="cart-right">
                        <div className="cart-summary">
                            {cart.length === 0 ? (
                                <div className="empty-cart">
                                    <p>Tu carrito está vacío</p>
                                </div>
                            ) : (
                                <>
                                    <div className="cart-items">
                                        {cart.map(item => (
                                            <div key={item.code} className="cart-item">
                                                <img src={item.photo} alt={item.name} />
                                                <div className="item-info">
                                                    <h4>{item.name}</h4>
                                                    <p>{item.description}</p>
                                                    <div className="item-price">
                                                        <span>${item.price} × {item.quantity}</span>
                                                        <strong>${item.price * item.quantity}</strong>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="cart-total">
                                        <h2>Total: ${total}</h2>

                                        {!dataBold ? (
                                            <button
                                                onClick={init}
                                                disabled={!selectedAddress || cart.length === 0 || isProcessing}
                                                className={`btn-pay ${!selectedAddress || cart.length === 0 || isProcessing
                                                    ? "disabled"
                                                    : ""
                                                    }`}
                                            >
                                                {isProcessing ? "Procesando..." : "Ir a la pasarela de pagos"}
                                            </button>
                                        ) : (
                                            <p className="success-text">
                                                ⏳ Cargando pasarela de pago...
                                            </p>
                                        )}

                                        <div id="bold-button-container"></div>

                                        {!selectedAddress && cart.length > 0 && (
                                            <p className="warning-text">
                                                ⚠️ Selecciona una dirección de envío para continuar
                                            </p>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {showAddressModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h2>Agregar Dirección de Envío</h2>
                        <button
                            onClick={() => setShowAddressModal(false)}
                            className="modal-close"
                        >
                            ×
                        </button>
                        <div className="modal-body">
                            <p>Para agregar una nueva dirección, ve a la página de "Direcciones de envío"</p>
                            <button
                                onClick={() => {
                                    setShowAddressModal(false);
                                    navigate("/shipping-addresses");
                                }}
                                className="btn-primary"
                            >
                                Ir a Direcciones de Envío
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
