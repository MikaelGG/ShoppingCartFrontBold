import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import { jwtDecode } from "jwt-decode";
import { useAuth } from '../context/AuthContext';
import { useCart } from "../context/CartContext";
import API from "../config/AxiosConfig";
import { FaCheckCircle, FaClock, FaHourglassHalf, FaTimesCircle, FaBan, FaInfoCircle } from "react-icons/fa";

export default function PurchaseRecords() {
    const [records, setRecords] = useState([]);
    const [expandedRow, setExpandedRow] = useState(null);
    const [userType, setUserType] = useState(null);
    const [userId, setUserId] = useState(null);
    const [items, setItems] = useState({});
    const [addresses, setAddresses] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    const [adminFilter, setAdminFilter] = useState("ALL");
    const [allRecords, setAllRecords] = useState([]); // Guarda todos los registros para admin
    const recordsPerPage = 10;
    const { token } = useAuth();
    const { clearCart } = useCart();
    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get("bold-tx-status") === "approved") {
            clearCart();
        }
    }, [location, clearCart]);

    useEffect(() => {
        if (!token) return;
        const tkdec = jwtDecode(token);
        setUserType(tkdec.userType);
        setUserId(tkdec.id);
        if (tkdec.userType === "Administrator") {
            fetchRecords("Administrator");
        } else if (tkdec.userType === "Client") {
            fetchRecords("Client", tkdec.id);
        }
    }, [token]);

    const fetchRecords = async (type, id) => {
        try {
            let response;
            if (type === "Administrator") {
                response = await API.get("/api/transactions");
                setAllRecords(response.data); // Guarda todos los registros
                console.log(response.data);
                setRecords(response.data);    // Inicialmente muestra todos
            } else if (type === "Client") {
                response = await API.get(`/api/transactions/${id}`);
                console.log(response.data);
                setRecords(response.data);
            }
            // Fetch addresses for each purchase
            const addressPromises = response.data.map(async (purchase) => {
                if (purchase.idAddress) {
                    const addrRes = await API.get(`/api/shipping-addresses/${purchase.idAddress}`);
                    return { [purchase.idAddress]: addrRes.data };
                }
                return {};
            });
            const addressResults = await Promise.all(addressPromises);
            const addressMap = Object.assign({}, ...addressResults);
            setAddresses(addressMap);
        } catch (error) {
            console.error("Error cargando registros:", error);
        }
    };

    const fetchItems = async (idInternal) => {
        try {
            const response = await API.get(`/api/transactions/products/${idInternal}`);
            console.log("Response: ", response.data);
            setItems(prev =>
                ({ ...prev, [idInternal]: response.data })
            );
        } catch (error) {
            console.error("Error cargando items:", error);
        }
    };

    const toggleExpand = (record) => {
        if (expandedRow === record.idBoldOrder) {
            setExpandedRow(null);
        } else {
            setExpandedRow(record.idBoldOrder);
            if (!items[record.idInternal]) {
                fetchItems(record.idInternal);
            }
        }
    };

    const updateShippingStatus = async (idInternal, newStatus) => {
        try {
            await API.put(`/api/transactions/${idInternal}`, newStatus);
            setRecords(prev =>
                prev.map(r =>
                    r.idInternal === idInternal ? { ...r, shippingStatus: newStatus } : r
                )
            );
            Swal.fire({
                position: "center",
                icon: "success",
                title: "Estado de envío actualizado exitosamente",
                showConfirmButton: false,
                timer: 2500,
            });
        } catch (error) {
            console.error("Error updating shipping status:", error);
        }
    };

    useEffect(() => {
        if (userType !== "Administrator") return;
        let filtered = allRecords;
        if (adminFilter === "APPROVED") {
            filtered = allRecords.filter(r => r.status?.toLowerCase() === "approved");
        } else if (adminFilter === "PENDING") {
            filtered = allRecords.filter(r => r.status?.toLowerCase() === "pending");
        } else if (adminFilter === "IN_PROCESS") {
            filtered = allRecords.filter(r => r.status?.toLowerCase() === "in_process");
        } else if (adminFilter === "REJECTED") {
            filtered = allRecords.filter(r => r.status?.toLowerCase() === "rejected");
        }
        setRecords(filtered);
        setCurrentPage(1); // Reinicia a la primera página al cambiar filtro
    }, [adminFilter, allRecords, userType]);

    const totalPages = Math.ceil(records.length / recordsPerPage);

    const paginatedRecords = records.slice(
        (currentPage - 1) * recordsPerPage,
        currentPage * recordsPerPage
    );
    const handlePageChange = (page) => {
        setCurrentPage(page);
    };


    function getStatusIconAndTooltip(status) {
        switch (status?.toLowerCase()) {
            case "approved":
                return {
                    icon: <FaCheckCircle style={{ color: "#28a745", fontSize: "22px" }} />,
                    label: "Aprobado",
                    detail: "Pago acreditado exitosamente"
                };
            case "in_process":
                return {
                    icon: <FaClock style={{ color: "#ffc107", fontSize: "22px" }} />,
                    label: "En proceso",
                    detail: "Pago en proceso"
                };
            case "pending":
                return {
                    icon: <FaHourglassHalf style={{ color: "#17a2b8", fontSize: "22px" }} />,
                    label: "Pendiente",
                    detail: "Pendiente de pago"
                };
            case "rejected":
                return {
                    icon: <FaTimesCircle style={{ color: "#dc3545", fontSize: "22px" }} />,
                    label: "Rechazado",
                    detail: "Pago rechazado"
                };
            case "cancelled":
                return {
                    icon: <FaBan style={{ color: "#6c757d", fontSize: "22px" }} />,
                    label: "Cancelado",
                    detail: "Pago cancelado"
                };
            default:
                return {
                    icon: <FaInfoCircle style={{ color: "#007bff", fontSize: "22px" }} />,
                    label: "Desconocido",
                    detail: "Estado no reconocido"
                };
        }
    }



    // Agregar useEffect para monitorear cambios en items
    useEffect(() => {
        console.log("Items actualizados:", items);
    }, [items]);



    return (
        <div style={{ maxWidth: "1100px", margin: "auto", padding: "20px" }}>
            <h1 style={{ textAlign: "center" }}>Registro de compras</h1>

            {/* Botones de filtro para administrador */}
            {userType === "Administrator" && (
                <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginBottom: "18px" }}>
                    <button
                        onClick={() => setAdminFilter("ALL")}
                        style={{
                            padding: "8px 18px",
                            borderRadius: "5px",
                            border: adminFilter === "ALL" ? "2px solid #007bff" : "1px solid #ccc",
                            background: adminFilter === "ALL" ? "#007bff" : "#fff",
                            color: adminFilter === "ALL" ? "#fff" : "#007bff",
                            fontWeight: adminFilter === "ALL" ? "bold" : "normal",
                            cursor: "pointer"
                        }}
                    >
                        Todas
                    </button>
                    <button
                        onClick={() => setAdminFilter("APPROVED")}
                        style={{
                            padding: "8px 18px",
                            borderRadius: "5px",
                            border: adminFilter === "APPROVED" ? "2px solid #28a745" : "1px solid #ccc",
                            background: adminFilter === "APPROVED" ? "#28a745" : "#fff",
                            color: adminFilter === "APPROVED" ? "#fff" : "#28a745",
                            fontWeight: adminFilter === "APPROVED" ? "bold" : "normal",
                            cursor: "pointer"
                        }}
                    >
                        Aprobadas
                    </button>
                    <button
                        onClick={() => setAdminFilter("PENDING")}
                        style={{
                            padding: "8px 18px",
                            borderRadius: "5px",
                            border: adminFilter === "PENDING" ? "2px solid #FF5C00" : "1px solid #ccc",
                            background: adminFilter === "PENDING" ? "#FF5C00" : "#fff",
                            color: adminFilter === "PENDING" ? "#fff" : "#FF5C00",
                            fontWeight: adminFilter === "PENDING" ? "bold" : "normal",
                            cursor: "pointer"
                        }}
                    >
                        Pendientes de pago
                    </button>
                    <button
                        onClick={() => setAdminFilter("IN_PROCESS")}
                        style={{
                            padding: "8px 18px",
                            borderRadius: "5px",
                            border: adminFilter === "IN_PROCESS" ? "2px solid #ffc107" : "1px solid #ccc",
                            background: adminFilter === "IN_PROCESS" ? "#ffc107" : "#fff",
                            color: adminFilter === "IN_PROCESS" ? "#fff" : "#ffc107",
                            fontWeight: adminFilter === "IN_PROCESS" ? "bold" : "normal",
                            cursor: "pointer"
                        }}
                    >
                        En proceso de pago
                    </button>
                    <button
                        onClick={() => setAdminFilter("REJECTED")}
                        style={{
                            padding: "8px 18px",
                            borderRadius: "5px",
                            border: adminFilter === "REJECTED" ? "2px solid #dc3545" : "1px solid #ccc",
                            background: adminFilter === "REJECTED" ? "#dc3545" : "#fff",
                            color: adminFilter === "REJECTED" ? "#fff" : "#dc3545",
                            fontWeight: adminFilter === "REJECTED" ? "bold" : "normal",
                            cursor: "pointer"
                        }}
                    >
                        Rechazadas
                    </button>
                </div>
            )}

            {records.length === 0 ? (
                <p style={{ textAlign: "center" }}>No hay compras registradas aún</p>
            ) : (
                <table
                    style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        marginTop: "20px",
                        textAlign: "center",
                        background: "#fff",
                        borderRadius: "10px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.07)"
                    }}
                >
                    <thead style={{ background: "#f4f4f4" }}>
                        <tr>
                            <th style={{ ...th, width: "60px" }}></th> {/* Estado de compra */}
                            <th style={th}>Fecha</th>
                            <th style={th}>Monto</th>
                            <th style={th}>Dirección</th>
                            <th style={th}>Acciones</th>
                            <th style={th}>Envío</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedRecords.map((record) => {
                            const address = addresses[record.idAddress];
                            const statusInfo = getStatusIconAndTooltip(record.status);
                            return (
                                <React.Fragment key={record.idInternal}>
                                    <tr style={{ borderBottom: "1px solid #ddd" }}>
                                        {/* Estado de compra con icono y tooltip */}
                                        <td style={td}>
                                            <div style={{ position: "relative", display: "inline-block" }}>
                                                <span
                                                    style={{ cursor: "pointer" }}
                                                    onMouseEnter={e => {
                                                        const tooltip = e.currentTarget.nextSibling;
                                                        tooltip.style.display = "block";
                                                    }}
                                                    onMouseLeave={e => {
                                                        const tooltip = e.currentTarget.nextSibling;
                                                        tooltip.style.display = "none";
                                                    }}
                                                >
                                                    {statusInfo.icon}
                                                </span>
                                                <div
                                                    style={{
                                                        display: "none",
                                                        position: "absolute",
                                                        left: "50%",
                                                        top: "-70px", // Ajusta según el alto del tooltip
                                                        transform: "translateX(-50%)",
                                                        background: "#fff",
                                                        border: "1px solid #ccc",
                                                        borderRadius: "8px",
                                                        boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                                                        padding: "10px 16px",
                                                        maxWidth: "260px",
                                                        minWidth: "180px",
                                                        zIndex: 9999,
                                                        textAlign: "left",
                                                        fontSize: "13px",
                                                        wordBreak: "break-word"
                                                    }}
                                                >
                                                    <strong>{statusInfo.label}</strong>
                                                    <br />
                                                    <span style={{ color: "#666" }}>{statusInfo.detail}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={td}>
                                            {record.createAt
                                                ? new Date(record.createAt).toLocaleString()
                                                : "N/A"}
                                        </td>
                                        <td style={td}>${record.amount}</td>
                                        <td style={td}>
                                            {address ? (
                                                <div style={{ textAlign: "center", fontSize: "13px" }}>
                                                    <strong>{address.fullName}</strong><br />
                                                    {address.addressLine1}<br />
                                                    {address.addressLine2 && <>{address.addressLine2}<br /></>}
                                                    {address.city}, {address.region}, {address.country}<br />
                                                    Tel: {address.phone}
                                                </div>
                                            ) : (
                                                <span style={{ color: "#888" }}>Sin dirección</span>
                                            )}
                                        </td>
                                        <td style={td}>
                                            <button
                                                onClick={() => toggleExpand(record)}
                                                style={{
                                                    padding: "5px 10px",
                                                    border: "none",
                                                    background: "#007bff",
                                                    color: "white",
                                                    borderRadius: "5px",
                                                    cursor: "pointer"
                                                }}
                                            >
                                                {expandedRow === record.idBoldOrder ? "Ocultar compra" : "Ver compra"}
                                            </button>
                                        </td>
                                        <td style={td}>
                                            {userType === "Administrator" ? (
                                                <select
                                                    value={record.shippingStatus}
                                                    onChange={(e) => updateShippingStatus(record.idInternal, e.target.value)}
                                                    style={{
                                                        padding: "5px 8px",
                                                        borderRadius: "4px",
                                                        border: "1px solid #ccc",
                                                        background: "#fff",
                                                        color: "#000000ff",
                                                        cursor: "pointer"
                                                    }}
                                                >
                                                    <option value="PROCESO_ENVIO">Procesando envío</option>
                                                    <option value="ENVIADO">Enviado</option>
                                                    <option value="ENTREGADO">Entregado</option>
                                                    <option value="PAGO_PENDIENTE">Pago pendiente</option>
                                                    <option value="PROCESANDO_PAGO">Pago en proceso</option>
                                                    <option value="PAGO_RECHAZADO">Pago rechazado</option>
                                                    <option value="PAGO_CANCELADO">Pago cancelado</option>
                                                </select>
                                            ) : (
                                                <>
                                                    {
                                                        record.shippingStatus.includes("PROCESO_ENVIO") ? (
                                                            <span style={{ color: "orange" }}>Procesando envío</span>
                                                        ) : record.shippingStatus === "ENVIADO" ? (
                                                            <span style={{ color: "blue" }}>Enviado</span>
                                                        ) : record.shippingStatus === "ENTREGADO" ? (
                                                            <span style={{ color: "green" }}>Entregado</span>
                                                        ) : record.shippingStatus === "PAGO_PENDIENTE" ? (
                                                            <span style={{ color: "yellow" }}>Pago pendiente</span>
                                                        ) : record.shippingStatus === "PROCESANDO_PAGO" ? (
                                                            <span style={{ color: "brown" }}>Pago en proceso</span>
                                                        ) : record.shippingStatus === "PAGO_RECHAZADO" ? (
                                                            <span style={{ color: "red" }}>Pago rechazado</span>
                                                        ) : record.shippingStatus === "PAGO_CANCELADO" ? (
                                                            <span style={{ color: "red" }}>Pago cancelado</span>
                                                        ) : (
                                                            <span>{record.shippingStatus}</span>
                                                        )
                                                    }
                                                </>
                                            )}
                                        </td>
                                    </tr>

                                    {expandedRow === record.idBoldOrder && items[record.idInternal] && (
                                        <tr>
                                            <td colSpan="5">
                                                <div style={{
                                                    display: "flex",
                                                    gap: "40px",
                                                    justifyContent: "space-between",
                                                    alignItems: "flex-start",
                                                    padding: "20px 0"
                                                }}>
                                                    {/* Tabla de productos */}
                                                    <table
                                                        style={{
                                                            width: "60%",
                                                            margin: "0",
                                                            borderCollapse: "collapse",
                                                            background: "#fafafa",
                                                            fontSize: "14px",
                                                            borderRadius: "8px"
                                                        }}
                                                    >
                                                        <thead style={{ background: "#eee" }}>
                                                            <tr>
                                                                <th>Imagen</th>
                                                                <th>Producto</th>
                                                                <th>Cantidad</th>
                                                                <th>Precio</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {items[record.idInternal].map((p, i) => (
                                                                <tr key={i}>
                                                                    <td>
                                                                        <img
                                                                            src={p.photo}
                                                                            alt={p.name}
                                                                            style={{
                                                                                width: "60px",
                                                                                height: "60px",
                                                                                objectFit: "cover",
                                                                                borderRadius: "5px"
                                                                            }}
                                                                        />
                                                                    </td>
                                                                    <td>{p.name}</td>
                                                                    <td>{p.quantity}</td>
                                                                    <td>${p.price}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                    {/* Detalle de dirección */}
                                                    <div style={{
                                                        width: "35%",
                                                        background: "#f9f9f9",
                                                        borderRadius: "8px",
                                                        padding: "15px",
                                                        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                                                        fontSize: "14px"
                                                    }}>
                                                        <h4 style={{ marginBottom: "10px" }}>Dirección de envío</h4>
                                                        {address ? (
                                                            <>
                                                                <strong>{address.fullName}</strong><br />
                                                                {address.addressLine1}<br />
                                                                {address.addressLine2 && <>{address.addressLine2}<br /></>}
                                                                {address.city}, {address.region}, {address.country}<br />
                                                                Tel: {address.phone}
                                                            </>
                                                        ) : (
                                                            <span style={{ color: "#888" }}>Sin dirección</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            )}
            {totalPages > 1 ? (
                <div style={{ marginTop: "20px", textAlign: "left" }}>
                    {Array.from({ length: totalPages }, (_, i) => (
                        <button
                            key={i + 1}
                            onClick={() => handlePageChange(i + 1)}
                            style={{
                                margin: "0 4px",
                                padding: "6px 12px",
                                borderRadius: "4px",
                                border: currentPage === i + 1 ? "2px solid #007bff" : "1px solid #ccc",
                                background: currentPage === i + 1 ? "#007bff" : "#fff",
                                color: currentPage === i + 1 ? "#fff" : "#007bff",
                                cursor: "pointer",
                                fontWeight: currentPage === i + 1 ? "bold" : "normal"
                            }}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>
            ) : null}
        </div>
    );
}

const th = {
    padding: "10px",
    borderBottom: "2px solid #ddd"
};

const td = {
    padding: "10px",
    borderBottom: "1px solid #ddd"
};
