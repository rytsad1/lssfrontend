import React, { useEffect, useState } from 'react';
import axios from '../../axios';
import { Link } from 'react-router-dom';

const severityClass = {
    low: 'secondary',
    medium: 'warning',
    high: 'danger',
    critical: 'danger',
};

const severityLabel = {
    low: 'Žemas',
    medium: 'Vidutinis',
    high: 'Aukštas',
    critical: 'Kritinis',
};

const typeLabels = {
    frequent_writeoffs: 'Dažni nurašymai',
    large_writeoff:     'Didelis nurašymas',
    sudden_drop:        'Staigus kritimas',
    expired_stock:      'Pasibaigęs galiojimas',
    asset_mismatch:     'Turto neatitikimas',
};

const AnomalyListView = () => {
    const [anomalies, setAnomalies]   = useState([]);
    const [stats, setStats]           = useState(null);
    const [loading, setLoading]       = useState(true);
    const [scanning, setScanning]     = useState(false);
    const [error, setError]           = useState('');
    const [selected, setSelected]     = useState(null);

    const [filters, setFilters] = useState({
        severity: '',
        resolved: '',
    });

    const fetchStats = async () => {
        try {
            const res = await axios.get('/v2/inventory/anomalies/stats');
            setStats(res.data.data);
        } catch {}
    };

    const fetchAnomalies = async () => {
        setLoading(true);
        setError('');
        try {
            const params = {};
            if (filters.severity) params.severity = filters.severity;
            if (filters.resolved !== '') params.is_resolved = filters.resolved;

            const res = await axios.get('/v2/inventory/anomalies', { params });
            setAnomalies(res.data.data || []);
        } catch (e) {
            setError(e.response?.data?.message || 'Klaida kraunant anomalijas');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnomalies();
        fetchStats();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters]);

    const runScan = async () => {
        setScanning(true);
        try {
            const res = await axios.post('/v2/inventory/anomalies/scan');
            const d = res.data.data;
            const total = Object.values(d).reduce((s, v) => s + (v?.created ?? 0), 0);
            alert(`Skenavimas baigtas. Rasta naujų: ${total}`);
            fetchAnomalies();
            fetchStats();
        } catch {
            alert('Klaida skenavimo metu');
        } finally {
            setScanning(false);
        }
    };

    const resolveAnomaly = async (id) => {
        try {
            await axios.post(`/v2/inventory/anomalies/${id}/resolve`, { is_resolved: true });
            setSelected(null);
            fetchAnomalies();
            fetchStats();
        } catch {
            alert('Klaida sprendžiant anomaliją');
        }
    };

    const renderActionLinks = (a) => {
        const d = a.details || {};
        return (
            <div className="d-flex gap-1 flex-wrap">
                {a.anomaly_type === 'large_writeoff' && (
                    <>
                        {d.movement_id && (
                            <Link to={`/v2/movements`} className="btn btn-sm btn-outline-primary">
                                Judėjimas #{d.movement_id}
                            </Link>
                        )}
                        {d.batch_id && (
                            <Link to={`/v2/batches`} className="btn btn-sm btn-outline-secondary">
                                Partija #{d.batch_id}
                            </Link>
                        )}
                    </>
                )}
                {a.anomaly_type === 'expired_stock' && d.batch_id && (
                    <Link to={`/v2/batches`} className="btn btn-sm btn-outline-warning">
                        Partija #{d.batch_id}
                    </Link>
                )}
                {a.anomaly_type === 'asset_mismatch' && d.asset_id && (
                    <Link to={`/v2/asset-units`} className="btn btn-sm btn-outline-dark">
                        Turtas #{d.asset_id} {d.inventory_number && `(${d.inventory_number})`}
                    </Link>
                )}
            </div>
        );
    };

    const renderDetails = (a) => {
        const d = a.details || {};
        switch (a.anomaly_type) {
            case 'frequent_writeoffs':
                return (
                    <div>
                        <div>Per <strong>{d.days} d.</strong> nurašyta <strong>{d.count} kartus</strong></div>
                        <div className="text-muted small">Rekomenduojama: fizinis inventoriaus patikrinimas</div>
                    </div>
                );
            case 'large_writeoff':
                return (
                    <div>
                        <div>Nurašyta <strong>{d.ratio ? (d.ratio * 100).toFixed(1) : '?'}%</strong> partijos</div>
                        {d.movement_id && <div className="text-muted small">Movement ID: {d.movement_id}</div>}
                        {d.batch_id    && <div className="text-muted small">Batch ID: {d.batch_id}</div>}
                    </div>
                );
            case 'sudden_drop':
                return (
                    <div>
                        <div>Likutis krito <strong>{d.ratio ? (d.ratio * 100).toFixed(1) : '?'}%</strong></div>
                        {d.out != null && <div className="text-muted small">Išėjo: {d.out} vnt.</div>}
                    </div>
                );
            case 'expired_stock':
                return (
                    <div>
                        <div>Liko <strong>{d.remaining}</strong> vnt. su pasibaigusiu galiojimu</div>
                        {d.batch_id && <div className="text-muted small">Batch ID: {d.batch_id}</div>}
                    </div>
                );
            case 'asset_mismatch':
                return (
                    <div>
                        <div>Turtas <strong>{d.inventory_number || `#${d.asset_id}`}</strong> pažymėtas „sandėlyje", bet turi išdavimo istoriją</div>
                    </div>
                );
            default:
                return <pre className="small mb-0">{JSON.stringify(d, null, 2)}</pre>;
        }
    };

    return (
        <div className="container-fluid mt-4" style={{ paddingTop: '70px' }}>

            {/* HEADER */}
            <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                    <h3>Anomalijos</h3>
                    <p className="text-muted mb-0">Atsargų neatitikimų analizė</p>
                </div>
                <button
                    className="btn btn-danger"
                    onClick={runScan}
                    disabled={scanning}
                >
                    {scanning ? (
                        <><span className="spinner-border spinner-border-sm me-1" />Skenuojama...</>
                    ) : (
                        '🔍 Skenuoti'
                    )}
                </button>
            </div>

            {/* STATS */}
            {stats && (
                <div className="row mb-3 g-2">
                    {[
                        { label: 'Atviros',   value: stats.open,     cls: 'primary' },
                        { label: 'Kritinės',  value: stats.critical, cls: 'danger' },
                        { label: 'Įspėjimai', value: stats.warning,  cls: 'warning' },
                        { label: 'Per 24h',   value: stats.last_24h, cls: 'secondary' },
                        { label: 'Per 7d',    value: stats.last_7d,  cls: 'secondary' },
                        { label: 'Išspręstos',value: stats.resolved, cls: 'success' },
                    ].map(({ label, value, cls }) => (
                        <div className="col-6 col-md-2" key={label}>
                            <div className={`card border-${cls} text-center py-2`}>
                                <div className={`fs-4 fw-bold text-${cls}`}>{value ?? 0}</div>
                                <div className="small text-muted">{label}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* FILTERS */}
            <div className="card mb-3">
                <div className="card-body py-2">
                    <div className="row g-2">
                        <div className="col-md-3">
                            <select
                                className="form-select form-select-sm"
                                value={filters.severity}
                                onChange={(e) => setFilters(f => ({ ...f, severity: e.target.value }))}
                            >
                                <option value="">Visi lygiai</option>
                                <option value="low">Žemas</option>
                                <option value="medium">Vidutinis</option>
                                <option value="critical">Kritinis</option>
                            </select>
                        </div>
                        <div className="col-md-3">
                            <select
                                className="form-select form-select-sm"
                                value={filters.resolved}
                                onChange={(e) => setFilters(f => ({ ...f, resolved: e.target.value }))}
                            >
                                <option value="">Visi</option>
                                <option value="false">Tik atviros</option>
                                <option value="true">Tik išspręstos</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* TABLE */}
            {loading ? (
                <div className="text-center my-5">
                    <div className="spinner-border" role="status" />
                </div>
            ) : error ? (
                <div className="alert alert-danger">{error}</div>
            ) : anomalies.length === 0 ? (
                <div className="alert alert-success">
                    ✅ Anomalijų nerasta pagal pasirinktus filtrus.
                </div>
            ) : (
                <div className="card">
                    <div className="table-responsive">
                        <table className="table table-hover mb-0">
                            <thead className="table-light">
                            <tr>
                                <th>Daiktas</th>
                                <th>Tipas</th>
                                <th style={{ width: '100px' }}>Lygis</th>
                                <th>Aprašymas</th>
                                <th>Detalės</th>
                                <th style={{ width: '200px' }}>Veiksmai</th>
                            </tr>
                            </thead>
                            <tbody>
                            {anomalies.map(a => (
                                <tr key={a.id} className={a.is_resolved ? 'table-light text-muted' : ''}>
                                    <td>
                                        <div><strong>{a.item?.name || '—'}</strong></div>
                                        {a.item?.code && (
                                            <div><code className="small">{a.item.code}</code></div>
                                        )}
                                        {a.item_variant?.size && (
                                            <span className="badge bg-secondary">{a.item_variant.size}</span>
                                        )}
                                    </td>
                                    <td>
                                            <span className="badge bg-light text-dark border">
                                                {typeLabels[a.anomaly_type] || a.anomaly_type}
                                            </span>
                                    </td>
                                    <td>
                                            <span className={`badge bg-${severityClass[a.severity] || 'secondary'}`}>
                                                {severityLabel[a.severity] || a.severity}
                                            </span>
                                    </td>
                                    <td className="small">{a.summary}</td>
                                    <td className="small">{renderDetails(a)}</td>
                                    <td>
                                        <div className="d-flex gap-1 flex-wrap">
                                            <button
                                                className="btn btn-sm btn-outline-info"
                                                onClick={() => setSelected(a)}
                                            >
                                                Plačiau
                                            </button>
                                            {!a.is_resolved && (
                                                <button
                                                    className="btn btn-sm btn-success"
                                                    onClick={() => resolveAnomaly(a.id)}
                                                >
                                                    ✓
                                                </button>
                                            )}
                                            {a.is_resolved && (
                                                <span className="badge bg-success align-self-center">Išspręsta</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* DETAIL MODAL */}
            {selected && (
                <div className="modal d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">

                            <div className="modal-header">
                                <div>
                                    <h5 className="modal-title mb-1">{selected.summary}</h5>
                                    <div className="d-flex gap-2">
                                        <span className={`badge bg-${severityClass[selected.severity]}`}>
                                            {severityLabel[selected.severity]}
                                        </span>
                                        <span className="badge bg-light text-dark border">
                                            {typeLabels[selected.anomaly_type] || selected.anomaly_type}
                                        </span>
                                        {selected.is_resolved && (
                                            <span className="badge bg-success">Išspręsta</span>
                                        )}
                                    </div>
                                </div>
                                <button className="btn-close" onClick={() => setSelected(null)} />
                            </div>

                            <div className="modal-body">
                                <div className="row mb-3">
                                    <div className="col-md-6">
                                        <div className="card bg-light">
                                            <div className="card-body py-2">
                                                <div className="small text-muted">Daiktas</div>
                                                <div className="fw-bold">{selected.item?.name || '—'}</div>
                                                {selected.item?.code && (
                                                    <code className="small">{selected.item.code}</code>
                                                )}
                                                {selected.item_variant && (
                                                    <div className="small text-muted mt-1">
                                                        SKU: {selected.item_variant.sku}
                                                        {selected.item_variant.size && ` | Dydis: ${selected.item_variant.size}`}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="card bg-light">
                                            <div className="card-body py-2">
                                                <div className="small text-muted">Aptikta</div>
                                                <div className="fw-bold">
                                                    {selected.detected_at
                                                        ? new Date(selected.detected_at).toLocaleString('lt-LT')
                                                        : '—'}
                                                </div>
                                                <div className="small text-muted mt-1">
                                                    Score: {selected.score ? parseFloat(selected.score).toFixed(2) : '—'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <h6>Detalės</h6>
                                <div className="border rounded p-3 bg-light mb-3">
                                    {renderDetails(selected)}
                                </div>

                                <h6>Rekomenduojami veiksmai</h6>
                                {renderActionLinks(selected)}
                            </div>

                            <div className="modal-footer">
                                {!selected.is_resolved && (
                                    <button
                                        className="btn btn-success"
                                        onClick={() => resolveAnomaly(selected.id)}
                                    >
                                        ✓ Pažymėti kaip išspręstą
                                    </button>
                                )}
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setSelected(null)}
                                >
                                    Uždaryti
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnomalyListView;