import React, { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  // Estados para cada fuente de datos
  const [posData, setPosData] = useState({ productos: [], ventas: [] });
  const [azureData, setAzureData] = useState({ aprendices: [], empleados: [] });
  const [supabaseData, setSupabaseData] = useState({ pqrs: [], alertas: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // URL base de tu backend en Node.js
  const API_URL = 'http://localhost:3000/api';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Consumimos los tres endpoints en paralelo
        const [resLocal, resAzure, resSupabase] = await Promise.all([
          axios.get(`${API_URL}/pos-local`),
          axios.get(`${API_URL}/clientes-azure`),
          axios.get(`${API_URL}/alertas-supabase`)
        ]);

        setPosData(resLocal.data);
        setAzureData(resAzure.data);
        setSupabaseData(resSupabase.data);
        setLoading(false);
      } catch (err) {
        console.error('Error al conectar con el backend:', err);
        setError('No se pudo conectar con el servidor Node.js. Asegúrate de que esté corriendo en el puerto 3000.');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="container text-center mt-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando datos de la Cafetería...</span>
        </div>
        <p className="mt-2">Conectando con las fuentes Multi-Cloud (XAMPP, Azure y Supabase)...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      {/* Encabezado */}
      <header className="pb-3 mb-4 border-bottom text-center">
        <h1 className="h2 fw-bold text-success">☕ Dashboard de Control - Cafetería SENA</h1>
        <p className="text-muted">Arquitectura Multi-Cloud: XAMPP (Local VM) | Azure MySQL | Supabase PostgreSQL</p>
      </header>

      {/* SECCIÓN 1: XAMPP (Punto de Venta Local) */}
      <section className="mb-5">
        <h3 className="h4 text-primary mb-3">🖥️ 1. XAMPP (POS Local - VM Azure)</h3>
        <div className="row">
          <div className="col-md-6 mb-3">
            <div className="card shadow-sm h-100">
              <div className="card-header bg-light fw-bold">Productos Disponibles (Stock)</div>
              <div className="card-body">
                <ul className="list-group list-group-flush">
                  {posData.productos.map(p => (
                    <li key={p.id_producto} className="list-group-item d-flex justify-content-between align-items-center">
                      {p.nombre_producto} 
                      <span className="badge bg-primary rounded-pill">Stock: {p.stock_actual} | ${p.precio}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <div className="col-md-6 mb-3">
            <div className="card shadow-sm h-100">
              <div className="card-header bg-light fw-bold">Ventas Diarias Registradas</div>
              <div className="card-body">
                <ul className="list-group list-group-flush">
                  {posData.ventas.map(v => (
                    <li key={v.id_venta} className="list-group-item d-flex justify-content-between align-items-center">
                      Venta #{v.id_venta} (Cant: {v.cantidad_vendida})
                      <span className="text-muted">Hora: {v.hora_venta}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN 2: Azure MySQL (Gestión Corporativa) */}
      <section className="mb-5">
        <h3 className="h4 text-success mb-3">☁️ 2. Azure Database for MySQL (Corporativo)</h3>
        <div className="row">
          <div className="col-md-6 mb-3">
            <div className="card shadow-sm h-100">
              <div className="card-header bg-light fw-bold">Aprendices / Clientes SENA</div>
              <div className="card-body">
                <ul className="list-group list-group-flush">
                  {azureData.aprendices.map(a => (
                    <li key={a.id_aprendiz} className="list-group-item">
                      <strong>{a.nombres}</strong> <br />
                      <small className="text-muted">{a.programa_formacion}</small> <br />
                      <span className="badge bg-success">Saldo Tarjeta: ${a.saldo_tarjeta}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <div className="col-md-6 mb-3">
            <div className="card shadow-sm h-100">
              <div className="card-header bg-light fw-bold">Empleados de Turno</div>
              <div className="card-body">
                <ul className="list-group list-group-flush">
                  {azureData.empleados.map(e => (
                    <li key={e.id_empleado} className="list-group-item d-flex justify-content-between align-items-center">
                      {e.nombre} ({e.rol})
                      <span className="badge bg-secondary">{e.turno}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN 3: Supabase (Tiempo Real / Alertas y PQRs) */}
      <section className="mb-5">
        <h3 className="h4 text-warning mb-3">⚡ 3. Supabase PostgreSQL (Tiempo Real)</h3>
        <div className="row">
          <div className="col-md-6 mb-3">
            <div className="card shadow-sm h-100">
              <div className="card-header bg-light fw-bold">Buzón de PQRs y Sugerencias</div>
              <div className="card-body">
                <ul className="list-group list-group-flush">
                  {supabaseData.pqrs.map(p => (
                    <li key={p.id_pqr} className="list-group-item">
                      <span className="badge bg-info text-dark me-2">{p.tipo}</span>
                      {p.comentario}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <div className="col-md-6 mb-3">
            <div className="card shadow-sm h-100">
              <div className="card-header bg-light fw-bold">Alertas de Inventario</div>
              <div className="card-body">
                <ul className="list-group list-group-flush">
                  {supabaseData.alertas.map(al => (
                    <li key={al.id_alerta} className="list-group-item d-flex justify-content-between align-items-center">
                      {al.mensaje_alerta}
                      <span className="badge bg-danger">{al.criticidad}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default App;