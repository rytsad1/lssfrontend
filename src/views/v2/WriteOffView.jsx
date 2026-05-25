import React, { useState, useEffect } from 'react';
import axios from '../../axios';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

const WRITEOFF_TYPES = [
    { value: 'damage',  label: 'Sugadinta' },
    { value: 'loss',    label: 'Pamesta' },
    { value: 'expired', label: 'Pasibaigė galiojimas' },
    { value: 'other',   label: 'Kita' },
];

const WriteOffView = () => {
    const [variants, setVariants]     = useState([]);
    const [loading, setLoading]       = useState(false);
    const [result, setResult]         = useState(null);
    const [stockInfo, setStockInfo]   = useState(null);
    const [search, setSearch]         = useState('');
    const [users, setUsers]           = useState([]);
    const [currentUserId, setCurrentUserId] = useState(null);


    const [form, setForm] = useState({
        item_variant_id: '',
        quantity:        '',
        reason:          '',
        writeoff_type:   'damage',
        allow_expired:   false,
        legacy_user_id:  '',
    });

    useEffect(() => {
        axios.get('/v1/me')
            .then(res => setCurrentUserId(res.data.id_User))
            .catch(() => {});
        axios.get('/v1/users')
            .then(res => setUsers(res.data.data || []))
            .catch(() => {});
    }, []);

    // Auto-parinkti prisijungusį naudotoją
    useEffect(() => {
        if (currentUserId) {
            setForm(prev => ({ ...prev, legacy_user_id: currentUserId }));
        }
    }, [currentUserId]);

    const searchVariants = async (term) => {
        if (!term || term.length < 2) { setVariants([]); return; }
        try {
            const res = await axios.get('/v2/inventory/variants', { params: { search: term } });
            setVariants(res.data.data || []);
        } catch {}
    };

    useEffect(() => {
        const t = setTimeout(() => searchVariants(search), 300);
        return () => clearTimeout(t);
    }, [search]);

    useEffect(() => {
        if (!form.item_variant_id) { setStockInfo(null); return; }
        axios.get(`/v2/inventory/stock/${form.item_variant_id}`)
            .then(res => setStockInfo(res.data.data))
            .catch(() => setStockInfo(null));
    }, [form.item_variant_id]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleVariantSelect = (v) => {
        setForm(prev => ({ ...prev, item_variant_id: v.id }));
        setSearch(`${v.sku} — ${v.name}${v.size ? ` (${v.size})` : ''}`);
        setVariants([]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.item_variant_id) { toast.error('Pasirink daiktą'); return; }
        if (!form.quantity || parseFloat(form.quantity) <= 0) { toast.error('Įvesk kiekį'); return; }
        if (!form.reason.trim()) { toast.error('Įvesk priežastį'); return; }

        if (!window.confirm(`Nurašyti ${form.quantity} vnt.? Šio veiksmo atšaukti negalima.`)) return;

        setLoading(true);
        setResult(null);
        try {
            const res = await axios.post('/v2/inventory/writeoff', {
                item_variant_id: parseInt(form.item_variant_id),
                quantity:        parseFloat(form.quantity),
                reason:          form.reason,
                writeoff_type:   form.writeoff_type,
                allow_expired:   form.allow_expired,
                legacy_user_id:  form.legacy_user_id ? parseInt(form.legacy_user_id) : null,
            });
            setResult(res.data.data);
            toast.success('Nurašymas atliktas.');
            setForm(prev => ({
                ...prev,
                quantity:        '',
                reason:          '',
                item_variant_id: '',
                legacy_user_id:  currentUserId || '',
            }));
            setSearch('');
            setStockInfo(null);
        } catch (e) {
            toast.error(e.response?.data?.error || e.response?.data?.message || 'Klaida nurašant');
        } finally {
            setLoading(false);
        }
    };

    const available = stockInfo?.totals?.available ?? 0;
    const expired   = stockInfo?.totals?.expired   ?? 0;

    return (
        <div className="container mt-4" style={{ paddingTop: '70px' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3>Nurašymas</h3>
                <Link to="/v2/stock" className="btn btn-outline-secondary">Likučiai</Link>
            </div>

            <div className="row">
                <div className="col-md-7">
                    <div className="card">
                        <div className="card-body">
                            <form onSubmit={handleSubmit}>

                                {/* Daikto paieška */}
                                <div className="mb-3 position-relative">
                                    <label className="form-label">Daiktas *</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Ieškoti pagal SKU, pavadinimą..."
                                        value={search}
                                        onChange={e => {
                                            setSearch(e.target.value);
                                            setForm(prev => ({ ...prev, item_variant_id: '' }));
                                            setStockInfo(null);
                                        }}
                                    />
                                    {variants.length > 0 && (
                                        <div
                                            className="border rounded shadow-sm bg-white position-absolute w-100"
                                            style={{ top: '100%', zIndex: 1000 }}
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
                                                    <div>
                                                        <strong>{v.sku}</strong> — {v.name}
                                                        {v.size && <span className="badge bg-secondary ms-1">{v.size}</span>}
                                                    </div>
                                                    <small className="text-muted">{v.item?.name}</small>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Likučio info */}
                                {stockInfo && (
                                    <div className="alert alert-light border mb-3 py-2">
                                        <div className="d-flex justify-content-between">
                                            <span><strong>{stockInfo.variant?.item?.name}</strong></span>
                                            <span>
                                                <span className="text-success fw-bold">{available}</span> vnt. galiojančių
                                                {expired > 0 && (
                                                    <span className="text-danger ms-2">{expired} pasibaigusių</span>
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Nurašymo tipas *</label>
                                        <select
                                            name="writeoff_type"
                                            className="form-select"
                                            value={form.writeoff_type}
                                            onChange={handleChange}
                                        >
                                            {WRITEOFF_TYPES.map(t => (
                                                <option key={t.value} value={t.value}>{t.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Kiekis *</label>
                                        <input
                                            type="number"
                                            step="0.001"
                                            min="0.001"
                                            name="quantity"
                                            className="form-control"
                                            value={form.quantity}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Priežastis *</label>
                                    <input
                                        type="text"
                                        name="reason"
                                        className="form-control"
                                        value={form.reason}
                                        onChange={handleChange}
                                        placeholder="Sugadinta pratybų metu..."
                                    />
                                </div>

                                {expired > 0 && (
                                    <div className="form-check mb-3">
                                        <input
                                            type="checkbox"
                                            name="allow_expired"
                                            id="allow_expired"
                                            className="form-check-input"
                                            checked={form.allow_expired}
                                            onChange={handleChange}
                                        />
                                        <label htmlFor="allow_expired" className="form-check-label">
                                            Nurašyti ir pasibaigusio galiojimo partijas ({expired} vnt.)
                                        </label>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    className="btn btn-danger w-100"
                                    disabled={loading || !form.item_variant_id}
                                >
                                    {loading ? 'Nurašoma...' : 'Nurašyti'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Rezultatas */}
                <div className="col-md-5">
                    {result && (
                        <div className="card border-danger">
                            <div className="card-header bg-danger text-white">
                                Nurašyta {result.written_off_quantity} vnt. ({result.writeoff_type})
                            </div>
                            <div className="card-body p-0">
                                <table className="table table-sm mb-0">
                                    <thead className="table-light">
                                    <tr>
                                        <th>Partija</th>
                                        <th className="text-end">Nurašyta</th>
                                        <th className="text-end">Liko</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {result.written_off_batches?.map((b, i) => (
                                        <tr key={i}>
                                            <td><code>{b.batch_number || `#${b.batch_id}`}</code></td>
                                            <td className="text-end">{b.written_off_quantity}</td>
                                            <td className="text-end">{b.remaining_after}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WriteOffView;