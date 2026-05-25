import React, { useEffect, useState } from 'react';
import axios from '../../axios';
import { toast } from 'react-toastify';

const STATUS_LABELS = {
    waiting:   { label: 'Laukiama',  cls: 'warning'  },
    completed: { label: 'Atlikta',   cls: 'success'  },
    canceled:  { label: 'Atmesta',   cls: 'danger'   },
    confirmed: { label: 'Vykdoma',   cls: 'info'     },
};

const TYPE_LABELS = {
    issue:           'Išdavimas',
    return:          'Grąžinimas',
    temporary_issue: 'Laikinas išdavimas',
};

const WRITEOFF_TYPES = [
    { value: 'damage',  label: 'Sugadinta' },
    { value: 'loss',    label: 'Pamesta'   },
    { value: 'expired', label: 'Pasibaigė galiojimas' },
    { value: 'other',   label: 'Kita'      },
];

const WarehouseOrdersView = () => {
    const [orders, setOrders]               = useState([]);
    const [loading, setLoading]             = useState(true);
    const [filter, setFilter]               = useState('waiting');
    const [selected, setSelected]           = useState(null);
    const [adminNote, setAdminNote]         = useState('');
    const [submitting, setSubmitting]       = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);

    const [doWriteoff, setDoWriteoff]         = useState(false);
    const [writeoffType, setWriteoffType]     = useState('damage');
    const [writeoffReason, setWriteoffReason] = useState('');
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        axios.get('/v1/me')
            .then(res => {
                setCurrentUserId(res.data.id_User);
                setCurrentUser(res.data);
            })
            .catch(() => {});
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filter) params.status = filter;
            const res = await axios.get('/v2/inventory/orders', { params });
            setOrders(res.data.data || res.data || []);
        } catch {
            toast.error('Klaida kraunant užklausas');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchOrders(); }, [filter]);

    const closeModal = () => {
        setSelected(null);
        setAdminNote('');
        setDoWriteoff(false);
        setWriteoffType('damage');
        setWriteoffReason('');
    };

    const handleCancel = async () => {
        if (!window.confirm('Atmesti šią užklausą?')) return;
        setSubmitting(true);
        try {
            await axios.post(`/v2/inventory/orders/${selected.id}/confirm`, {
                action:     'cancel',
                admin_note: adminNote || null,
            });
            toast.success('Užklausa atmesta.');
            closeModal();
            fetchOrders();
        } catch (e) {
            toast.error(e.response?.data?.error || e.response?.data?.message || 'Klaida');
        } finally {
            setSubmitting(false);
        }
    };

    const handleConfirm = async () => {
        if (!window.confirm(
            doWriteoff
                ? 'Patvirtinti grąžinimą ir nurašyti daiktą?'
                : `Patvirtinti ${TYPE_LABELS[selected.order_type]?.toLowerCase()} užklausą?`
        )) return;

        if (doWriteoff && !writeoffReason.trim()) {
            toast.error('Įvesk nurašymo priežastį');
            return;
        }

        setSubmitting(true);
        try {
            // 1. Patvirtinti užklausą
            await axios.post(`/v2/inventory/orders/${selected.id}/confirm`, {
                action:     'confirm',
                admin_note: adminNote || (doWriteoff ? 'Grąžinta ir nurašyta' : null),
            });

            // 2. Jei nurašymas — atlikti iškart po grąžinimo
            if (doWriteoff) {
                const variantId = selected.source_movement?.item_variant_id
                    || selected.item_variant_id;

                await axios.post('/v2/inventory/writeoff', {
                    item_variant_id: variantId,
                    quantity:        parseFloat(selected.quantity),
                    reason:          writeoffReason,
                    writeoff_type:   writeoffType,
                    legacy_user_id:  currentUserId ?? null,
                });

                toast.success('Grąžinta ir nurašyta.');
            } else {
                toast.success('Užklausa patvirtinta ir atlikta.');
            }

            closeModal();
            fetchOrders();
        } catch (e) {
            toast.error(e.response?.data?.error || e.response?.data?.message || 'Klaida');
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

    const getItemName = (o) =>
        o.item_variant?.item?.name ||
        o.source_movement?.item_variant?.item?.name || '—';

    const getVariantInfo = (o) =>
        o.item_variant || o.source_movement?.item_variant;

    const waitingCount = orders.filter(o => o.status === 'waiting').length;

    return (
        <div className="container-fluid mt-4" style={{ paddingTop: '70px' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3>Sandėlio užklausos</h3>
                {waitingCount > 0 && (
                    <span className="badge bg-warning text-dark fs-6">
                        {waitingCount} laukia
                    </span>
                )}
            </div>

            {/* Filtrai */}
            <div className="btn-group mb-3">
                {[
                    { value: 'waiting',   label: 'Laukiančios' },
                    { value: 'completed', label: 'Atliktos'    },
                    { value: 'canceled',  label: 'Atmestos'    },
                    { value: '',          label: 'Visos'       },
                ].map(f => (
                    <button
                        key={f.value}
                        className={`btn btn-sm ${filter === f.value ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => setFilter(f.value)}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="text-center my-5"><div className="spinner-border" /></div>
            ) : orders.length === 0 ? (
                <div className="alert alert-info">Nėra užklausų.</div>
            ) : (
                <div className="card">
                    <div className="table-responsive">
                        <table className="table table-hover mb-0">
                            <thead className="table-light">
                            <tr>
                                <th>Naudotojas</th>
                                <th>Tipas</th>
                                <th>Daiktas</th>
                                <th className="text-end">Kiekis</th>
                                <th>Priežastis</th>
                                <th>Pateikta</th>
                                <th>Statusas</th>
                                <th style={{ width: '130px' }}></th>
                            </tr>
                            </thead>
                            <tbody>
                            {orders.map(o => {
                                const v = getVariantInfo(o);
                                const s = STATUS_LABELS[o.status] || { label: o.status, cls: 'secondary' };
                                return (
                                    <tr key={o.id} className={o.status === 'waiting' ? 'table-warning' : ''}>
                                        <td>
                                            <strong>
                                                {o.requested_by?.name ||
                                                    `${o.requested_by?.Name || ''} ${o.requested_by?.Surname || ''}`.trim() ||
                                                    `#${o.requested_by_user_id}`}
                                            </strong>
                                        </td>
                                        <td>
                                                <span className="badge bg-light text-dark border">
                                                    {TYPE_LABELS[o.order_type] || o.order_type}
                                                </span>
                                        </td>
                                        <td>
                                            <div>{getItemName(o)}</div>
                                            {v?.size && <span className="badge bg-secondary">{v.size}</span>}
                                            {v?.sku && <div><code className="small">{v.sku}</code></div>}
                                        </td>
                                        <td className="text-end fw-bold">{o.quantity}</td>
                                        <td className="small text-muted">{o.reason || '—'}</td>
                                        <td className="small text-muted">{formatDate(o.requested_at)}</td>
                                        <td>
                                            <span className={`badge bg-${s.cls}`}>{s.label}</span>
                                        </td>
                                        <td>
                                            {o.status === 'waiting' && (
                                                <button
                                                    className="btn btn-sm btn-primary"
                                                    onClick={() => {
                                                        setSelected(o);
                                                        setAdminNote('');
                                                        setDoWriteoff(false);
                                                        setWriteoffReason('');
                                                        setWriteoffType('damage');
                                                    }}
                                                >
                                                    Peržiūrėti
                                                </button>
                                            )}
                                            {o.status !== 'waiting' && o.admin_note && (
                                                <small className="text-muted">{o.admin_note}</small>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal */}
            {selected && (
                <div className="modal d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">

                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {TYPE_LABELS[selected.order_type]} užklausa
                                </h5>
                                <button className="btn-close" onClick={closeModal} />
                            </div>

                            <div className="modal-body">
                                <div className="row mb-3">
                                    <div className="col-md-6">
                                        <div className="card bg-light">
                                            <div className="card-body py-2">
                                                <div className="small text-muted">Naudotojas</div>
                                                <div className="fw-bold">
                                                    {selected.requested_by?.name ||
                                                        `${selected.requested_by?.Name || ''} ${selected.requested_by?.Surname || ''}`.trim()}
                                                </div>
                                                <div className="small text-muted mt-1">
                                                    Pateikta: {formatDate(selected.requested_at)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="card bg-light">
                                            <div className="card-body py-2">
                                                <div className="small text-muted">Daiktas</div>
                                                <div className="fw-bold">{getItemName(selected)}</div>
                                                {getVariantInfo(selected)?.size && (
                                                    <span className="badge bg-secondary">
                                                        {getVariantInfo(selected).size}
                                                    </span>
                                                )}
                                                <div className="small text-muted mt-1">
                                                    Kiekis: <strong>{selected.quantity}</strong>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {selected.comment && (
                                    <div className="alert alert-light border mb-3">
                                        <strong>Naudotojo komentaras:</strong> {selected.comment}
                                    </div>
                                )}

                                {selected.order_type === 'return' && selected.source_movement && (
                                    <div className="alert alert-info mb-3">
                                        <strong>Originalus išdavimas:</strong>{' '}
                                        {formatDate(selected.source_movement.movement_date)} —{' '}
                                        {selected.source_movement.quantity} vnt.
                                        {selected.source_movement.stock_batch?.batch_number && (
                                            <span> (Partija: {selected.source_movement.stock_batch.batch_number})</span>
                                            )}
                                    </div>
                                )}

                                <div className="mb-3">
                                    <label className="form-label">Sandėlininko pastaba</label>
                                    <textarea
                                        className="form-control"
                                        rows="2"
                                        value={adminNote}
                                        onChange={e => setAdminNote(e.target.value)}
                                        placeholder="Daiktas priimtas, kiekis patikrintas..."
                                    />
                                </div>

                                {/* Nurašymo sekcija — tik grąžinimui */}
                                {selected.order_type === 'return' && (
                                    <div className={`border rounded p-3 ${doWriteoff ? 'border-danger bg-danger bg-opacity-10' : 'border-secondary'}`}>
                                        <div className="form-check mb-2">
                                            <input
                                                type="checkbox"
                                                className="form-check-input"
                                                id="doWriteoff"
                                                checked={doWriteoff}
                                                onChange={e => {
                                                    setDoWriteoff(e.target.checked);
                                                    if (!e.target.checked) setWriteoffReason('');
                                                }}
                                            />
                                            <label htmlFor="doWriteoff" className="form-check-label fw-bold">
                                                ⚠ Grąžinti ir iškart nurašyti
                                                <span className="text-muted fw-normal ms-2 small">
                                                    (daiktas netinkamas naudoti)
                                                </span>
                                            </label>
                                        </div>

                                        {doWriteoff && (
                                            <>
                                                <div className="row g-2 mt-1">
                                                    <div className="col-md-5">
                                                        <label className="form-label form-label-sm">Nurašymo tipas *</label>
                                                        <select
                                                            className="form-select form-select-sm"
                                                            value={writeoffType}
                                                            onChange={e => setWriteoffType(e.target.value)}
                                                        >
                                                            {WRITEOFF_TYPES.map(t => (
                                                                <option key={t.value} value={t.value}>{t.label}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="col-md-7">
                                                        <label className="form-label form-label-sm">Nurašymo priežastis *</label>
                                                        <input
                                                            type="text"
                                                            className="form-control form-control-sm"
                                                            placeholder="Kelnės suplysusios, nebepataisomos..."
                                                            value={writeoffReason}
                                                            onChange={e => setWriteoffReason(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="mt-2 small text-muted">
                                                    Atsakingas: <strong>

                                                    {currentUser?.name || (currentUserId ? `#${currentUserId}` : '—')}
                                                </strong>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="modal-footer">
                                <button
                                    className="btn btn-outline-danger"
                                    onClick={handleCancel}
                                    disabled={submitting}
                                >
                                    ✕ Atmesti
                                </button>
                                <button
                                    className={`btn ${doWriteoff ? 'btn-danger' : 'btn-success'}`}
                                    onClick={handleConfirm}
                                    disabled={submitting || (doWriteoff && !writeoffReason.trim())}
                                >
                                    {submitting ? (
                                        <><span className="spinner-border spinner-border-sm me-1" />Vykdoma...</>
                                    ) : doWriteoff ? (
                                        '⚠ Patvirtinti ir nurašyti'
                                    ) : (
                                        '✓ Patvirtinti'
                                    )}
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WarehouseOrdersView;