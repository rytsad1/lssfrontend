import React, { useEffect, useState } from 'react';
import axios from '../../axios';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

const IssueView = () => {
    const [users, setUsers] = useState([]);
    const [variants, setVariants] = useState([]);
    const [search, setSearch] = useState('');
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [stockInfo, setStockInfo] = useState(null);

    const [form, setForm] = useState({
        quantity: 1,
        legacy_user_id: '',
        reason: '',
    });

    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    useEffect(() => {
        axios.get('/v1/users')
            .then(res => setUsers(res.data.data ?? res.data ?? []))
            .catch(() => {});
    }, []);

    // Paieška su debounce
    useEffect(() => {
        if (!search || search.length < 2) {
            setVariants([]);
            return;
        }
        const t = setTimeout(async () => {
            try {
                const res = await axios.get('/v2/inventory/variants', {
                    params: { search }
                });
                setVariants(res.data.data || []);
            } catch {}
        }, 300);
        return () => clearTimeout(t);
    }, [search]);

    // Kai pasirenkamas variantas — rodome likutį
    useEffect(() => {
        if (!selectedVariant) { setStockInfo(null); return; }
        axios.get(`/v2/inventory/stock/${selectedVariant.id}`)
            .then(res => setStockInfo(res.data.data))
            .catch(() => setStockInfo(null));
    }, [selectedVariant]);

    const handleVariantSelect = (v) => {
        setSelectedVariant(v);
        setSearch(`${v.sku} — ${v.name}${v.size ? ` (${v.size})` : ''}`);
        setVariants([]);
        setResult(null);
    };

    const handleClearVariant = () => {
        setSelectedVariant(null);
        setSearch('');
        setStockInfo(null);
        setResult(null);
    };

    const handleSubmit = async () => {
        if (!selectedVariant) { toast.error('Pasirink daiktą'); return; }
        if (!form.legacy_user_id) { toast.error('Pasirink gavėją'); return; }
        if (!form.quantity || Number(form.quantity) <= 0) { toast.error('Įvesk kiekį'); return; }

        setLoading(true);
        setResult(null);
        try {
            const res = await axios.post('/v2/inventory/issue', {
                item_variant_id:      selectedVariant.id,
                quantity:             Number(form.quantity),
                legacy_user_id:       form.legacy_user_id || null,
                reason:               form.reason || 'Išdavimas',
            });

            const data = res.data.data ?? res.data;
            setResult(data);
            toast.success('Išdavimas atliktas.');

            // Reset kiekio ir priežasties, bet palieka variantą ir naudotoją
            setForm(prev => ({ ...prev, quantity: 1, reason: '' }));
            // Atnaujinam likutį
            axios.get(`/v2/inventory/stock/${selectedVariant.id}`)
                .then(r => setStockInfo(r.data.data))
                .catch(() => {});

        } catch (e) {
            toast.error(
                e.response?.data?.error ||
                e.response?.data?.message ||
                'Klaida išduodant'
            );
        } finally {
            setLoading(false);
        }
    };

    const isExpirable    = selectedVariant?.item?.is_expirable;
    const availableQty   = stockInfo?.totals?.available ?? null;
    const expiredQty     = stockInfo?.totals?.expired   ?? 0;

    return (
        <div className="container mt-5 pt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="mb-0">Išdavimas</h2>
                <Link to="/v2/stock" className="btn btn-outline-secondary btn-sm">Likučiai</Link>
            </div>

            {/* 1. DAIKTO PAIEŠKA */}
            <div className="card p-3 mb-3">
                <h5>1. Daiktas</h5>

                <div className="position-relative">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Ieškoti pagal SKU, pavadinimą, kodą..."
                        value={search}
                        onChange={e => {
                            setSearch(e.target.value);
                            if (selectedVariant) handleClearVariant();
                        }}
                    />

                    {/* Dropdown rezultatai */}
                    {variants.length > 0 && (
                        <div
                            className="border rounded shadow-sm bg-white position-absolute w-100"
                            style={{ top: '100%', zIndex: 1000, maxHeight: '260px', overflowY: 'auto' }}
                        >
                            {variants.map(v => (
                                <div
                                    key={v.id}
                                    className="px-3 py-2 border-bottom"
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => handleVariantSelect(v)}
                                    onMouseEnter={e => e.currentTarget.classList.add('bg-light')}
                                    onMouseLeave={e => e.currentTarget.classList.remove('bg-light')}
                                >
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <strong>{v.sku}</strong>
                                            {v.size && <span className="badge bg-secondary ms-1">{v.size}</span>}
                                            {v.item?.is_expirable && (
                                                <span className="badge bg-warning text-dark ms-1">Galiojantis</span>
                                            )}
                                            <div className="small text-muted">{v.item?.name} · {v.item?.code}</div>
                                        </div>
                                        <div className="text-end small">
                                            <span className={`fw-bold ${v.available_batch_quantity > 0 ? 'text-success' : 'text-danger'}`}>
                                                {v.available_batch_quantity ?? 0}
                                            </span>
                                            <div className="text-muted">{v.item?.unit_of_measure}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Pasirinkto varianto info */}
                {selectedVariant && stockInfo && (
                    <div className={`alert mt-3 mb-0 py-2 ${isExpirable ? 'alert-warning' : 'alert-info'}`}>
                        <div className="d-flex justify-content-between align-items-start">
                            <div>
                                <strong>{selectedVariant.item?.name}</strong>
                                {selectedVariant.size && (
                                    <span className="badge bg-secondary ms-2">{selectedVariant.size}</span>
                                )}
                                {isExpirable && (
                                    <span className="badge bg-warning text-dark ms-2">
                                        ⚠ Išdavus bus automatiškai nurašyta
                                    </span>
                                )}
                                <div className="small text-muted mt-1">
                                    SKU: {selectedVariant.sku}
                                </div>
                            </div>
                            <div className="text-end">
                                <div className={`fs-4 fw-bold ${availableQty > 0 ? 'text-success' : 'text-danger'}`}>
                                    {availableQty ?? '—'}
                                </div>
                                <div className="small text-muted">vnt. liko</div>
                            </div>
                        </div>
                        {expiredQty > 0 && (
                            <div className="text-danger small mt-1">
                                ⚠ Pasibaigusių: {expiredQty} vnt. (nebus išduoti)
                            </div>
                        )}
                        <button
                            className="btn btn-sm btn-outline-secondary mt-2"
                            onClick={handleClearVariant}
                        >
                            ✕ Keisti daiktą
                        </button>
                    </div>
                )}
            </div>

            {/* 2. GAVĖJAS */}
            <div className="card p-3 mb-3">
                <h5>2. Gavėjas</h5>
                <select
                    className="form-select"
                    value={form.legacy_user_id}
                    onChange={e => setForm(prev => ({ ...prev, legacy_user_id: e.target.value }))}
                >
                    <option value="">— Pasirinkti naudotoją —</option>
                    {users.map(u => (
                        <option key={u.id_User} value={u.id_User}>
                            {u.Name} {u.Surname}
                        </option>
                    ))}
                </select>
            </div>

            {/* 3. KIEKIS IR PRIEŽASTIS */}
            <div className="card p-3 mb-3">
                <h5>3. Kiekis ir priežastis</h5>
                <div className="row g-3">
                    <div className="col-md-3">
                        <label className="form-label">Kiekis *</label>
                        <input
                            type="number"
                            step="0.001"
                            min="0.001"
                            className="form-control"
                            value={form.quantity}
                            onChange={e => setForm(prev => ({ ...prev, quantity: e.target.value }))}
                        />
                        {availableQty !== null && (
                            <div className="form-text">
                                Maks.: <strong>{availableQty}</strong> vnt.
                            </div>
                        )}
                    </div>
                    <div className="col-md-9">
                        <label className="form-label">Priežastis</label>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Pratybos, projektas..."
                            value={form.reason}
                            onChange={e => setForm(prev => ({ ...prev, reason: e.target.value }))}
                        />
                    </div>
                </div>
            </div>

            {/* SUBMIT */}
            <button
                className="btn btn-dark btn-lg w-100 mb-4"
                disabled={!selectedVariant || !form.legacy_user_id || loading}
                onClick={handleSubmit}
            >
                {loading ? (
                    <><span className="spinner-border spinner-border-sm me-2" />Išduodama...</>
                ) : (
                    'Išduoti'
                )}
            </button>

            {/* REZULTATAS */}
            {result && (
                <div className="card border-success mb-4">
                    <div className="card-header bg-success text-white d-flex justify-content-between">
                        <span>✓ Išduota {result.issued_quantity} vnt.</span>
                        {result.is_expirable && (
                            <span className="badge bg-warning text-dark">+ automatiškai nurašyta</span>
                        )}
                    </div>
                    <div className="card-body p-0">
                        <table className="table table-sm mb-0">
                            <thead className="table-light">
                            <tr>
                                <th>Partija</th>
                                <th className="text-end">Išduota</th>
                                <th className="text-end">Liko partijoje</th>
                            </tr>
                            </thead>
                            <tbody>
                            {(result.issued_batches || []).map((b, i) => (
                                <tr key={i}>
                                    <td><code>{b.batch_number || `#${b.batch_id}`}</code></td>
                                    <td className="text-end">{b.issued_quantity}</td>
                                    <td className="text-end">{b.remaining_after}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default IssueView;