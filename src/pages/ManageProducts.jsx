import React, { useEffect, useState } from 'react';
import API from '../config/AxiosConfig';
import GlobalModal from '../components/GlobalModal';
import './css/ManageProducts.css'
import Swal from 'sweetalert2';

export default function ManageProducts() {
  const [products, setProducts] = useState([]);
  const [types, setTypes] = useState([]);
  const [modalProduct, setModalProduct] = useState(false);
  const [modalType, setModalType] = useState(false);
  const [formProduct, setFormProduct] = useState({ name: '', photo: '', description: '', quantity: '', price: '', productType: { id: null, nameType: '' } });
  const [formType, setFormType] = useState({ id: '', nameType: '' });
  const [editType, setEditType] = useState(null);
  const [search, setSearch] = useState('');
  const [editProductCode, setEditProductCode] = useState(null);

  useEffect(() => {
    fetchProducts();
    fetchTypes();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data } = await API.get('/api/products');
      console.log(data);
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al cargar productos:', error);
      setProducts([]);
    }
  };
  
  const fetchTypes = async () => {
    try {
      const { data } = await API.get('/api/product-types');
      console.log(data);
      // Asegurar que types sea siempre un array
      setTypes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al cargar tipos de productos:', error);
      setTypes([]);
    }
  };

  const handleProductSubmit = async e => {
    e.preventDefault();
    console.log('Datos que se envían:', formProduct)
    console.log(editProductCode);
    try {
      if (editProductCode) {
        await API.put(`/api/products/${editProductCode}`, formProduct);
        setEditProductCode(null);
        Swal.fire({
          position: "center",
          icon: "success",
          title: "Producto actualizado correctamente",
          showConfirmButton: false,
          timer: 3000,
        });
      } else {
        await API.post('/api/products', formProduct);
        Swal.fire({
          position: "center",
          icon: "success",
          title: "Producto guardado correctamente",
          showConfirmButton: false,
          timer: 3000,
        });
      }
      setFormProduct({ name: '', photo: '', description: '', quantity: '', price: '', productType: { id: '', nameType: '' } });
      setModalProduct(false);
      fetchProducts();
    } catch (error) {
      console.error('Error al guardar producto:', error);
      const errorMessage = error.response?.data?.message || 'No se pudo guardar el producto. Verifica los datos e intenta de nuevo.';
      Swal.fire({
        title: "Error",
        text: errorMessage,
        icon: "error"
      });
    }
  };
  
  const handleProductDelete = code => {
    Swal.fire({
      title: '¿Eliminar producto?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar'
    }).then(async result => {
      if (result.isConfirmed) {
        try {
          await API.delete(`/api/products/${code}`);
          Swal.fire({
            title: "Producto eliminado",
            icon: "success",
            showConfirmButton: false,
            timer: 2000
          });
          fetchProducts();
        } catch (error) {
          console.error('Error al eliminar producto:', error);
          const errorMessage = error.response?.data?.message || 'No se pudo eliminar el producto. Intenta de nuevo.';
          Swal.fire({
            title: "Error",
            text: errorMessage,
            icon: "error"
          });
        }
      }
    });
  };

  const handleTypeSubmit = async e => {
    e.preventDefault();
    try {
      if (editType) {
        await API.put(`/api/product-types/${editType.id}`, formType);
        setEditType(null);
        Swal.fire({
          position: "center",
          icon: "success",
          title: "Tipo de producto actualizado correctamente",
          showConfirmButton: false,
          timer: 3000,
        });
      } else {
        await API.post('/api/product-types', formType);
        Swal.fire({
          position: "center",
          icon: "success",
          title: "Tipo de producto guardado correctamente",
          showConfirmButton: false,
          timer: 3000,
        });
      }
      setFormType({ id: '', nameType: '' });
      fetchTypes();
    } catch (error) {
      console.error('Error al guardar tipo de producto:', error);
      const errorMessage = error.response?.data?.message || 'No se pudo guardar el tipo de producto. Intenta de nuevo.';
      Swal.fire({
        title: "Error",
        text: errorMessage,
        icon: "error"
      });
    }
  };

  const handleTypeDelete = id => {
    Swal.fire({
      title: '¿Eliminar tipo de producto?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar'
    }).then(async result => {
      if (result.isConfirmed) {
        try {
          await API.delete(`/api/product-types/${id}`);
          Swal.fire({
            title: "Tipo de producto eliminado",
            icon: "success",
            showConfirmButton: false,
            timer: 2000
          });
          fetchTypes();
        } catch (error) {
          console.error(error);
          const errorMessage = error.response?.data?.message || 'No se pudo eliminar el tipo de producto. Verifica si hay productos asociados.';
          Swal.fire({
            title: "Error",
            text: errorMessage,
            icon: "error"
          });
        }
      }
    });
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    types.find(t => t.id === p.productType.id && t.nameType.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="products-container">
      <h1>Productos</h1>
      <div className="products-header">
        <button onClick={() => setModalProduct(true)}>
          Agregar producto
        </button>
        <button onClick={() => setModalType(true)}>
          Tipo de productos
        </button>
      </div>
      <input
        placeholder="Buscar producto o tipo..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="search-input"
      />
      <div className="products-grid">
        {filteredProducts.map(prod => (
          <div key={prod.code} className="product-card">
            <img src={prod.photo} alt={prod.name} />
            <div className="name">{prod.name}</div>
            <div className="description">{prod.description}</div>
            <div className="quantity">Cantidad: {prod.quantity}</div>
            <div className="price">Precio: ${prod.price}</div>
            <div className="type">
              Tipo: {types.find(t => t.id === prod.productType.id)?.nameType || 'Sin tipo'}
            </div>
            <div className="product-actions">
              <button
                className="product-action-btn"
                onClick={() => {
                  setFormProduct({
                    ...prod,
                  });
                  setModalProduct(true);
                  setEditProductCode(prod.code);
                }}
              >
                ✏️
              </button>
              <button
                className="product-action-btn"
                onClick={() => handleProductDelete(prod.code)}
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>
      {/* Modal producto */}
      <GlobalModal open={modalProduct} onClose={() => {
        setModalProduct(false); setEditProductCode(null); setFormProduct({ name: '', photo: '', description: '', quantity: '', price: '', productType: { id: '', nameType: '' } });
      }} title={editProductCode ? 'Actualizar producto' : 'Agregar producto'}>
        <form onSubmit={handleProductSubmit} className="product-form">
          <input name="name" placeholder="Nombre del producto" value={formProduct.name} onChange={e => setFormProduct(f => ({ ...f, name: e.target.value }))} required />
          <input name="photo" placeholder="URL de la foto" value={formProduct.photo} onChange={e => setFormProduct(f => ({ ...f, photo: e.target.value }))} required />
          <textarea name="description" placeholder="Descripción" value={formProduct.description} onChange={e => setFormProduct(f => ({ ...f, description: e.target.value }))} required />
          <input name="quantity" type="number" placeholder="Cantidad" value={formProduct.quantity} onChange={e => setFormProduct(f => ({ ...f, quantity: e.target.value }))} required />
          <input name="price" type="number" placeholder="Precio" value={formProduct.price} onChange={e => setFormProduct(f => ({ ...f, price: e.target.value }))} required />
          <select name="productType" value={formProduct.productType.id} onChange={e => setFormProduct(f => ({ ...f, productType: { id: e.target.value, nameType: '' } }))} required>
            <option value="">Selecciona tipo de producto</option>
            {types.map(t => <option key={t.id} value={t.id}>{t.nameType}</option>)}
          </select>
          <button type="submit">
            {editProductCode ? 'Actualizar' : 'Agregar'}
          </button>
        </form>
      </GlobalModal>
      {/* Modal tipo de producto */}
      <GlobalModal
        open={modalType}
        onClose={() => {
          setModalType(false);
          setEditType(null);
          setFormType({ id: '', nameType: '' });
        }}
        title="Tipo de productos"
        width={400}
      >
        <form onSubmit={handleTypeSubmit} className="type-form">
          <input
            name="nameType"
            placeholder="Nombre tipo de producto"
            value={formType.nameType}
            onChange={e => setFormType({ ...formType, nameType: e.target.value })}
            required
          />
          <button type="submit" className="type-form-btn">
            {editType ? 'Actualizar' : 'Agregar'}
          </button>
        </form>
        <div className="types-list">
          {types.map(t => (
            <div key={t.id} className="type-item">
              {editType && editType.id === t.id ? (
                <input
                  value={formType.nameType}
                  onChange={e => setFormType({ ...formType, nameType: e.target.value })}
                  className="type-edit-input"
                  readOnly
                />
              ) : (
                <span>{t.nameType}</span>
              )}
              <div className="type-item-actions">
                <button
                  type="button"
                  onClick={() => {
                    setEditType(t);
                    setFormType({ id: t.id, nameType: t.nameType });
                  }}
                  className="type-action-btn"
                >✏️</button>
                <button
                  type="button"
                  onClick={() => handleTypeDelete(t.id)}
                  className="type-action-btn"
                >🗑️</button>
              </div>
            </div>
          ))}
          {types.length === 0 ? <h4>No hay tipos de productos</h4> : null}
        </div>
      </GlobalModal>
    </div >
  );
}
