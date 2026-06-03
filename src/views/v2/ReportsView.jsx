import React, { useEffect, useState } from 'react';
import axios from '../../axios';
import { toast } from 'react-toastify';

const ReportsView = () => {
    const [users, setUsers]         = useState([]);
    const [activeTab, setActiveTab] = useState('user-assets');
    const [userId,   setUserId]     = useState('');
    const [dateFrom, setDateFrom]   = useState('');
    const [dateTo,   setDateTo]     = useState('');
    const [data, setData]           = useState(null);
    const [loading, setLoading]     = useState(false);

    useEffect(() => {
        axios.get('/v1/users')
            .then(res => setUsers(res.data.data ?? res.data ?? []))
            .catch(() => {});
    }, []);

    const fetchReport = async () => {
        setLoading(true);
        setData(null);
        try {
            const params = {};
            if (userId)   params.user_id   = userId;
            if (dateFrom) params.date_from = dateFrom;
            if (dateTo)   params.date_to   = dateTo;
            const res = await axios.get(`/v2/inventory/reports/${activeTab}`, { params });
            setData(res.data);
        } catch (e) {
            toast.error(e.response?.data?.message || 'Klaida kraunant ataskaitą');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            const params = { export: true };
            if (userId)   params.user_id   = userId;
            if (dateFrom) params.date_from = dateFrom;
            if (dateTo)   params.date_to   = dateTo;
            const res = await axios.get(`/v2/inventory/reports/${activeTab}`, {
                params,
                responseType: 'blob',
            });
            const url  = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href  = url;
            link.setAttribute('download', `${activeTab}_${new Date().toISOString().substring(0, 10)}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch {
            toast.error('Klaida eksportuojant');
        }
    };

    const fmt = (dt) => dt ? new Date(dt).toLocaleString('lt-LT', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
    }) : '—';

    const tabs = [
        { id: 'user-assets',   label: 'Naudotojo daiktai',  desc: 'Kas šiuo metu turi kokius daiktus' },
        { id: 'stock-summary', label: 'Sandėlio likučiai',   desc: 'Visi daiktai su esamais kiekiais'  },
        { id: 'issue-history', label: 'Išdavimų istorija',   desc: 'Kas, ką, kada gavo'                },
    ];

    return (
        <div className="container-fluid mt-4" style={{ paddingTop: '70px' }}>
            <h3 className="mb-4">Ataskaitos</h3>

            {/* Tabs */}
            <ul className="nav nav-tabs mb-4">
                {tabs.map(t => (
                    <li key={t.id} className="nav-item">
                        <button
                            className={`nav-link ${activeTab === t.id ? 'active' : ''}`}
                            onClick={() => { setActiveTab(t.id); setData(null); }}
                        >
                            {t.label}
                            <div className="small text-muted fw-normal" style={{ fontSize: '0.75rem' }}>{t.desc}</div>
                        </button>
                    </li>
                ))}
            </ul>

            {/* Filtrai */}
            <div className="card p-3 mb-4">
                <div className="row g-3 align-items-end">
                    {(activeTab === 'user-assets' || activeTab === 'issue-history') && (
                        <div className="col-md-3">
                            <label className="form-label">Naudotojas</label>
                            <select className="form-select" value={userId}
                                    onChange={e => setUserId(e.target.value)}>
                                <option value="">— Visi naudotojai —</option>
                                {users.map(u => (
                                    <option key={u.id_User} value={u.id_User}>
                                        {u.Name} {u.Surname}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                    {activeTab === 'issue-history' && (
                        <>
                            <div className="col-md-2">
                                <label className="form-label">Data nuo</label>
                                <input type="date" className="form-control"
                                       value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                            </div>
                            <div className="col-md-2">
                                <label className="form-label">Data iki</label>
                                <input type="date" className="form-control"
                                       value={dateTo} onChange={e => setDateTo(e.target.value)} />
                            </div>
                        </>
                    )}
                    <div className="col-auto d-flex gap-2">
                        <button className="btn btn-primary" onClick={fetchReport} disabled={loading}>
                            {loading
                                ? <><span className="spinner-border spinner-border-sm me-1" />Kraunama...</>
                                : '🔍 Rodyti'}
                        </button>
                        {data && (
                            <button className="btn btn-success" onClick={handleExport}>
                                📥 Eksportuoti Excel
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Rezultatai */}
            {data && (
                <>
                    {/* Naudotojo daiktai */}
                    {activeTab === 'user-assets' && (
                        <>
                            {data.assets?.length > 0 && (
                                <div className="card mb-4">
                                    <div className="card-header">
                                        <strong>Asset vienetai</strong>
                                        <span className="badge bg-info ms-2">{data.assets.length}</span>
                                        <small className="text-muted ms-2">Ginklai, telefonai, įranga ir kt. — šiuo metu išduoti</small>
                                    </div>
                                    <div className="table-responsive">
                                        <table className="table table-sm table-hover mb-0">
                                            <thead className="table-light">
                                            <tr>
                                                <th>Naudotojas</th>
                                                <th>Daiktas</th>
                                                <th>Kodas</th>
                                                <th>Inv. Nr.</th>
                                                <th>S/N</th>
                                                <th>Statusas</th>
                                                <th>Išduota</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {data.assets.map(a => (
                                                <tr key={a.id}>
                                                    <td>
                                                        <strong>{a.user_name}</strong>
                                                        <div className="small text-muted">ID: {a.user_id}</div>
                                                    </td>
                                                    <td>
                                                        <strong>{a.item_name}</strong>
                                                        <div><code className="small">{a.sku}</code></div>
                                                    </td>
                                                    <td><code>{a.item_code}</code></td>
                                                    <td><code>{a.inventory_number || '—'}</code></td>
                                                    <td><code>{a.serial_number    || '—'}</code></td>
                                                    <td>
                                                        {a.status === 'temporary_issued'
                                                            ? <span className="badge bg-warning text-dark">Laikinas</span>
                                                            : <span className="badge bg-success">Išduotas</span>}
                                                    </td>
                                                    <td className="small text-muted">{fmt(a.issued_at)}</td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {data.movements?.length > 0 && (
                                <div className="card mb-4">
                                    <div className="card-header">
                                        <strong>Kiekiniai daiktai</strong>
                                        <span className="badge bg-primary ms-2">{data.movements.length}</span>
                                        <small className="text-muted ms-2">Šoviniai, uniforma ir kt. — išdavimai</small>
                                    </div>
                                    <div className="table-responsive">
                                        <table className="table table-sm table-hover mb-0">
                                            <thead className="table-light">
                                            <tr>
                                                <th>Naudotojas</th>
                                                <th>Daiktas</th>
                                                <th>Kodas</th>
                                                <th className="text-end">Kiekis</th>
                                                <th>Tipas</th>
                                                <th>Išduota</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {data.movements.map(m => (
                                                <tr key={m.id}>
                                                    <td>
                                                        <strong>{m.user_name}</strong>
                                                        <div className="small text-muted">ID: {m.user_id}</div>
                                                    </td>
                                                    <td>
                                                        <strong>{m.item_name}</strong>
                                                        <div><code className="small">{m.sku}</code></div>
                                                    </td>
                                                    <td><code>{m.item_code}</code></td>
                                                    <td className="text-end fw-bold">{m.quantity}</td>
                                                    <td>
                                                        {m.movement_type === 'temporary_issue'
                                                            ? <span className="badge bg-warning text-dark">Laikinas</span>
                                                            : <span className="badge bg-primary">Išdavimas</span>}
                                                    </td>
                                                    <td className="small text-muted">{fmt(m.issued_at)}</td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {!data.assets?.length && !data.movements?.length && (
                                <div className="alert alert-info">Nėra duomenų pagal pasirinktus filtrus.</div>
                            )}
                        </>
                    )}

                    {/* Sandėlio likučiai */}
                    {activeTab === 'stock-summary' && (
                        <div className="card">
                            <div className="card-header">
                                <strong>Sandėlio likučiai</strong>
                                <span className="badge bg-secondary ms-2">{data.data?.length ?? 0} daiktų</span>
                            </div>
                            <div className="table-responsive">
                                <table className="table table-sm table-hover mb-0">
                                    <thead className="table-light">
                                    <tr>
                                        <th>Kodas</th>
                                        <th>Pavadinimas</th>
                                        <th>Tipas</th>
                                        <th>Vienetas</th>
                                        <th className="text-end">Likutis</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {(data.data || []).map(item => (
                                        <tr key={item.id}>
                                            <td><code>{item.code}</code></td>
                                            <td><strong>{item.name}</strong></td>
                                            <td>
                                                {item.is_asset
                                                    ? <span className="badge bg-info">Asset</span>
                                                    : item.is_serialized
                                                        ? <span className="badge bg-secondary">Serijinis</span>
                                                        : <span className="badge bg-light text-dark border">Kiekinis</span>}
                                            </td>
                                            <td className="text-muted">{item.unit}</td>
                                            <td className="text-end">
                                                <span className={`fw-bold ${item.total_stock > 0 ? 'text-success' : 'text-muted'}`}>
                                                    {item.total_stock}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Išdavimų istorija */}
                    {activeTab === 'issue-history' && (
                        <div className="card">
                            <div className="card-header">
                                <strong>Išdavimų istorija</strong>
                                <span className="badge bg-secondary ms-2">{data.data?.length ?? 0}</span>
                                {data.data?.length === 500 && (
                                    <span className="badge bg-warning text-dark ms-2">Rodomi tik paskutiniai 500</span>
                                )}
                            </div>
                            <div className="table-responsive">
                                <table className="table table-sm table-hover mb-0">
                                    <thead className="table-light">
                                    <tr>
                                        <th>Data</th>
                                        <th>Naudotojas</th>
                                        <th>Daiktas</th>
                                        <th>Inv. Nr.</th>
                                        <th>S/N</th>
                                        <th className="text-end">Kiekis</th>
                                        <th>Tipas</th>
                                        <th>Priežastis</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {(data.data || []).map(m => (
                                        <tr key={m.id}>
                                            <td className="small text-muted text-nowrap">{fmt(m.movement_date)}</td>
                                            <td>
                                                <strong>{m.user_name}</strong>
                                            </td>
                                            <td>
                                                <div>{m.item_name}</div>
                                                <code className="small">{m.sku}</code>
                                            </td>
                                            <td><code className="small">{m.inventory_number || '—'}</code></td>
                                            <td><code className="small">{m.serial_number    || '—'}</code></td>
                                            <td className="text-end fw-bold">{m.quantity}</td>
                                            <td>
                                                {m.movement_type === 'temporary_issue'
                                                    ? <span className="badge bg-warning text-dark">Laikinas</span>
                                                    : <span className="badge bg-primary">Išdavimas</span>}
                                            </td>
                                            <td className="small text-muted">{m.reason || '—'}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ReportsView;