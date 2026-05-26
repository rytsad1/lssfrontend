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

const ORDERS_PAGE_SIZE = 10;
const ITEMS_PAGE_SIZE  = 20;
const CONSUM_PAGE_SIZE = 10;

const Pagination = ({ page, total, pageSize, onPage }) => {
    const totalPages = Math.ceil(total / pageSize);
    if (totalPages <= 1) return null;
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
        .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
        .reduce((acc, p, i, arr) => {
            if (i > 0 && p - arr[i - 1] > 1) acc.push('...');
            acc.push(p);
            return acc;
        }, []);
    return (
        <div className="d-flex justify-content-between align-items-center px-3 py-2 border-top bg-white">
            <small className="text-muted">
                {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} iš {total}
            </small>
            <ul className="pagination pagination-sm mb-0">
                <li className={`page-item ${page <= 1 ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => onPage(p => p - 1)}>‹</button>
                </li>
                {pages.map((p, i) => p === '...'
                    ? <li key={`e${i}`} className="page-item disabled"><span className="page-link">…</span></li>
                    : <li key={p} className={`page-item ${p === page ? 'active' : ''}`}>
                        <button className="page-link" onClick={() => onPage(p)}>{p}</button>
                    </li>
                )}
                <li className={`page-item ${page >= totalPages ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => onPage(p => p + 1)}>›</button>
                </li>
            </ul>
        </div>
    );
};

const MyOrdersView = () => {
    const [orders, setOrders]               = useState([]);
    const [issuedItems, setIssuedItems]     = useState([]);
    const [loading, setLoading]             = useState(true);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [showReturnModal, setShowReturnModal]   = useState(false);
    const [selectedMovement, setSelectedMovement] = useState(null);
    const [returnForm, setReturnForm] = useState({ quantity: '', reason: '', comment: '' });
    const [submitting, setSubmitting] = useState(false);

    const [orderPage, setOrderPage]     = useState(1);
    const [orderFilter, setOrderFilter] = useState({ type: '', status: '', search: '' });

    const [itemPage, setItemPage]         = useState(1);
    const [itemSearch, setItemSearch]     = useState('');
    const [itemDateFrom, setItemDateFrom] = useState('');
    const [itemDateTo, setItemDateTo]     = useState('');

    const [consumPage, setConsumPage]     = useState(1);
    const [consumSearch, setConsumSearch] = useState('');

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
        } catch (e) {
            if (e.response?.status !== 403) {
                toast.error('Klaida kraunant užklausas');
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchIssuedItems = async (uid) => {
        const userId = uid ?? currentUserId;
        if (!userId) return;
        try {
            const [r1, r2, ordersRes] = await Promise.all([
                axios.get('/v2/inventory/movements', {
                    params: { legacy_user_id: userId, movement_type: 'issue' }
                }),
                axios.get('/v2/inventory/movements', {
                    params: { legacy_user_id: userId, movement_type: 'temporary_issue' }
                }),
                axios.get('/v2/inventory/orders'),
            ]);
            const all = [
                ...(r1.data.data || []),
                ...(r2.data.data || []),
            ];
            all.sort((a, b) => new Date(b.movement_date) - new Date(a.movement_date));
            const pendingIds = new Set(
                (ordersRes.data.data || ordersRes.data || [])
                    .filter(o =>
                        o.order_type === 'return' &&
                        ['waiting', 'confirmed', 'completed'].includes(o.status)
                    )
                    .map(o => o.source_movement_id)
                    .filter(Boolean)
            );
            setIssuedItems(all.filter(m => !pendingIds.has(m.id)));
        } catch {}
    };

    const openReturnModal = (movement) => {
        setSelectedMovement(movement);
        setReturnForm({ quantity: parseFloat(movement.quantity), reason: '', comment: '' });
        setShowReturnModal(true);
    };

    const handleReturnSubmit = async () => {
        if (!returnForm.quantity || parseFloat(returnForm.quantity) <= 0) {
            toast.error('Įvesk kiekį'); return;
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
            setIssuedItems(prev => prev.filter(m => m.id !== selectedMovement.id));
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

    // Daiktų filtravimas
    const allReturnableItems  = issuedItems.filter(m => !m.item_variant?.item?.is_expirable);
    const allConsumableItems  = issuedItems.filter(m =>  m.item_variant?.item?.is_expirable);

    const filteredReturnableItems = allReturnableItems.filter(m => {
        const name = m.item_variant?.item?.name?.toLowerCase() || '';
        const sku  = m.item_variant?.sku?.toLowerCase() || '';
        if (itemSearch && !name.includes(itemSearch.toLowerCase()) && !sku.includes(itemSearch.toLowerCase())) return false;
        if (itemDateFrom && new Date(m.movement_date) < new Date(itemDateFrom)) return false;
        if (itemDateTo   && new Date(m.movement_date) > new Date(itemDateTo + 'T23:59:59')) return false;
        return true;
    });

    const filteredConsumableItems = allConsumableItems.filter(m => {
        const name = m.item_variant?.item?.name?.toLowerCase() || '';
        const sku  = m.item_variant?.sku?.toLowerCase() || '';
        if (consumSearch && !name.includes(consumSearch.toLowerCase()) && !sku.includes(consumSearch.toLowerCase())) return false;
        return true;
    });

    const pagedItems  = filteredReturnableItems.slice((itemPage - 1) * ITEMS_PAGE_SIZE, itemPage * ITEMS_PAGE_SIZE);
    const pagedConsum = filteredConsumableItems.slice((consumPage - 1) * CONSUM_PAGE_SIZE, consumPage * CONSUM_PAGE_SIZE);

    // Užklausų filtravimas
    const filteredOrders = orders.filter(o => {
        const item = o.item_variant?.item || o.source_movement?.item_variant?.item;
        if (orderFilter.type   && o.order_type !== orderFilter.type)   return false;
        if (orderFilter.status && o.status     !== orderFilter.status) return false;
        if (orderFilter.search) {
            const s = orderFilter.search.toLowerCase();
            if (!item?.name?.toLowerCase().includes(s) && !o.reason?.toLowerCase().includes(s)) return false;
        }
        return true;
    });

    const pagedOrders = filteredOrders.slice(
        (orderPage - 1) * ORDERS_PAGE_SIZE,
        orderPage * ORDERS_PAGE_SIZE
    );

    const handleOrderFilterChange = (field, value) => {
        setOrderFilter(prev => ({ ...prev, [field]: value }));
        setOrderPage(1);
    };

    return (
        <div className="container-fluid mt-4" style={{ paddingTop: '70px' }}>
            <h3 className="mb-4">Mano daiktai ir užklausos</h3>

            <div className="row g-4 align-items-start">

                {/* KAIRĖ — Grąžintini daiktai */}
                <div className="col-md-5">
                    <div className="card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <strong>Mano turimi daiktai</strong>
                            <span className="badge bg-primary">{filteredReturnableItems.length}</span>
                        </div>

                        <div className="border-bottom py-2 px-3">
                            <div className="row g-2">
                                <div className="col-12">
                                    <input
                                        type="text"
                                        className="form-control form-control-sm"
                                        placeholder="Paieška pagal pavadinimą, SKU..."
                                        value={itemSearch}
                                        onChange={e => { setItemSearch(e.target.value); setItemPage(1); }}
                                    />
                                </div>
                                <div className="col-6">
                                    <label className="form-label form-label-sm mb-1 text-muted">Nuo</label>
                                    <input
                                        type="date"
                                        className="form-control form-control-sm"
                                        value={itemDateFrom}
                                        onChange={e => { setItemDateFrom(e.target.value); setItemPage(1); }}
                                    />
                                </div>
                                <div className="col-6">
                                    <label className="form-label form-label-sm mb-1 text-muted">Iki</label>
                                    <input
                                        type="date"
                                        className="form-control form-control-sm"
                                        value={itemDateTo}
                                        onChange={e => { setItemDateTo(e.target.value); setItemPage(1); }}
                                    />
                                </div>
                                {(itemSearch || itemDateFrom || itemDateTo) && (
                                    <div className="col-12">
                                        <button
                                            className="btn btn-sm btn-outline-secondary w-100"
                                            onClick={() => { setItemSearch(''); setItemDateFrom(''); setItemDateTo(''); setItemPage(1); }}
                                        >
                                            Išvalyti filtrus
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="card-body p-0">
                            {!currentUserId ? (
                                <div className="p-3 text-center"><div className="spinner-border spinner-border-sm" /></div>
                            ) : filteredReturnableItems.length === 0 ? (
                                <div className="p-3 text-muted small">
                                    {itemSearch || itemDateFrom || itemDateTo
                                        ? 'Nėra daiktų pagal filtrus.'
                                        : 'Šiuo metu jums nėra išduota daiktų.'}
                                </div>
                            ) : (
                                <>
                                    <div className="table-responsive">
                                        <table className="table table-sm table-hover mb-0">
                                            <thead className="table-light">
                                            <tr>
                                                <th>Daiktas</th>
                                                <th className="text-end">Kiekis</th>
                                                <th>Išduota</th>
                                                <th></th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {pagedItems.map(m => (
                                                <tr key={m.id}>
                                                    <td>
                                                        <div>
                                                            <strong>{m.item_variant?.item?.name || '—'}</strong>
                                                            {m.movement_type === 'temporary_issue' && (
                                                                <span className="badge bg-warning text-dark ms-1 small">Laikinas</span>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <code className="small">{m.item_variant?.sku}</code>
                                                            {m.item_variant?.size && (
                                                                <span className="badge bg-secondary ms-1">{m.item_variant.size}</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="text-end fw-bold align-middle">
                                                        {m.quantity}
                                                        <div className="small text-muted">{m.item_variant?.item?.unit_of_measure}</div>
                                                    </td>
                                                    <td className="small text-muted align-middle">{formatDate(m.movement_date)}</td>
                                                    <td className="align-middle">
                                                        <button className="btn btn-sm btn-outline-success" onClick={() => openReturnModal(m)}>↩</button>
                                                    </td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <Pagination page={itemPage} total={filteredReturnableItems.length} pageSize={ITEMS_PAGE_SIZE} onPage={setItemPage} />
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* DEŠINĖ — Užklausos + Suvartojami */}
                <div className="col-md-7">

                    {/* Užklausų istorija */}
                    <div className="card mb-3">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <strong>Mano užklausų istorija</strong>
                            <span className="badge bg-secondary">{filteredOrders.length}</span>
                        </div>

                        <div className="border-bottom py-2 px-3">
                            <div className="row g-2">
                                <div className="col-md-4">
                                    <input
                                        type="text"
                                        className="form-control form-control-sm"
                                        placeholder="Paieška..."
                                        value={orderFilter.search}
                                        onChange={e => handleOrderFilterChange('search', e.target.value)}
                                    />
                                </div>
                                <div className="col-md-4">
                                    <select className="form-select form-select-sm" value={orderFilter.type} onChange={e => handleOrderFilterChange('type', e.target.value)}>
                                        <option value="">Visi tipai</option>
                                        {Object.entries(TYPE_LABELS).map(([k, v]) => (
                                            <option key={k} value={k}>{v}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md-4">
                                    <select className="form-select form-select-sm" value={orderFilter.status} onChange={e => handleOrderFilterChange('status', e.target.value)}>
                                        <option value="">Visi statusai</option>
                                        {Object.entries(STATUS_LABELS).map(([k, v]) => (
                                            <option key={k} value={k}>{v.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {loading ? (
                            <div className="p-3 text-center"><div className="spinner-border spinner-border-sm" /></div>
                        ) : filteredOrders.length === 0 ? (
                            <div className="p-3 text-muted">Užklausų nėra.</div>
                        ) : (
                            <>
                                <div className="table-responsive" style={{ maxHeight: '380px', overflowY: 'auto' }}>
                                    <table className="table table-sm table-hover mb-0">
                                        <thead className="table-light" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
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
                                        {pagedOrders.map(o => {
                                            const item = o.item_variant?.item || o.source_movement?.item_variant?.item;
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
                                                    <td><span className={`badge bg-${s.cls}`}>{s.label}</span></td>
                                                    <td className="small text-muted">{formatDate(o.requested_at)}</td>
                                                    <td className="small text-muted">{o.admin_note || '—'}</td>
                                                </tr>
                                            );
                                        })}
                                        </tbody>
                                    </table>
                                </div>
                                <Pagination page={orderPage} total={filteredOrders.length} pageSize={ORDERS_PAGE_SIZE} onPage={setOrderPage} />
                            </>
                        )}
                    </div>

                    {/* Suvartojami daiktai */}
                    {allConsumableItems.length > 0 && (
                        <div className="card">
                            <div className="card-header d-flex justify-content-between align-items-center">
                                <div>
                                    <strong>Išduoti suvartojami daiktai</strong>
                                    <div className="small text-muted fw-normal">Automatiškai nurašyti — grąžinimo nereikia</div>
                                </div>
                                <span className="badge bg-secondary">{filteredConsumableItems.length}</span>
                            </div>

                            <div className="border-bottom py-2 px-3">
                                <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    placeholder="Paieška pagal pavadinimą, SKU..."
                                    value={consumSearch}
                                    onChange={e => { setConsumSearch(e.target.value); setConsumPage(1); }}
                                />
                            </div>

                            <div className="card-body p-0">
                                {filteredConsumableItems.length === 0 ? (
                                    <div className="p-3 text-muted small">Nėra rezultatų.</div>
                                ) : (
                                    <>
                                        <div className="table-responsive">
                                            <table className="table table-sm mb-0">
                                                <thead className="table-light">
                                                <tr>
                                                    <th>Daiktas</th>
                                                    <th className="text-end">Kiekis</th>
                                                    <th>Išduota</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {pagedConsum.map(m => (
                                                    <tr key={m.id} className="text-muted">
                                                        <td>
                                                            <div className="small">{m.item_variant?.item?.name || '—'}</div>
                                                            <code className="small">{m.item_variant?.sku}</code>
                                                        </td>
                                                        <td className="text-end small">{m.quantity}</td>
                                                        <td className="small">{formatDate(m.movement_date)}</td>
                                                    </tr>
                                                ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        <Pagination page={consumPage} total={filteredConsumableItems.length} pageSize={CONSUM_PAGE_SIZE} onPage={setConsumPage} />
                                    </>
                                )}
                            </div>
                        </div>
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
                                        <span className="badge bg-secondary ms-2">{selectedMovement.item_variant.size}</span>
                                    )}
                                    <div className="text-muted small mt-1">
                                        Išduota: {parseFloat(selectedMovement.quantity)} vnt.
                                        · {formatDate(selectedMovement.movement_date)}
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Grąžinamas kiekis *</label>
                                    <input
                                        type="number" step="0.001" min="0.001"
                                        max={parseFloat(selectedMovement.quantity)}
                                        className="form-control"
                                        value={returnForm.quantity}
                                        onChange={e => setReturnForm(p => ({ ...p, quantity: e.target.value }))}
                                    />
                                    <div className="form-text">Maks.: {parseFloat(selectedMovement.quantity)} vnt.</div>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Priežastis</label>
                                    <input
                                        type="text" className="form-control"
                                        placeholder="Pratybos pasibaigė..."
                                        value={returnForm.reason}
                                        onChange={e => setReturnForm(p => ({ ...p, reason: e.target.value }))}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Papildomas komentaras</label>
                                    <textarea
                                        className="form-control" rows="2"
                                        placeholder="Daiktas šiek tiek susidėvėjęs..."
                                        value={returnForm.comment}
                                        onChange={e => setReturnForm(p => ({ ...p, comment: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setShowReturnModal(false)}>Atšaukti</button>
                                <button className="btn btn-success" onClick={handleReturnSubmit} disabled={submitting}>
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