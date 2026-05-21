import React, { useEffect, useState } from 'react';
import axios from '../../axios';
import { Link } from 'react-router-dom';
import NavBar from '../../components/navBar';

const severityClass = {
    low: 'secondary',
    medium: 'warning',
    high: 'danger',
    critical: 'dark',
};

const typeLabels = {
    frequent_writeoffs: 'Dažni nurašymai',
    large_writeoff: 'Didelis nurašymas',
    sudden_drop: 'Staigus kritimas',
    expired_stock: 'Pasibaigęs galiojimas',
    asset_mismatch: 'Turto neatitikimas',
};

const AnomalyListView = () => {

    const [anomalies, setAnomalies] = useState([]);
    const [stats, setStats] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [selected, setSelected] = useState(null);

    const [filters, setFilters] = useState({
        severity: '',
        resolved: '',
    });

    const fetchStats = async () => {
        try {
            const res = await axios.get('/v2/inventory/anomalies/stats');
            setStats(res.data.data);
        } catch (e) {}
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

    const runScan = async () => {
        await axios.post('/v2/inventory/anomalies/scan');
        fetchAnomalies();
        fetchStats();
    };

    const resolveAnomaly = async (id) => {
        await axios.post(`/v2/inventory/anomalies/${id}/resolve`, {
            is_resolved: true
        });

        setSelected(null);
        fetchAnomalies();
        fetchStats();
    };

    useEffect(() => {
        fetchAnomalies();
        fetchStats();
    }, [filters]);

    const renderActions = (a) => {

        const d = a.details || {};

        switch (a.anomaly_type) {

            case 'large_writeoff':
                return (
                    <>
                        <Link to={`/v2/movements/${d.movement_id}`}
                              className="btn btn-sm btn-outline-primary me-2">
                            Movement
                        </Link>

                        <Link to={`/v2/batches/${d.batch_id}`}
                              className="btn btn-sm btn-outline-secondary">
                            Batch
                        </Link>
                    </>
                );

            case 'expired_stock':
                return (
                    <Link to={`/v2/batches/${d.batch_id}`}
                          className="btn btn-sm btn-outline-warning">
                        Batch
                    </Link>
                );

            case 'asset_mismatch':
                return (
                    <Link to={`/v2/asset-units/${d.asset_id}`}
                          className="btn btn-sm btn-outline-dark">
                        Asset
                    </Link>
                );

            default:
                return null;
        }
    };

    return (
        <>
            <NavBar />

            <div className="container-fluid" style={{ paddingTop: '90px' }}>

                {/* HEADER */}
                <div className="d-flex justify-content-between mb-3">
                    <div>
                        <h3>Anomalijos</h3>
                        <p className="text-muted">Incidentų analizė</p>
                    </div>

                    <button className="btn btn-danger" onClick={runScan}>
                        Skenuoti
                    </button>
                </div>

                {/* FILTERS */}
                <div className="card mb-3">
                    <div className="card-body row">

                        <div className="col-md-3">
                            <select className="form-select"
                                    onChange={(e) =>
                                        setFilters({...filters, severity: e.target.value})
                                    }>
                                <option value="">Visi severity</option>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="critical">Critical</option>
                            </select>
                        </div>

                        <div className="col-md-3">
                            <select className="form-select"
                                    onChange={(e) =>
                                        setFilters({...filters, resolved: e.target.value})
                                    }>
                                <option value="">Visi</option>
                                <option value="false">Atviros</option>
                                <option value="true">Išspręstos</option>
                            </select>
                        </div>

                    </div>
                </div>

                {/* TABLE */}
                {loading ? (
                    <div>Loading...</div>
                ) : error ? (
                    <div className="alert alert-danger">{error}</div>
                ) : (
                    <div className="card">
                        <div className="table-responsive">
                            <table className="table table-hover">

                                <thead className="table-light">
                                <tr>
                                    <th>Item</th>
                                    <th>Tipas</th>
                                    <th>Severity</th>
                                    <th>Summary</th>
                                    <th>Details</th>
                                    <th></th>
                                </tr>
                                </thead>

                                <tbody>
                                {anomalies.map(a => (
                                    <tr key={a.id}>

                                        <td>
                                            {a.item_variant?.item?.name || '—'}
                                        </td>

                                        <td>{typeLabels[a.anomaly_type]}</td>

                                        <td>
                                            <span className={`badge bg-${severityClass[a.severity]}`}>
                                                {a.severity}
                                            </span>
                                        </td>

                                        <td>{a.summary}</td>

                                        <td>
                                            <button
                                                className="btn btn-sm btn-outline-info"
                                                onClick={() => setSelected(a)}
                                            >
                                                View
                                            </button>
                                        </td>

                                        <td>
                                            {!a.is_resolved && (
                                                <button
                                                    className="btn btn-sm btn-success me-2"
                                                    onClick={() => resolveAnomaly(a.id)}
                                                >
                                                    Resolve
                                                </button>
                                            )}

                                            {renderActions(a)}
                                        </td>

                                    </tr>
                                ))}
                                </tbody>

                            </table>
                        </div>
                    </div>
                )}

                {/* MODAL */}
                {selected && (
                    <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
                        <div className="modal-dialog modal-lg">

                            <div className="modal-content">

                                <div className="modal-header">
                                    <h5>{selected.summary}</h5>
                                    <button className="btn-close"
                                            onClick={() => setSelected(null)} />
                                </div>

                                <div className="modal-body">

                                    <p><b>Item:</b> {selected.item_variant?.item?.name}</p>
                                    <p><b>Type:</b> {selected.anomaly_type}</p>
                                    <p><b>Severity:</b> {selected.severity}</p>

                                    <hr />

                                    <h6>Details</h6>
                                    <pre className="bg-light p-2">
                                        {JSON.stringify(selected.details, null, 2)}
                                    </pre>

                                    <hr />

                                    <h6>Action</h6>
                                    {renderActions(selected)}

                                </div>

                                <div className="modal-footer">

                                    {!selected.is_resolved && (
                                        <button
                                            className="btn btn-success"
                                            onClick={() => resolveAnomaly(selected.id)}
                                        >
                                            Mark as resolved
                                        </button>
                                    )}

                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => setSelected(null)}
                                    >
                                        Close
                                    </button>

                                </div>

                            </div>

                        </div>
                    </div>
                )}

            </div>
        </>
    );
};

export default AnomalyListView;