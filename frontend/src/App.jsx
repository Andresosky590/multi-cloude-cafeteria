import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';
const TIPOS_PQR = ['Queja', 'Sugerencia'];

// Formulario genérico: recibe los campos, la URL y qué hacer al guardar
function FormCard({ titulo, campos, inicial, endpoint, onSaved, boton }) {
  const [form, setForm] = useState(inicial);
  const [status, setStatus] = useState(null); // { ok: bool, msg: string }
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      await axios.post(`${API_URL}/${endpoint}`, form);
      setForm(inicial);
      setStatus({ ok: true, msg: 'Registrado correctamente ✅' });
      onSaved();
    } catch (err) {
      setStatus({ ok: false, msg: err.response?.data?.error || 'No se pudo guardar.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card shadow-sm h-100">
      <div className="card-header bg-light fw-bold">{titulo}</div>
      <form className="card-body" onSubmit={handleSubmit}>
        {campos.map(({ name, label, type = 'text', options, ...rest }) => (
          <div className="mb-3" key={name}>
            <label className="form-label" htmlFor={`${endpoint}-${name}`}>{label}</label>
            {options ? (
              <select id={`${endpoint}-${name}`} name={name} className="form-select" value={form[name]} onChange={handleChange} required>
                <option value="">Selecciona...</option>
                {options.map(o => <option key={o}>{o}</option>)}
              </select>
            ) : type === 'textarea' ? (
              <textarea id={`${endpoint}-${name}`} name={name} className="form-control" rows={3} value={form[name]} onChange={handleChange} required />
            ) : (
              <input id={`${endpoint}-${name}`} name={name} type={type} className="form-control" value={form[name]} onChange={handleChange} required {...rest} />
            )}
          </div>
        ))}
        <button className="btn btn-primary" disabled={saving}>{saving ? 'Guardando...' : boton}</button>
        {status && (
          <div className={`alert mt-3 mb-0 py-2 ${status.ok ? 'alert-success' : 'alert-danger'}`}>{status.msg}</div>
        )}
      </form>
    </div>
  );
}

const camposProducto = [
  { name: 'nombre_producto', label: 'Nombre del producto', maxLength: 100 },
  { name: 'stock_actual', label: 'Stock inicial', type: 'number', min: 0, step: 1 },
  { name: 'precio', label: 'Precio ($)', type: 'number', min: 1, step: 'any' },
];

const camposPqr = [
  { name: 'tipo', label: 'Tipo', options: TIPOS_PQR },
  { name: 'comentario', label: 'Comentario', type: 'textarea' },
];

function App() {
  const [posData, setPosData] = useState({ productos: [], ventas: [] });
  const [azureData, setAzureData] = useState({ aprendices: [], empleados: [] });
  const [supabaseData, setSupabaseData] = useState({ pqrs: [], alertas: [] });
  const [errors, setErrors] = useState({ local: null, azure: null, supabase: null });
  const [loading, setLoading] = useState(true);

  // Cada fuente se carga por separado: si una BD falla, las otras dos siguen funcionando
  const fuentes = {
    local: { url: 'pos-local', set: setPosData, nombre: 'XAMPP (VM)' },
    azure: { url: 'clientes-azure', set: setAzureData, nombre: 'Azure MySQL' },
    supabase: { url: 'alertas-supabase', set: setSupabaseData, nombre: 'Supabase' },
  };

  const cargar = useCallback(async (claves = Object.keys(fuentes)) => {
    const resultados = await Promise.allSettled(claves.map(k => axios.get(`${API_URL}/${fuentes[k].url}`)));
    setErrors(prev => {
      const next = { ...prev };
      resultados.forEach((r, i) => {
        const k = claves[i];
        if (r.status === 'fulfilled') {
          fuentes[k].set(r.value.data);
          next[k] = null;
        } else {
          next[k] = `No se pudo cargar ${fuentes[k].nombre}: ${r.reason.response?.data?.error || r.reason.message}`;
        }
      });
      return next;
    });
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

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

  const ErrorBox = ({ k }) => errors[k] && <div className="alert alert-danger">{errors[k]}</div>;

  return (
    <div className="container py-4">
      <header className="pb-3 mb-4 border-bottom text-center">
        <h1 className="h2 fw-bold text-success">☕ Dashboard de Control - Cafetería SENA</h1>
        <p className="text-muted">Arquitectura Multi-Cloud: XAMPP (Local VM) | Azure MySQL | Supabase PostgreSQL</p>
      </header>

      {/* SECCIÓN 1: XAMPP (Punto de Venta Local) */}
      <section className="mb-5">
        <h3 className="h4 text-primary mb-3">🖥️ 1. XAMPP (POS Local - VM Azure)</h3>
        <ErrorBox k="local" />
        <div className="row">
          <div className="col-md-4 mb-3">
            <FormCard
              titulo="➕ Registrar producto"
              campos={camposProducto}
              inicial={{ nombre_producto: '', stock_actual: '', precio: '' }}
              endpoint="productos"
              boton="Guardar producto"
              onSaved={() => cargar(['local'])}
            />
          </div>
          <div className="col-md-4 mb-3">
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
          <div className="col-md-4 mb-3">
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
        <ErrorBox k="azure" />
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
        <ErrorBox k="supabase" />
        <div className="row">
          <div className="col-md-4 mb-3">
            <FormCard
              titulo="📝 Registrar PQR"
              campos={camposPqr}
              inicial={{ tipo: '', comentario: '' }}
              endpoint="pqr"
              boton="Enviar PQR"
              onSaved={() => cargar(['supabase'])}
            />
          </div>
          <div className="col-md-4 mb-3">
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
          <div className="col-md-4 mb-3">
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