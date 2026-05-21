import React, { useEffect, useState } from 'react';
import axios from '../../axios';
import { toast } from 'react-toastify';

const IssueView = () => {
    // -----------------------
    // STATE
    // -----------------------
    const [items, setItems] = useState([]);
    const [variants, setVariants] = useState([]);
    const [users, setUsers] = useState([]);
    const [departments, setDepartments] = useState([]);

    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [variantStock, setVariantStock] = useState(null);

    const [form, setForm] = useState({
        quantity: 1,
        legacy_user_id: '',
        legacy_department_id: '',
        reason: '',
    });

    const [loading, setLoading] = useState(false);
    const [loadingVariants, setLoadingVariants] = useState(false);
    const [result, setResult] = useState(null);

    // -----------------------
    // HELPERS
    // -----------------------
    const getList = (res) => res?.data?.data ?? res?.data ?? [];
    const safeArray = (val) => Array.isArray(val) ? val : [];

    // -----------------------
    // LOAD INITIAL DATA
    // -----------------------
    useEffect(() => {
        loadAll();
    }, []);

    const loadAll = async () => {
        try {
            const [itemsRes, usersRes, depRes] = await Promise.all([
                axios.get('/v2/inventory/items', { params: { per_page: 1000 } }),
                axios.get('/v1/users'),
                axios.get('/v1/department'),
            ]);

            setItems(safeArray(getList(itemsRes)));
            setUsers(safeArray(getList(usersRes)));
            setDepartments(safeArray(getList(depRes)));
        } catch (e) {
            toast.error('Nepavyko įkelti duomenų');
            console.error(e);
        }
    };

    const loadVariants = async (itemId) => {
        setLoadingVariants(true);
        try {
            const res = await axios.get('/v2/inventory/variants', {
                params: { item_id: itemId, per_page: 1000 },
            });
            setVariants(safeArray(getList(res)));
        } catch (e) {
            toast.error('Nepavyko įkelti variantų');
            setVariants([]);
        } finally {
            setLoadingVariants(false);
        }
    };

    // -----------------------
    // SELECT
    // -----------------------
    const handleSelectItem = (item) => {
        setSelectedItem(item);
        setSelectedVariant(null);
        setVariantStock(null);
        setResult(null);
        loadVariants(item.id);
    };

    const handleSelectVariant = (v) => {
        setSelectedVariant(v);
        setResult(null);
        // pasirodo likutį iš variant'o duomenų
        const available = parseFloat(v.available_batch_quantity || 0);
        setVariantStock(available);
    };

    // -----------------------
    // SUBMIT
    // -----------------------
    const handleSubmit = async () => {
        setLoading(true);
        setResult(null);

        const payload = {
            item_variant_id: selectedVariant?.id,
            quantity: Number(form.quantity),
            legacy_user_id: form.legacy_user_id ? Number(form.legacy_user_id) : null,
            legacy_department_id: form.legacy_department_id ? Number(form.legacy_department_id) : null,
            reason: form.reason || null,
        };

        try {
            const res = await axios.post('/v2/inventory/issue', payload);
            setResult(res.data.data);
            toast.success(`Išduota ${res.data.data.issued_quantity} vnt.`);

            // sumažinam likutį UI'e
            setVariantStock(prev => prev - Number(form.quantity));

            // reset form bet palieka pasirinktus item/variant
            setForm(prev => ({ ...prev, quantity: 1, reason: '' }));
        } catch (e) {
            const data = e.response?.data;
            if (data?.errors) {
                Object.values(data.errors).flat().forEach(msg => toast.error(msg));
            } else {
                toast.error(data?.error || data?.message || 'Klaida išduodant');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleStartOver = () => {
        setSelectedItem(null);
        setSelectedVariant(null);
        setVariantStock(null);
        setVariants([]);
        setResult(null);
        setForm({ quantity: 1, legacy_user_id: '', legacy_department_id: '', reason: '' });
    };

    // -----------------------
    // VALIDATION
    // -----------------------
    const canSubmit =
        selectedVariant &&
        form.legacy_user_id &&
        form.quantity > 0 &&
        (variantStock === null || form.quantity <= variantStock) &&
        !loading;

    // -----------------------
    // UI
    // -----------------------
    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h3>Daiktų išdavimas</h3>
                {(selectedItem || result) && (
                    <button className="btn btn-outline-secondary" onClick={handleStartOver}>
                        Pradėti iš naujo
                    </button>
                )}
            </div>

            {/* 1. ITEMS */}
            <div className="card mb-3">
                <div className="card-header">
                    <strong>1. Pasirink daiktą</strong>
                </div>
                <div className="card-body">
                    {items.length === 0 ? (
                        <p className="text-muted mb-0">Nėra daiktų sandėlyje.</p>
                    ) : (
                        <div className="row g-2">
                            {items.map(item => (
                                <div className="col-md-3" key={item.id}>
                                    <button
                                        className={`btn w-100 ${
                                            selectedItem?.id === item.id
                                                ? 'btn-primary'
                                                : 'btn-outline-primary'
                                        }`}
                                        onClick={() => handleSelectItem(item)}
                                    >
                                        <div className="small text-muted">{item.code}</div>
                                        <div>{item.name}</div>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* 2. VARIANTS */}
            {selectedItem && (
                <div className="card mb-3">
                    <div className="card-header">
                        <strong>2. Pasirink variantą</strong>
                    </div>
                    <div className="card-body">
                        {loadingVariants ? (
                            <div className="text-center">
                                <div className="spinner-border spinner-border-sm"></div>
                            </div>
                        ) : variants.length === 0 ? (
                            <p className="text-muted mb-0">Šis daiktas neturi variantų.</p>
                        ) : (
                            <div className="row g-2">
                                {variants.map(v => {
                                    const stock = parseFloat(v.available_batch_quantity || 0);
                                    const isEmpty = stock === 0;
                                    return (
                                        <div className="col-md-3" key={v.id}>
                                            <button
                                                className={`btn w-100 ${
                                                    selectedVariant?.id === v.id
                                                        ? 'btn-success'
                                                        : isEmpty
                                                            ? 'btn-outline-secondary'
                                                            : 'btn-outline-success'
                                                }`}
                                                onClick={() => handleSelectVariant(v)}
                                                disabled={isEmpty}
                                            >
                                                <div className="small">{v.sku}</div>
                                                <div>{v.name}</div>
                                                <div className="small">
                                                    Likutis: <strong>{stock}</strong>
                                                </div>
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 3. RECIPIENT */}
            {selectedVariant && (
                <div className="card mb-3">
                    <div className="card-header">
                        <strong>3. Kam išduodama</strong>
                    </div>
                    <div className="card-body">
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="form-label">Naudotojas *</label>
                                <select
                                    className="form-select"
                                    value={form.legacy_user_id}
                                    onChange={(e) =>
                                        setForm({ ...form, legacy_user_id: e.target.value })
                                    }
                                >
                                    <option value="">— Pasirink —</option>
                                    {users.map(u => (
                                        <option key={u.id_User} value={u.id_User}>
                                            {u.Name} {u.Surname} ({u.Email})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-md-6 mb-3">
                                <label className="form-label">Skyrius (nebūtina)</label>
                                <select
                                    className="form-select"
                                    value={form.legacy_department_id}
                                    onChange={(e) =>
                                        setForm({ ...form, legacy_department_id: e.target.value })
                                    }
                                >
                                    <option value="">Be skyriaus</option>
                                    {departments.map(d => (
                                        <option key={d.id_Department} value={d.id_Department}>
                                            {d.Name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. QUANTITY + REASON */}
            {selectedVariant && (
                <div className="card mb-3">
                    <div className="card-header">
                        <strong>4. Kiekis ir priežastis</strong>
                    </div>
                    <div className="card-body">
                        <div className="row">
                            <div className="col-md-4 mb-3">
                                <label className="form-label">Kiekis *</label>
                                <input
                                    type="number"
                                    step="0.001"
                                    min="0.001"
                                    max={variantStock || undefined}
                                    className="form-control"
                                    value={form.quantity}
                                    onChange={(e) =>
                                        setForm({ ...form, quantity: e.target.value })
                                    }
                                />
                                {variantStock !== null && (
                                    <div className="form-text">
                                        Likutis: <strong>{variantStock}</strong>
                                        {form.quantity > variantStock && (
                                            <span className="text-danger ms-2">Per daug!</span>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="col-md-8 mb-3">
                                <label className="form-label">Priežastis (nebūtina)</label>
                                <input
                                    className="form-control"
                                    placeholder="Pvz. pratybų metu, kasdienis aprūpinimas..."
                                    value={form.reason}
                                    onChange={(e) =>
                                        setForm({ ...form, reason: e.target.value })
                                    }
                                />
                            </div>
                        </div>

                        <button
                            className="btn btn-primary"
                            disabled={!canSubmit}
                            onClick={handleSubmit}
                        >
                            {loading ? 'Išduodama...' : `Išduoti ${form.quantity} vnt.`}
                        </button>
                    </div>
                </div>
            )}

            {/* RESULT */}
            {result && (
                <div className="alert alert-success">
                    <h5>✓ Išdavimas atliktas</h5>
                    <div className="row">
                        <div className="col-md-6">
                            <strong>Prašyta:</strong> {result.requested_quantity}<br />
                            <strong>Išduota:</strong> {result.issued_quantity}
                        </div>
                    </div>

                    {result.issued_batches?.length > 0 && (
                        <details className="mt-2">
                            <summary>Iš kokių partijų paimta ({result.issued_batches.length})</summary>
                            <ul className="mt-2 mb-0">
                                {result.issued_batches.map((b, i) => (
                                    <li key={i}>
                                        {b.batch_number || `#${b.batch_id}`}: <strong>{b.issued_quantity}</strong>
                                        {' '}(liko {b.remaining_after})
                                    </li>
                                ))}
                            </ul>
                        </details>
                    )}
                </div>
            )}
        </div>
    );
};

export default IssueView;