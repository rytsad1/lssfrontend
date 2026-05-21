import React, { useState, useEffect, useCallback } from 'react';
import axios from '../../axios';
import { Link } from 'react-router-dom';

const MOVEMENT_TYPES = [
    { value: '', label: 'Visi' },
    { value: 'initial_load', label: 'Pradinis įkėlimas' },
    { value: 'issue', label: 'Išdavimas' },
    { value: 'temporary_issue', label: 'Laikinas išdavimas' },
    { value: 'return', label: 'Grąžinimas' },
    { value: 'temporary_return', label: 'Laikinas grąžinimas' },
    { value: 'writeoff', label: 'Nurašymas' },
    { value: 'adjustment', label: 'Koregavimas' },
];

const TYPE_BADGES = {
    initial_load:     { cls: 'bg-secondary', label: 'Pradinis įkėlimas' },
    issue:            { cls: 'bg-danger',    label: 'Išdavimas' },
    temporary_issue:  { cls: 'bg-warning text-dark', label: 'Laikinas išdavimas' },
    return:           { cls: 'bg-success',   label: 'Grąžinimas' },
    temporary_return: { cls: 'bg-info text-dark', label: 'Laikinas grąžinimas' },
    writeoff:         { cls: 'bg-dark',      label: 'Nurašymas' },
    adjustment:       { cls: 'bg-primary',   label: 'Koregavimas' },
};

const InventoryMovementsView = () => {
    const [movements, setMovements] = useState([]);
    const [meta, setMeta] = useState(null);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);

    const [filters, setFilters] = useState({
        movement_type: '',
        item_variant_id: '',
    });

    const fetchMovements = useCallback(async (currentPage = 1, currentFilters = filters) => {
        setLoading(true);
        try {
            const params = { page: currentPage };
            if (currentFilters.movement_type) params.movement_type = currentFilters.movement_type;
            if (currentFilters.item_variant_id) params.item_variant_id = currentFilters.item_variant_id;

            const res = await axios.get('/v2/inventory/movements', { params });
            setMovements(res.data.data || []);
            setMeta(res.data.meta || null);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchMovements(page, filters);
    }, [page]);

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        fetchMovements(1, filters);
    };

    const handleReset = () => {
        const cleared = { movement_type: '', item_variant_id: '' };
        setFilters(cleared);
        setPage(1);
        fetchMovements(1, cleared);
    };

    const badge = (type) => {
        const b = TYPE_BADGES[type];
        return b
            ? <span className={`badge ${b.cls}`}>{b.label}</span>
            : <span className="badge bg-secondary">{type}</span>;
    };

    const formatDate = (dt) => {
        if (!dt) return '—';
        return new Date(dt).toLocaleString('lt-LT', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit',
        });
    };

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h3>Judėjimų istorija</h3>
                <Link to="/v2/stock" className="btn btn-outline-secondary">Likučiai</Link>
            </div>

            {/* Filtrai */}
            <div className="card mb-3">
                <div className="card-body py-2">
                    <form className="row g-2 align-items-end" onSubmit={handleSearch}>
                        <div className="col-auto">
                            <label className="form-label small mb-1">Tipas</label>
                            <select
                                className="form-select form-select-sm"
                                value={filters.movement_type}
                                onChange={e => handleFilterChange('movement_type', e.target.value)}
                            >
                                {MOVEMENT_TYPES.map(t => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-auto">
                            <label className="form-label small mb-1">Varianto ID</label>
                            <input
                                type="number"
                                className="form-control form-control-sm"
                                style={{ width: '120px' }}
                                placeholder="pvz. 3"
                                value={filters.item_variant_id}
                                onChange={e => handleFilterChange('item_variant_id', e.target.value)}
                            />
                        </div>
                        <div className="col-auto">
                            <button type="submit" className="btn btn-sm btn-primary">Filtruoti</button>
                        </div>
                        <div className="col-auto">
                            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={handleReset}>
                                Išvalyti
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Lentelė */}
            {loading ? (
                <div className="text-center py-5 text-muted">Kraunama...</div>
            ) : movements.length === 0 ? (
                <div className="alert alert-info">Judėjimų nerasta.</div>
            ) : (
                <>
                    <div className="table-responsive">
                        <table className="table table-sm table-bordered table-hover">
                            <thead className="table-light">
                            <tr>
                                <th style={{width: '60px'}}>ID</th>
                                <th>Daiktas</th>
                                <th>SKU / Variantas</th>
                                <th style={{width: '170px'}}>Tipas</th>
                                <th style={{width: '90px'}} className="text-end">Kiekis</th>
                                <th style={{width: '80px'}}>Partija</th>
                                <th>Priežastis</th>
                                <th style={{width: '140px'}}>Data</th>
                                <th style={{width: '140px'}}>Naudotojas</th>
                            </tr>
                            </thead>
                            <tbody>
                            {movements.map(m => (
                                <tr key={m.id}>
                                    <td className="text-muted small">{m.id}</td>
                                    <td>
                                        {m.item_variant?.item
                                            ? <><strong>{m.item_variant.item.name}</strong> <code
                                                className="small">{m.item_variant.item.code}</code></>
                                            : <span className="text-muted">—</span>
                                        }
                                    </td>
                                    <td>
                                        <code className="small">{m.item_variant?.sku || '—'}</code>
                                    </td>
                                    <td>{badge(m.movement_type)}</td>
                                    <td className="text-end">
                                            <span className={parseFloat(m.quantity) < 0 ? 'text-danger' : ''}>
                                                {m.quantity}
                                            </span>
                                    </td>
                                    <td className="small text-muted">
                                        {m.stock_batch?.batch_number || (m.stock_batch_id ? `#${m.stock_batch_id}` : '—')}
                                    </td>
                                    <td className="small">{m.reason || '—'}</td>
                                    <td className="small text-muted">{formatDate(m.movement_date)}</td>
                                    <td className="small">
                                        {m.legacy_user
                                            ? m.legacy_user.name
                                            : m.legacy_user_id
                                                ? <span className="text-muted">#{m.legacy_user_id}</span>
                                                : '—'
                                        }
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {meta && meta.last_page > 1 && (
                        <div className="d-flex justify-content-between align-items-center mt-2">
                            <small className="text-muted">
                                Rodoma {meta.from}–{meta.to} iš {meta.total}
                            </small>
                            <ul className="pagination pagination-sm mb-0">
                                <li className={`page-item ${page <= 1 ? 'disabled' : ''}`}>
                                    <button className="page-link" onClick={() => setPage(p => p - 1)}>‹</button>
                                </li>
                                {Array.from({ length: meta.last_page }, (_, i) => i + 1)
                                    .filter(p => p === 1 || p === meta.last_page || Math.abs(p - page) <= 2)
                                    .reduce((acc, p, i, arr) => {
                                        if (i > 0 && p - arr[i - 1] > 1) acc.push('...');
                                        acc.push(p);
                                        return acc;
                                    }, [])
                                    .map((p, i) =>
                                        p === '...'
                                            ? <li key={`ellipsis-${i}`} className="page-item disabled"><span className="page-link">…</span></li>
                                            : <li key={p} className={`page-item ${p === page ? 'active' : ''}`}>
                                                <button className="page-link" onClick={() => setPage(p)}>{p}</button>
                                            </li>
                                    )
                                }
                                <li className={`page-item ${page >= meta.last_page ? 'disabled' : ''}`}>
                                    <button className="page-link" onClick={() => setPage(p => p + 1)}>›</button>
                                </li>
                            </ul>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default InventoryMovementsView;