import React, { useEffect, useState } from 'react';
import axios from '../../axios';
import { toast } from 'react-toastify';

const TYPE_LABELS = {
    caliber_group:   'Kalibro grupė',
    unique_per_user: 'Unikalus naudotojui',
};

const emptyForm = { code: '', type: 'caliber_group', name: '', description: '' };

const CompatibilityGroupsView = () => {
    const [groups, setGroups]       = useState([]);
    const [loading, setLoading]     = useState(true);
    const [selected, setSelected]   = useState(null);
    const [showForm, setShowForm]   = useState(false);
    const [form, setForm]           = useState(emptyForm);
    const [editId, setEditId]       = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Varianto paieška
    const [itemSearch, setItemSearch]       = useState('');
    const [itemResults, setItemResults]     = useState([]);
    const [selectedItem, setSelectedItem]   = useState(null);
    const [itemVariants, setItemVariants]   = useState([]);
    const [selectedVariantId, setSelectedVariantId] = useState('');
    const [addingVariant, setAddingVariant] = useState(false);

    useEffect(() => {
        fetchGroups();
    }, []);

    // Daikto paieška su debounce
    useEffect(() => {
        if (!itemSearch || itemSearch.length < 2) { setItemResults([]); return; }
        const t = setTimeout(async () => {
            try {
                const res = await axios.get('/v2/inventory/items', { params: { search: itemSearch } });
                setItemResults(res.data.data || []);
            } catch {}
        }, 300);
        return () => clearTimeout(t);
    }, [itemSearch]);

    // Kai pasirenkamas daiktas — kraunam jo variantus
    const handleSelectItem = async (item) => {
        setSelectedItem(item);
        setItemSearch(`${item.code} — ${item.name}`);
        setItemResults([]);
        setSelectedVariantId('');
        try {
            const res = await axios.get('/v2/inventory/variants', {
                params: { item_id: item.id, per_page: 100 }
            });
            setItemVariants(res.data.data || []);
        } catch {}
    };

    const handleClearItem = () => {
        setSelectedItem(null);
        setItemSearch('');
        setItemResults([]);
        setItemVariants([]);
        setSelectedVariantId('');
    };

    const fetchGroups = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/v2/inventory/compatibility-groups');
            setGroups(res.data.data || []);
        } catch (e) {
            if (e.response?.status !== 403) toast.error('Klaida kraunant grupes');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (g) => {
        setEditId(g.id);
        setForm({ code: g.code, type: g.type, name: g.name, description: g.description || '' });
        setShowForm(true);
    };

    const handleSubmit = async () => {
        if (!form.code || !form.name) { toast.error('Kodas ir pavadinimas privalomi'); return; }
        setSubmitting(true);
        try {
            if (editId) {
                await axios.put(`/v2/inventory/compatibility-groups/${editId}`, form);
                toast.success('Grupė atnaujinta.');
            } else {
                await axios.post('/v2/inventory/compatibility-groups', form);
                toast.success('Grupė sukurta.');
            }
            setShowForm(false);
            setForm(emptyForm);
            setEditId(null);
            fetchGroups();
            setSelected(null);
        } catch (e) {
            toast.error(e.response?.data?.message || 'Klaida');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Ištrinti grupę? Visi priskirti variantai bus atskirti.')) return;
        try {
            await axios.delete(`/v2/inventory/compatibility-groups/${id}`);
            toast.success('Grupė ištrinta.');
            if (selected?.id === id) setSelected(null);
            fetchGroups();
        } catch (e) {
            toast.error(e.response?.data?.message || 'Klaida');
        }
    };

    const handleAttach = async () => {
        if (!selectedVariantId || !selected) return;
        setAddingVariant(true);
        try {
            const res = await axios.post(
                `/v2/inventory/compatibility-groups/${selected.id}/variants`,
                { item_variant_id: parseInt(selectedVariantId) }
            );
            toast.success('Variantas priskirtas.');
            setSelected(res.data.data);
            handleClearItem();
            fetchGroups();
        } catch (e) {
            toast.error(e.response?.data?.message || 'Klaida');
        } finally {
            setAddingVariant(false);
        }
    };

    const handleDetach = async (variantId) => {
        if (!selected) return;
        try {
            const res = await axios.delete(
                `/v2/inventory/compatibility-groups/${selected.id}/variants/${variantId}`
            );
            toast.success('Variantas pašalintas.');
            setSelected(res.data.data);
            fetchGroups();
        } catch (e) {
            toast.error(e.response?.data?.message || 'Klaida');
        }
    };

    const assignedIds = new Set(selected?.variants?.map(v => v.id) || []);
    const availableVariants = itemVariants.filter(v => !assignedIds.has(v.id));

    return (
        <div className="container-fluid mt-4" style={{ paddingTop: '70px' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3>Suderinamumo grupės</h3>
                <button className="btn btn-primary btn-sm"
                        onClick={() => { setShowForm(s => !s); setEditId(null); setForm(emptyForm); }}>
                    {showForm ? 'Atšaukti' : '+ Nauja grupė'}
                </button>
            </div>

            <div className="alert alert-info small mb-4">
                <strong>Kalibro grupė</strong> — susieja ginklus ir šovinius. Sistema leis išduoti šovinius tik naudotojui, kuris turi to paties kalibro ginklą.<br />
                <strong>Unikalus naudotojui</strong> — šis nustatymas yra ant daikto (<code>unique_per_user</code>), ne grupėje.
            </div>

            {/* Kūrimo/redagavimo forma */}
            {showForm && (
                <div className="card mb-4">
                    <div className="card-header"><strong>{editId ? 'Redaguoti grupę' : 'Nauja grupė'}</strong></div>
                    <div className="card-body">
                        <div className="row g-3">
                            <div className="col-md-2">
                                <label className="form-label">Kodas *</label>
                                <input type="text" className="form-control"
                                       value={form.code}
                                       onChange={e => setForm(p => ({ ...p, code: e.target.value }))}
                                       placeholder="CAL-9MM" />
                            </div>
                            <div className="col-md-2">
                                <label className="form-label">Tipas *</label>
                                <select className="form-select"
                                        value={form.type}
                                        onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                                    <option value="caliber_group">Kalibro grupė</option>
                                    <option value="unique_per_user">Unikalus naudotojui</option>
                                </select>
                            </div>
                            <div className="col-md-4">
                                <label className="form-label">Pavadinimas *</label>
                                <input type="text" className="form-control"
                                       value={form.name}
                                       onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                       placeholder="9mm Parabellum" />
                            </div>
                            <div className="col-md-3">
                                <label className="form-label">Aprašymas</label>
                                <input type="text" className="form-control"
                                       value={form.description}
                                       onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                       placeholder="Papildomas aprašymas..." />
                            </div>
                            <div className="col-md-1 d-flex align-items-end">
                                <button className="btn btn-success w-100"
                                        onClick={handleSubmit} disabled={submitting}>
                                    {submitting ? '...' : 'Išsaugoti'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="row">
                {/* Grupių sąrašas */}
                <div className={selected ? 'col-md-5' : 'col-12'}>
                    {loading ? (
                        <div className="text-center py-5"><div className="spinner-border" /></div>
                    ) : groups.length === 0 ? (
                        <div className="alert alert-warning">Grupių nėra. Sukurk pirmą.</div>
                    ) : (
                        <div className="list-group">
                            {groups.map(g => (
                                <div key={g.id}
                                     className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${selected?.id === g.id ? 'active' : ''}`}
                                     onClick={() => { setSelected(g); handleClearItem(); }}
                                     style={{ cursor: 'pointer' }}>
                                    <div>
                                        <div className="fw-bold">{g.name}</div>
                                        <small className={selected?.id === g.id ? 'text-white-50' : 'text-muted'}>
                                            <code>{g.code}</code>
                                            {' · '}
                                            <span className={`badge ${g.type === 'caliber_group' ? 'bg-primary' : 'bg-secondary'} ms-1`}>
                                                {TYPE_LABELS[g.type]}
                                            </span>
                                            {' · '}
                                            {g.variants?.length ?? 0} variantų
                                        </small>
                                    </div>
                                    <div className="d-flex gap-1" onClick={e => e.stopPropagation()}>
                                        <button className="btn btn-sm btn-outline-warning"
                                                onClick={() => handleEdit(g)}>
                                            Redaguoti
                                        </button>
                                        <button className="btn btn-sm btn-outline-danger"
                                                onClick={() => handleDelete(g.id)}>
                                            Ištrinti
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Grupės detalės */}
                {selected && (
                    <div className="col-md-7">
                        <div className="card">
                            <div className="card-header d-flex justify-content-between align-items-center">
                                <div>
                                    <strong>{selected.name}</strong>
                                    <code className="ms-2 text-muted small">{selected.code}</code>
                                    <span className={`badge ms-2 ${selected.type === 'caliber_group' ? 'bg-primary' : 'bg-secondary'}`}>
                                        {TYPE_LABELS[selected.type]}
                                    </span>
                                </div>
                                <button className="btn btn-sm btn-outline-secondary"
                                        onClick={() => { setSelected(null); handleClearItem(); }}>✕</button>
                            </div>
                            <div className="card-body">

                                {/* Priskirti variantai */}
                                <h6>Priskirti variantai ({selected.variants?.length ?? 0})</h6>
                                {!selected.variants?.length ? (
                                    <div className="text-muted small mb-3">Nėra priskirtų variantų.</div>
                                ) : (
                                    <table className="table table-sm table-bordered mb-4">
                                        <thead className="table-light">
                                        <tr>
                                            <th>Daiktas</th>
                                            <th>SKU</th>
                                            <th>Variantas</th>
                                            <th></th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {selected.variants.map(v => (
                                            <tr key={v.id}>
                                                <td>
                                                    {v.item && (
                                                        <>
                                                            <strong className="small">{v.item.name}</strong>
                                                            <div><code className="small text-muted">{v.item.code}</code></div>
                                                        </>
                                                    )}
                                                </td>
                                                <td><code className="small">{v.sku}</code></td>
                                                <td><span className="small">{v.name}</span></td>
                                                <td>
                                                    <button className="btn btn-sm btn-outline-danger"
                                                            onClick={() => handleDetach(v.id)}>
                                                        ✕
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                )}

                                {/* Pridėti variantą — per daikto paiešką */}
                                <h6>Pridėti variantą</h6>
                                <div className="position-relative mb-2">
                                    <input
                                        type="text"
                                        className="form-control form-control-sm"
                                        placeholder="Ieškoti daikto pagal pavadinimą arba kodą..."
                                        value={itemSearch}
                                        onChange={e => {
                                            setItemSearch(e.target.value);
                                            if (selectedItem) handleClearItem();
                                        }}
                                    />
                                    {itemResults.length > 0 && (
                                        <div className="border rounded shadow-sm bg-white position-absolute w-100"
                                             style={{ top: '100%', zIndex: 1000, maxHeight: '220px', overflowY: 'auto' }}>
                                            {itemResults.map(item => (
                                                <div key={item.id}
                                                     className="px-3 py-2 border-bottom"
                                                     style={{ cursor: 'pointer' }}
                                                     onClick={() => handleSelectItem(item)}
                                                     onMouseEnter={e => e.currentTarget.classList.add('bg-light')}
                                                     onMouseLeave={e => e.currentTarget.classList.remove('bg-light')}>
                                                    <strong className="small">{item.name}</strong>
                                                    <span className="text-muted small ms-2">
                                                        <code>{item.code}</code>
                                                        {item.is_asset && <span className="badge bg-info ms-1">Asset</span>}
                                                        {item.is_serialized && <span className="badge bg-secondary ms-1">Serijinis</span>}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Varianto pasirinkimas */}
                                {selectedItem && (
                                    <div className="border rounded p-2 bg-light mb-2">
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <span className="small fw-bold">
                                                {selectedItem.name}
                                                <code className="ms-2 text-muted">{selectedItem.code}</code>
                                            </span>
                                            <button className="btn btn-sm btn-outline-secondary py-0"
                                                    onClick={handleClearItem}>✕</button>
                                        </div>
                                        {itemVariants.length === 0 ? (
                                            <div className="text-muted small">Nėra variantų.</div>
                                        ) : availableVariants.length === 0 ? (
                                            <div className="text-muted small">Visi variantai jau priskirti šiai grupei.</div>
                                        ) : (
                                            <div className="d-flex gap-2">
                                                <select className="form-select form-select-sm"
                                                        value={selectedVariantId}
                                                        onChange={e => setSelectedVariantId(e.target.value)}>
                                                    <option value="">— Pasirink variantą —</option>
                                                    {availableVariants.map(v => (
                                                        <option key={v.id} value={v.id}>
                                                            {v.sku} — {v.name}
                                                            {v.size ? ` (${v.size})` : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                                <button className="btn btn-sm btn-primary text-nowrap"
                                                        onClick={handleAttach}
                                                        disabled={!selectedVariantId || addingVariant}>
                                                    {addingVariant ? '...' : '+ Priskirti'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {!selectedItem && (
                                    <div className="text-muted small">
                                        Ieškok daikto aukščiau ir pasirink variantą kurį nori priskirti šiai grupei.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CompatibilityGroupsView;