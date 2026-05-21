import React, { useEffect, useState } from 'react';
import axios from '../../axios';
import { toast } from 'react-toastify';

const STATUS_LABELS = {
    waiting:   { label: 'Laukiama',    cls: 'warning'   },
    confirmed: { label: 'Patvirtinta', cls: 'info'      },
    completed: { label: 'Atlikta',     cls: 'success'   },
    canceled:  { label: 'Atmesta',     cls: 'danger'    },
    draft:     { label: 'Juodraštis',  cls: 'secondary' },
};

const TYPE_LABELS = {
    issue:           'Išdavimas',
    return:          'Grąžinimas',
    temporary_issue: 'Laikinas išdavimas',
};

const MyOrdersView = () => {
    const [orders, setOrders]             = useState([]);
    const [issuedItems, setIssuedItems]   = useState([]);
    const [loading, setLoading]           = useState(true);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [selectedMovement, setSelectedMovement] = useState(null);
    const [returnForm, setReturnForm]     = useState({ quantity: '', reason: '', comment: '' });
    const [submitting, setSubmitting]     = useState(false);

    useEffect(() => {
        axios.get('/v1/me')
            .then(res => {
                const uid = res.data.id_User;
                setCurrentUserId(uid);
                fetchOrders(uid);
                fetchIssuedItems(uid);
            })
            .catch(() => {
                toast.error('Nepavyko nustatyti naudotojo');
                setLoading(false);
            });
    }, []);

    const fetchOrders = async (uid) => {
        const userId = uid ?? currentUserId;
        if (!userId) return;
        setLoading(true);
        try {
            const res = await axios.get('/v2/inventory/orders');
            setOrders(res.data.data || res.data || []);
        } catch {
            toast.error('Klaida kraunant užklausas');
        } finally {
            setLoading(false);
        }
    };

    const fetchIssuedItems = async (uid) => {
        const userId = uid ?? currentUserId;
        if (!userId) return;
        try {
            const [r1, r2] = await Promise.all([
                axios.get('/v2/inventory/movements', {
                    params: { legacy_user_id: userId, movement_type: 'issue' }
                }),
                axios.get('/v2/inventory/movements', {
                    params: { legacy_user_id: userId, movement_type: 'temporary_issue' }
                }),
            ]);
            const all = [
                ...(r1.data.data || []),
                ...(r2.data.data || []),
            ];
            all.sort((a, b) => new Date(b.movement_date) - new Date(a.movement_date));
            setIssuedItems(all);
        } catch {}
    };

    const openReturnModal = (movement) => {
        setSelectedMovement(movement);
        setReturnForm({
            quantity: parseFloat(movement.quantity),
            reason: '',
            comment: '',
        });
        setShowReturnModal(true);
    };

    const handleReturnSubmit = async () => {
        if (!returnForm.quantity || parseFloat(returnForm.quantity) <= 0) {
            toast.error('Įvesk kiekį');
            return;
        }
        setSubmitting(true);
        try {
            await axios.post('/v2/inventory/orders', {
                order_type:         'return',
                source_movement_id: selectedMovement.id,
                quantity:           parseFloat(returnForm.quantity),
                reason:             returnForm.reason || 'Grąžinimas',
                comment:            returnForm.comment || null,
            });
            toast.success('Grąžinimo užklausa pateikta. Laukiama sandėlininko patvirtinimo.');
            setShowReturnModal(false);
            fetchOrders(currentUserId);
        } catch (e) {
            toast.error(e.response?.data?.message || 'Klaida teikiant užklausą');
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (dt) => {
        if (!dt) return '—';
        return new Date(dt).toLocaleString('lt-LT', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit',
        });
    };

    return (
        <div className="container mt-4" style={{ paddingTop: '70px' }}>
            <h3 className="mb-4">Mano užklausos ir daiktai</h3>

            {/* IŠDUOTI DAIKTAI */}
            <div className="card mb-4">
                <div className="card-header"><strong>Mano turimi daiktai</strong></div>
                <div className="card-body p-0">
                    {!currentUserId ? (
                        <div className="p-3 text-center">
                            <div className="spinner-border spinner-border-sm" />
                        </div>
                    ) : issuedItems.length === 0 ? (
                        <div className="p-3 text-muted">Jums šiuo metu nėra išduota daiktų.</div>
                    ) : (
                        <table className="table table-sm table-hover mb-0">
                            <thead className="table-light">
                            <tr>
                                <th>Daiktas</th>
                                <th>SKU / Dydis</th>
                                <th className="text-end">Kiekis</th>
                                <th>Išduota</th>
                                <th>Tipas</th>
                                <th></th>
                            </tr>
                            </thead>
                            <tbody>
                            {issuedItems.map(m => (
                                <tr key={m.id}>
                                    <td>
                                        <strong>{m.item_variant?.item?.name || '—'}</strong>
                                        <div><small className="text-muted">{m.item_variant?.item?.code}</small></div>
                                    </td>
                                    <td>
                                        <code className="small">{m.item_variant?.sku}</code>
                                        {m.item_variant?.size && (
                                            <span className="badge bg-secondary ms-1">{m.item_variant.size}</span>
                                        )}
                                    </td>
                                    <td className="text-end fw-bold">{m.quantity}</td>
                                    <td className="small text-muted">{formatDate(m.movement_date)}</td>
                                    <td>
                                        {m.movement_type === 'temporary_issue' && (
                                            <span className="badge bg-warning text-dark">Laikinas</span>
                                        )}
                                    </td>
                                    <td>
                                        {m.item_variant?.item?.is_expirable ? (
                                            <span className="text-muted small">Negrąžinama</span>
                                        ) : (
                                            <button
                                                className="btn btn-sm btn-outline-success"
                                                onClick={() => openReturnModal(m)}
                                            >
                                                ↩ Grąžinti
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* UŽKLAUSŲ ISTORIJA */}
            <div className="card">
                <div className="card-header"><strong>Mano užklausų istorija</strong></div>
                <div className="card-body p-0">
                    {loading ? (
                        <div className="p-3 text-center">
                            <div className="spinner-border spinner-border-sm" />
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="p-3 text-muted">Užklausų nėra.</div>
                    ) : (
                        <table className="table table-sm table-hover mb-0">
                            <thead className="table-light">
                            <tr>
                                <th>Tipas</th>
                                <th>Daiktas</th>
                                <th className="text-end">Kiekis</th>
                                <th>Statusas</th>
                                <th>Pateikta</th>
                                <th>Pastaba</th>
                            </tr>
                            </thead>
                            <tbody>
                            {orders.map(o => {
                                const item = o.item_variant?.item
                                    || o.source_movement?.item_variant?.item;
                                const s = STATUS_LABELS[o.status] || { label: o.status, cls: 'secondary' };
                                return (
                                    <tr key={o.id}>
                                        <td>
                                                <span className="badge bg-light text-dark border">
                                                    {TYPE_LABELS[o.order_type] || o.order_type}
                                                </span>
                                        </td>
                                        <td>{item?.name || '—'}</td>
                                        <td className="text-end">{o.quantity}</td>
                                        <td>
                                            <span className={`badge bg-${s.cls}`}>{s.label}</span>
                                        </td>
                                        <td className="small text-muted">{formatDate(o.requested_at)}</td>
                                        <td className="small text-muted">{o.admin_note || '—'}</td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* GRĄŽINIMO MODAL */}
            {showReturnModal && selectedMovement && (
                <div className="modal d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Grąžinimo užklausa</h5>
                                <button className="btn-close" onClick={() => setShowReturnModal(false)} />
                            </div>
                            <div className="modal-body">
                                <div className="alert alert-light border mb-3">
                                    <strong>{selectedMovement.item_variant?.item?.name}</strong>
                                    {selectedMovement.item_variant?.size && (
                                        <span className="badge bg-secondary ms-2">
                                            {selectedMovement.item_variant.size}
                                        </span>
                                    )}
                                    <div className="text-muted small mt-1">
                                        Išduota: {parseFloat(selectedMovement.quantity)} vnt.
                                        · {formatDate(selectedMovement.movement_date)}
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Grąžinamas kiekis *</label>
                                    <input
                                        type="number"
                                        step="0.001"
                                        min="0.001"
                                        max={parseFloat(selectedMovement.quantity)}
                                        className="form-control"
                                        value={returnForm.quantity}
                                        onChange={e => setReturnForm(p => ({ ...p, quantity: e.target.value }))}
                                    />
                                    <div className="form-text">
                                        Maks.: {parseFloat(selectedMovement.quantity)} vnt.
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Priežastis</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Pratybos pasibaigė..."
                                        value={returnForm.reason}
                                        onChange={e => setReturnForm(p => ({ ...p, reason: e.target.value }))}
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Papildomas komentaras</label>
                                    <textarea
                                        className="form-control"
                                        rows="2"
                                        placeholder="Daiktas šiek tiek susidėvėjęs..."
                                        value={returnForm.comment}
                                        onChange={e => setReturnForm(p => ({ ...p, comment: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setShowReturnModal(false)}
                                >
                                    Atšaukti
                                </button>
                                <button
                                    className="btn btn-success"
                                    onClick={handleReturnSubmit}
                                    disabled={submitting}
                                >
                                    {submitting ? 'Teikiama...' : 'Pateikti užklausą'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyOrdersView;