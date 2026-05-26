import React, { useEffect, useState } from 'react';
import axios from '../../axios';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

const IssueRequestView = () => {
    const [variants, setVariants]     = useState([]);
    const [search, setSearch]         = useState('');
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [stockInfo, setStockInfo]   = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState({
        quantity: 1,
        reason:   '',
        comment:  '',
    });

    // Debounce paieška
    useEffect(() => {
        if (!search || search.length < 2) { setVariants([]); return; }
        const t = setTimeout(async () => {
            try {
                const res = await axios.get('/v2/inventory/variants', { params: { search } });
                setVariants(res.data.data || []);
            } catch {}
        }, 300);
        return () => clearTimeout(t);
    }, [search]);

    // Likutis
    useEffect(() => {
        if (!selectedVariant) { setStockInfo(null); return; }
        axios.get(`/v2/inventory/stock/${selectedVariant.id}`)
            .then(r => setStockInfo(r.data.data))
            .catch(() => setStockInfo(null));
    }, [selectedVariant]);

    const handleSelect = (v) => {
        setSelectedVariant(v);
        setSearch(`${v.sku} — ${v.name}${v.size ? ` (${v.size})` : ''}`);
        setVariants([]);
        setForm(prev => ({ ...prev, quantity: 1 }));
    };

    const handleClear = () => {
        setSelectedVariant(null);
        setSearch('');
        setStockInfo(null);
    };

    const handleSubmit = async () => {
        if (!selectedVariant) { toast.error('Pasirink daiktą'); return; }
        if (!form.quantity || Number(form.quantity) <= 0) { toast.error('Įvesk kiekį'); return; }

        const available = stockInfo?.totals?.available ?? 0;
        if (Number(form.quantity) > available) {
            toast.error(`Nepakanka likučio. Galima: ${available}`);
            return;
        }

        setSubmitting(true);
        try {
            await axios.post('/v2/inventory/orders', {
                order_type:      'issue',
                item_variant_id: selectedVariant.id,
                quantity:        Number(form.quantity),
                reason:          form.reason || 'Išdavimo užklausa',
                comment:         form.comment || null,
            });
            toast.success('Užklausa pateikta. Laukiama sandėlininko patvirtinimo.');
            handleClear();
            setForm({ quantity: 1, reason: '', comment: '' });
        } catch (e) {
            toast.error(e.response?.data?.message || e.response?.data?.error || 'Klaida');
        } finally {
            setSubmitting(false);
        }
    };

    const available = stockInfo?.totals?.available ?? null;

    return (
        <div className="container mt-5 pt-4" style={{ maxWidth: '700px' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="mb-0">Prašymas išduoti daiktą</h2>
                <Link to="/v2/my-orders" className="btn btn-outline-secondary btn-sm">
                    Mano užklausos
                </Link>
            </div>

            <div className="alert alert-info mb-4">
                Užpildyk formą ir pateik užklausą — sandėlininkas ją patvirtins arba atmes.
            </div>

            {/* 1. Daiktas */}
            <div className="card p-3 mb-3">
                <h5 className="mb-3">1. Pasirink daiktą</h5>
                <div className="position-relative">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Ieškoti pagal SKU, pavadinimą..."
                        value={search}
                        onChange={e => {
                            setSearch(e.target.value);
                            if (selectedVariant) handleClear();
                        }}
                    />
                    {variants.length > 0 && (
                        <div className="border rounded shadow-sm bg-white position-absolute w-100"
                             style={{ top: '100%', zIndex: 1000, maxHeight: '260px', overflowY: 'auto' }}>
                            {variants.map(v => (
                                <div key={v.id}
                                     className="px-3 py-2 border-bottom"
                                     style={{ cursor: 'pointer' }}
                                     onClick={() => handleSelect(v)}
                                     onMouseEnter={e => e.currentTarget.classList.add('bg-light')}
                                     onMouseLeave={e => e.currentTarget.classList.remove('bg-light')}>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <strong>{v.sku}</strong>
                                            {v.size && <span className="badge bg-secondary ms-1">{v.size}</span>}
                                            {v.color && <span className="badge bg-light text-dark border ms-1">{v.color}</span>}
                                            <div className="small text-muted">{v.item?.name}</div>
                                        </div>
                                        <div className="text-end small">
                                            <span className={`fw-bold ${(v.available_batch_quantity ?? 0) > 0 ? 'text-success' : 'text-danger'}`}>
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

                {selectedVariant && stockInfo && (
                    <div className="alert alert-light border mt-3 mb-0 py-2">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <strong>{selectedVariant.item?.name}</strong>
                                {selectedVariant.size && (
                                    <span className="badge bg-secondary ms-2">{selectedVariant.size}</span>
                                )}
                                {selectedVariant.item?.is_expirable && (
                                    <span className="badge bg-warning text-dark ms-2">Suvartojamas</span>
                                )}
                                <div className="small text-muted">SKU: {selectedVariant.sku}</div>
                            </div>
                            <div className="text-end">
                                <div className={`fs-4 fw-bold ${available > 0 ? 'text-success' : 'text-danger'}`}>
                                    {available ?? '—'}
                                </div>
                                <div className="small text-muted">likutis</div>
                            </div>
                        </div>
                        {available <= 0 && (
                            <div className="text-danger small mt-1">⚠ Šio daikto sandėlyje nėra</div>
                        )}
                        <button className="btn btn-sm btn-outline-secondary mt-2" onClick={handleClear}>
                            ✕ Keisti daiktą
                        </button>
                    </div>
                )}
            </div>

            {/* 2. Kiekis */}
            <div className="card p-3 mb-3">
                <h5 className="mb-3">2. Kiekis</h5>
                <div className="row g-3 align-items-end">
                    <div className="col-md-4">
                        <label className="form-label">Kiekis *</label>
                        <input
                            type="number"
                            step="0.001"
                            min="0.001"
                            max={available ?? undefined}
                            className="form-control"
                            value={form.quantity}
                            onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))}
                        />
                        {available !== null && (
                            <div className="form-text">Maks.: <strong>{available}</strong></div>
                        )}
                    </div>
                    <div className="col-md-8">
                        <label className="form-label">Priežastis</label>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Pratybos, stovykla, renginio aprūpinimas..."
                            value={form.reason}
                            onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}
                        />
                    </div>
                </div>
            </div>

            {/* 3. Komentaras */}
            <div className="card p-3 mb-4">
                <h5 className="mb-3">3. Papildomas komentaras (neprivaloma)</h5>
                <textarea
                    className="form-control"
                    rows="2"
                    placeholder="Papildoma informacija sandėlininkui..."
                    value={form.comment}
                    onChange={e => setForm(p => ({ ...p, comment: e.target.value }))}
                />
            </div>

            <button
                className="btn btn-primary btn-lg w-100"
                disabled={!selectedVariant || !form.quantity || available <= 0 || submitting}
                onClick={handleSubmit}
            >
                {submitting
                    ? <><span className="spinner-border spinner-border-sm me-2" />Teikiama...</>
                    : '📤 Pateikti išdavimo užklausą'
                }
            </button>
        </div>
    );
};

export default IssueRequestView;