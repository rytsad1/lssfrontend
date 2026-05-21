import React, { useEffect, useState } from 'react';
import axios from '../../axios';
import { toast } from 'react-toastify';

const KitTemplatesView = () => {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading]     = useState(true);
    const [selected, setSelected]   = useState(null); // peržiūrimas šablonas
    const [showForm, setShowForm]   = useState(false);
    const [form, setForm]           = useState({ code: '', name: '', description: '', is_active: true });
    const [submitting, setSubmitting] = useState(false);

    // Naujo elemento forma
    const [items, setItems]         = useState([]);   // sandėlio daiktai
    const [itemForm, setItemForm]   = useState({ item_id: '', required_quantity: 1, size_sensitive: false, prefer_fefo: false });
    const [addingItem, setAddingItem] = useState(false);

    useEffect(() => {
        fetchTemplates();
        axios.get('/v2/inventory/items', { params: { per_page: 1000 } })
            .then(res => setItems(res.data.data || []))
            .catch(() => {});
    }, []);

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/v2/inventory/kits');
            setTemplates(res.data.data || []);
        } catch {
            toast.error('Klaida kraunant komplektus');
        } finally {
            setLoading(false);
        }
    };

    const fetchTemplate = async (id) => {
        try {
            const res = await axios.get(`/v2/inventory/kits/${id}`);
            setSelected(res.data.data);
        } catch {
            toast.error('Klaida kraunant komplektą');
        }
    };

    const handleCreateTemplate = async () => {
        if (!form.code || !form.name) { toast.error('Kodas ir pavadinimas privalomi'); return; }
        setSubmitting(true);
        try {
            await axios.post('/v2/inventory/kits', form);
            toast.success('Komplektas sukurtas.');
            setShowForm(false);
            setForm({ code: '', name: '', description: '', is_active: true });
            fetchTemplates();
        } catch (e) {
            toast.error(e.response?.data?.message || 'Klaida');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteTemplate = async (id) => {
        if (!window.confirm('Ištrinti komplektą?')) return;
        try {
            await axios.delete(`/v2/inventory/kits/${id}`);
            toast.success('Komplektas ištrintas.');
            setSelected(null);
            fetchTemplates();
        } catch (e) {
            toast.error(e.response?.data?.message || 'Klaida');
        }
    };

    const handleAddItem = async () => {
        if (!itemForm.item_id) { toast.error('Pasirink daiktą'); return; }
        setAddingItem(true);
        try {
            await axios.post(`/v2/inventory/kits/${selected.id}/items`, itemForm);
            toast.success('Elementas pridėtas.');
            setItemForm({ item_id: '', required_quantity: 1, size_sensitive: false, prefer_fefo: false });
            fetchTemplate(selected.id);
        } catch (e) {
            toast.error(e.response?.data?.message || 'Klaida');
        } finally {
            setAddingItem(false);
        }
    };

    const handleRemoveItem = async (kitItemId) => {
        if (!window.confirm('Pašalinti elementą?')) return;
        try {
            await axios.delete(`/v2/inventory/kits/${selected.id}/items/${kitItemId}`);
            toast.success('Elementas pašalintas.');
            fetchTemplate(selected.id);
        } catch (e) {
            toast.error(e.response?.data?.message || 'Klaida');
        }
    };

    return (
        <div className="container-fluid mt-4" style={{ paddingTop: '70px' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3>Komplektų šablonai</h3>
                <button className="btn btn-primary" onClick={() => setShowForm(s => !s)}>
                    {showForm ? 'Atšaukti' : '+ Naujas komplektas'}
                </button>
            </div>

            {/* Kūrimo forma */}
            {showForm && (
                <div className="card mb-4">
                    <div className="card-body">
                        <div className="row g-3">
                            <div className="col-md-3">
                                <label className="form-label">Kodas *</label>
                                <input className="form-control" value={form.code}
                                       onChange={e => setForm(p => ({ ...p, code: e.target.value }))}
                                       placeholder="KIT-001" />
                            </div>
                            <div className="col-md-4">
                                <label className="form-label">Pavadinimas *</label>
                                <input className="form-control" value={form.name}
                                       onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                       placeholder="Naujo nario komplektas" />
                            </div>
                            <div className="col-md-4">
                                <label className="form-label">Aprašymas</label>
                                <input className="form-control" value={form.description}
                                       onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                            </div>
                            <div className="col-md-1 d-flex align-items-end">
                                <button className="btn btn-success w-100" onClick={handleCreateTemplate} disabled={submitting}>
                                    Sukurti
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="row">
                {/* Šablonų sąrašas */}
                <div className={selected ? 'col-md-4' : 'col-12'}>
                    {loading ? (
                        <div className="text-center py-5"><div className="spinner-border" /></div>
                    ) : templates.length === 0 ? (
                        <div className="alert alert-info">Komplektų nėra.</div>
                    ) : (
                        <div className="list-group">
                            {templates.map(t => (
                                <button
                                    key={t.id}
                                    className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${selected?.id === t.id ? 'active' : ''}`}
                                    onClick={() => fetchTemplate(t.id)}
                                >
                                    <div>
                                        <div className="fw-bold">{t.name}</div>
                                        <small className={selected?.id === t.id ? 'text-white-50' : 'text-muted'}>
                                            <code>{t.code}</code> · {t.items_count ?? 0} elementų
                                        </small>
                                    </div>
                                    {!t.is_active && (
                                        <span className="badge bg-secondary">Neaktyvus</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Šablono detalės */}
                {selected && (
                    <div className="col-md-8">
                        <div className="card">
                            <div className="card-header d-flex justify-content-between align-items-center">
                                <div>
                                    <strong>{selected.name}</strong>
                                    <code className="ms-2 small">{selected.code}</code>
                                </div>
                                <div className="d-flex gap-2">
                                    <button
                                        className="btn btn-sm btn-outline-danger"
                                        onClick={() => handleDeleteTemplate(selected.id)}
                                    >
                                        Ištrinti
                                    </button>
                                    <button
                                        className="btn btn-sm btn-outline-secondary"
                                        onClick={() => setSelected(null)}
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>

                            <div className="card-body">
                                {selected.description && (
                                    <p className="text-muted small mb-3">{selected.description}</p>
                                )}

                                {/* Elementų sąrašas */}
                                <h6>Elementai ({selected.items?.length ?? 0})</h6>
                                {selected.items?.length === 0 ? (
                                    <div className="text-muted small mb-3">Elementų nėra — pridėk žemiau.</div>
                                ) : (
                                    <table className="table table-sm table-bordered mb-3">
                                        <thead className="table-light">
                                        <tr>
                                            <th>Daiktas</th>
                                            <th className="text-end">Kiekis</th>
                                            <th className="text-center">Dydis</th>
                                            <th className="text-center">FEFO</th>
                                            <th></th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {selected.items.map(ki => (
                                            <tr key={ki.id}>
                                                <td>
                                                    <div>{ki.item?.name}</div>
                                                    <code className="small">{ki.item?.code}</code>
                                                </td>
                                                <td className="text-end">{ki.required_quantity}</td>
                                                <td className="text-center">
                                                    {ki.size_sensitive
                                                        ? <span className="badge bg-info">Taip</span>
                                                        : <span className="text-muted">—</span>}
                                                </td>
                                                <td className="text-center">
                                                    {ki.prefer_fefo
                                                        ? <span className="badge bg-warning text-dark">Taip</span>
                                                        : <span className="text-muted">—</span>}
                                                </td>
                                                <td>
                                                    <button
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={() => handleRemoveItem(ki.id)}
                                                    >✕</button>
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                )}

                                {/* Naujo elemento forma */}
                                <h6>Pridėti elementą</h6>
                                <div className="row g-2 align-items-end">
                                    <div className="col-md-4">
                                        <label className="form-label form-label-sm">Daiktas *</label>
                                        <select className="form-select form-select-sm"
                                                value={itemForm.item_id}
                                                onChange={e => setItemForm(p => ({ ...p, item_id: e.target.value }))}>
                                            <option value="">— Pasirink —</option>
                                            {items.map(i => (
                                                <option key={i.id} value={i.id}>{i.name} ({i.code})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-md-2">
                                        <label className="form-label form-label-sm">Kiekis</label>
                                        <input type="number" step="0.001" min="0.001"
                                               className="form-control form-control-sm"
                                               value={itemForm.required_quantity}
                                               onChange={e => setItemForm(p => ({ ...p, required_quantity: e.target.value }))} />
                                    </div>
                                    <div className="col-md-2 d-flex flex-column gap-1">
                                        <div className="form-check">
                                            <input type="checkbox" className="form-check-input" id="size_s"
                                                   checked={itemForm.size_sensitive}
                                                   onChange={e => setItemForm(p => ({ ...p, size_sensitive: e.target.checked }))} />
                                            <label className="form-check-label small" htmlFor="size_s">Dydis</label>
                                        </div>
                                        <div className="form-check">
                                            <input type="checkbox" className="form-check-input" id="fefo_s"
                                                   checked={itemForm.prefer_fefo}
                                                   onChange={e => setItemForm(p => ({ ...p, prefer_fefo: e.target.checked }))} />
                                            <label className="form-check-label small" htmlFor="fefo_s">FEFO</label>
                                        </div>
                                    </div>
                                    <div className="col-md-2">
                                        <button className="btn btn-sm btn-primary w-100"
                                                onClick={handleAddItem} disabled={addingItem}>
                                            + Pridėti
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default KitTemplatesView;