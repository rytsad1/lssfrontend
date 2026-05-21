import React, { useEffect, useState } from 'react';
import axios from '../../axios';
import { toast } from 'react-toastify';

const UserIssuedItemsView = () => {
    const [movements, setMovements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [returning, setReturning] = useState(null); // { movement, quantity }
    const [submitting, setSubmitting] = useState(false);

    // Gaunam prisijungusio vartotojo ID iš /me
    const [currentUserId, setCurrentUserId] = useState(null);

    useEffect(() => {
        axios.get('/v1/me').then(res => {
            setCurrentUserId(res.data.id_User);
        }).catch(() => {});
    }, []);

    const fetchIssued = async () => {
        if (!currentUserId) return;
        setLoading(true);
        try {
            const res = await axios.get('/v2/inventory/movements', {
                params: {
                    legacy_user_id: currentUserId,
                    movement_type: 'issue',
                }
            });
            // Filtruojam — tik tie, kur dar yra ką grąžinti
            setMovements(res.data.data || []);
        } catch (e) {
            toast.error('Klaida kraunant išduotus daiktus');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentUserId) fetchIssued();
    }, [currentUserId]);

    const handleReturnSubmit = async () => {
        if (!returning) return;
        setSubmitting(true);
        try {
            await axios.post('/v2/inventory/return', {
                inventory_movement_id: returning.movement.id,
                quantity: parseFloat(returning.quantity),
                legacy_user_id: currentUserId,
                reason: returning.reason || 'Grąžinimas',
            });
            toast.success('Grąžinimas užregistruotas.');
            setReturning(null);
            fetchIssued();
        } catch (e) {
            toast.error(e.response?.data?.error || e.response?.data?.message || 'Klaida grąžinant');
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

    // Apskaičiuojam kiek dar galima grąžinti per returned movements
    // (paprastas variantas — tiesiog rodome quantity, backend tikrina)
    const getMaxReturnable = (m) => parseFloat(m.quantity);

    if (loading) return (
        <div className="container mt-4" style={{ paddingTop: '70px' }}>
            <div className="text-center my-5"><div className="spinner-border" role="status" /></div>
        </div>
    );

    return (
        <div className="container mt-4" style={{ paddingTop: '70px' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3>Man išduoti daiktai</h3>
                    <p className="text-muted mb-0">Daiktai, kurie šiuo metu yra pas jus</p>
                </div>
            </div>

            {movements.length === 0 ? (
                <div className="alert alert-info">Jums šiuo metu nėra išduota daiktų.</div>
            ) : (
                <div className="row">
                    {movements.map(m => {
                        const item = m.item_variant?.item;
                        const variant = m.item_variant;
                        const max = getMaxReturnable(m);

                        return (
                            <div className="col-md-6 col-lg-4 mb-3" key={m.id}>
                                <div className="card h-100">
                                    <div className="card-body">
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                            <div>
                                                <h6 className="mb-0">{item?.name || '—'}</h6>
                                                <small className="text-muted">
                                                    <code>{variant?.sku}</code>
                                                    {variant?.size && <span className="ms-1 badge bg-secondary">{variant.size}</span>}
                                                </small>
                                            </div>
                                            <span className="badge bg-primary fs-6">{m.quantity} {item?.unit_of_measure}</span>
                                        </div>

                                        <div className="text-muted small mb-1">
                                            <span>Kodas: </span><code>{item?.code}</code>
                                        </div>

                                        {m.stock_batch?.batch_number && (
                                            <div className="text-muted small mb-1">
                                                Partija: <code>{m.stock_batch.batch_number}</code>
                                            </div>
                                        )}

                                        <div className="text-muted small mb-2">
                                            Išduota: {formatDate(m.movement_date)}
                                        </div>

                                        {m.reason && (
                                            <div className="text-muted small mb-2">
                                                Priežastis: {m.reason}
                                            </div>
                                        )}
                                    </div>

                                    <div className="card-footer bg-transparent">
                                        {m.item_variant?.item?.is_expirable ? (
                                            <div className="text-muted small text-center py-1">
                                                Suvartojamas — negrąžinama
                                            </div>
                                        ) : (
                                            <button
                                                className="btn btn-sm btn-outline-success w-100"
                                                onClick={() => setReturning({
                                                    movement: m,
                                                    quantity: getMaxReturnable(m),
                                                    reason: '',
                                                })}
                                            >
                                                ↩ Grąžinti
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Grąžinimo modal */}
            {returning && (
                <div className="modal d-block" tabIndex="-1" style={{background: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                            <h5 className="modal-title">Grąžinti daiktą</h5>
                                <button className="btn-close" onClick={() => setReturning(null)} />
                            </div>

                            <div className="modal-body">
                                <div className="alert alert-light border mb-3">
                                    <strong>{returning.movement.item_variant?.item?.name}</strong>
                                    {returning.movement.item_variant?.size && (
                                        <span className="badge bg-secondary ms-2">{returning.movement.item_variant.size}</span>
                                    )}
                                    <div className="text-muted small mt-1">
                                        Išduota: {parseFloat(returning.movement.quantity)} vnt.
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Grąžinamas kiekis *</label>
                                    <input
                                        type="number"
                                        step="0.001"
                                        min="0.001"
                                        max={getMaxReturnable(returning.movement)}
                                        className="form-control"
                                        value={returning.quantity}
                                        onChange={e => setReturning(prev => ({ ...prev, quantity: e.target.value }))}
                                    />
                                    <div className="form-text">
                                        Maks. galima grąžinti: {getMaxReturnable(returning.movement)}
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Grąžinimo priežastis</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Pratybos pasibaigė, nereikalinga..."
                                        value={returning.reason}
                                        onChange={e => setReturning(prev => ({ ...prev, reason: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setReturning(null)}>
                                    Atšaukti
                                </button>
                                <button
                                    className="btn btn-success"
                                    onClick={handleReturnSubmit}
                                    disabled={submitting || !returning.quantity || parseFloat(returning.quantity) <= 0}
                                >
                                    {submitting ? 'Registruojama...' : 'Patvirtinti grąžinimą'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserIssuedItemsView;