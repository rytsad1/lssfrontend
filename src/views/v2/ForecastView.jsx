import React, { useEffect, useState } from 'react';
import axios from '../../axios';

const STATUS_CONFIG = {
    out_of_stock: { label: 'Nėra likučio',      cls: 'danger',   icon: '🚫' },
    reorder_now:  { label: 'Papildyti dabar',    cls: 'danger',   icon: '🔴' },
    low:          { label: 'Mažas likutis',      cls: 'warning',  icon: '🟡' },
    warning:      { label: 'Atkreipti dėmesį',  cls: 'warning',  icon: '⚠️'  },
    ok:           { label: 'Pakanka',            cls: 'success',  icon: '✅'  },
    no_data:      { label: 'Nėra duomenų',       cls: 'secondary',icon: '—'   },
};

const ForecastView = () => {
    const [forecasts, setForecasts]   = useState([]);
    const [loading, setLoading]       = useState(true);
    const [filter, setFilter]         = useState('');
    const [selected, setSelected]     = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    useEffect(() => {
        fetchForecasts();
    }, [filter]);

    const fetchForecasts = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filter) params.status = filter;
            const res = await axios.get('/v2/inventory/forecast', { params });
            setForecasts(res.data.data || []);
        } catch {
            // tyliai
        } finally {
            setLoading(false);
        }
    };

    const fetchDetail = async (variantId) => {
        setDetailLoading(true);
        try {
            const res = await axios.get(`/v2/inventory/forecast/${variantId}`);
            setSelected(res.data.data);
        } catch {} finally {
            setDetailLoading(false);
        }
    };

    const summary = {
        out_of_stock: forecasts.filter(f => f.status === 'out_of_stock').length,
        reorder_now:  forecasts.filter(f => f.status === 'reorder_now').length,
        low:          forecasts.filter(f => f.status === 'low').length,
        ok:           forecasts.filter(f => f.status === 'ok').length,
    };

    return (
        <div className="container-fluid mt-4" style={{ paddingTop: '70px' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3>Paklausos prognozė</h3>
                    <p className="text-muted mb-0">
                        Reorder point skaičiavimas pagal 12 mėn. istoriją su sezoniniu koregavimu
                    </p>
                </div>
                <button className="btn btn-outline-primary btn-sm" onClick={fetchForecasts}>
                    ↻ Atnaujinti
                </button>
            </div>

            {/* Suvestinė */}
            <div className="row g-2 mb-4">
                {[
                    { key: 'out_of_stock', label: 'Nėra likučio',   cls: 'danger'  },
                    { key: 'reorder_now',  label: 'Papildyti dabar', cls: 'danger'  },
                    { key: 'low',          label: 'Mažas likutis',   cls: 'warning' },
                    { key: 'ok',           label: 'Pakanka',         cls: 'success' },
                ].map(({ key, label, cls }) => (
                    <div className="col-6 col-md-3" key={key}>
                        <div
                            className={`card border-${cls} text-center py-2 cursor-pointer ${filter === key ? `bg-${cls} text-white` : ''}`}
                            style={{ cursor: 'pointer' }}
                            onClick={() => setFilter(filter === key ? '' : key)}
                        >
                            <div className={`fs-3 fw-bold text-${filter === key ? 'white' : cls}`}>
                                {summary[key] ?? 0}
                            </div>
                            <div className={`small ${filter === key ? 'text-white' : 'text-muted'}`}>{label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filtro mygtukai */}
            <div className="btn-group mb-3">
                <button
                    className={`btn btn-sm ${filter === '' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setFilter('')}
                >Visi</button>
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <button
                        key={key}
                        className={`btn btn-sm ${filter === key ? `btn-${cfg.cls}` : `btn-outline-${cfg.cls}`}`}
                        onClick={() => setFilter(filter === key ? '' : key)}
                    >
                        {cfg.icon} {cfg.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="text-center py-5"><div className="spinner-border" /></div>
            ) : forecasts.length === 0 ? (
                <div className="alert alert-info">Nėra prognozių pagal pasirinktus filtrus.</div>
            ) : (
                <div className="card">
                    <div className="table-responsive">
                        <table className="table table-hover mb-0">
                            <thead className="table-light">
                            <tr>
                                <th>Daiktas</th>
                                <th>SKU / Dydis</th>
                                <th className="text-end">Likutis</th>
                                <th className="text-end">Vid. mėn.</th>
                                <th className="text-end">Sez. koef.</th>
                                <th className="text-end">Prognozė</th>
                                <th className="text-end">Reorder point</th>
                                <th className="text-end">Mėn. liko</th>
                                <th>Statusas</th>
                                <th></th>
                            </tr>
                            </thead>
                            <tbody>
                            {forecasts.map(f => {
                                const s = STATUS_CONFIG[f.status] || STATUS_CONFIG.ok;
                                const needsAttention = ['out_of_stock', 'reorder_now'].includes(f.status);
                                return (
                                    <tr key={f.variant_id} className={needsAttention ? 'table-danger' : ''}>
                                        <td>
                                            <div><strong>{f.item_name}</strong></div>
                                            <code className="small">{f.item_code}</code>
                                        </td>
                                        <td>
                                            <code className="small">{f.sku}</code>
                                            {f.size && <span className="badge bg-secondary ms-1">{f.size}</span>}
                                        </td>
                                        <td className="text-end">
                                                <span className={f.current_stock <= f.reorder_point ? 'text-danger fw-bold' : ''}>
                                                    {f.current_stock}
                                                </span>
                                            <div className="small text-muted">{f.unit_of_measure}</div>
                                        </td>
                                        <td className="text-end small">{f.avg_monthly_usage}</td>
                                        <td className="text-end small">
                                                <span className={
                                                    f.seasonal_coefficient > 1.3 ? 'text-danger fw-bold' :
                                                        f.seasonal_coefficient < 0.7 ? 'text-success' : ''
                                                }>
                                                    {f.seasonal_coefficient}×
                                                </span>
                                        </td>
                                        <td className="text-end small fw-bold">{f.next_month_forecast}</td>
                                        <td className="text-end small">
                                                <span className={f.current_stock <= f.reorder_point ? 'text-danger fw-bold' : 'text-muted'}>
                                                    {f.reorder_point}
                                                </span>
                                        </td>
                                        <td className="text-end">
                                            {f.months_of_stock !== null ? (
                                                <span className={
                                                    f.months_of_stock < 1 ? 'text-danger fw-bold' :
                                                        f.months_of_stock < 2 ? 'text-warning fw-bold' : 'text-success'
                                                }>
                                                        {f.months_of_stock} mėn.
                                                    </span>
                                            ) : '—'}
                                        </td>
                                        <td>
                                                <span className={`badge bg-${s.cls}`}>
                                                    {s.icon} {s.label}
                                                </span>
                                        </td>
                                        <td>
                                            <button
                                                className="btn btn-sm btn-outline-info"
                                                onClick={() => fetchDetail(f.variant_id)}
                                            >
                                                Detalės
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Detalių modal */}
            {(selected || detailLoading) && (
                <div className="modal d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {selected ? `${selected.item_name} ${selected.size ? `(${selected.size})` : ''}` : 'Kraunama...'}
                                </h5>
                                <button className="btn-close" onClick={() => setSelected(null)} />
                            </div>

                            {detailLoading ? (
                                <div className="modal-body text-center py-5">
                                    <div className="spinner-border" />
                                </div>
                            ) : selected && (
                                <div className="modal-body">
                                    {/* Pagrindiniai rodikliai */}
                                    <div className="row g-3 mb-4">
                                        {[
                                            { label: 'Dabartinis likutis', value: `${selected.current_stock} ${selected.unit_of_measure}`, cls: selected.current_stock <= selected.reorder_point ? 'danger' : 'success' },
                                            { label: 'Vid. mėnesinis', value: `${selected.avg_monthly_usage} ${selected.unit_of_measure}`, cls: 'primary' },
                                            { label: 'Prognozė kitam mėn.', value: `${selected.next_month_forecast} ${selected.unit_of_measure}`, cls: 'info' },
                                            { label: 'Reorder point', value: `${selected.reorder_point} ${selected.unit_of_measure}`, cls: 'warning' },
                                            { label: 'Liko mėnesių', value: selected.months_of_stock !== null ? `${selected.months_of_stock} mėn.` : '—', cls: selected.months_of_stock < 2 ? 'danger' : 'success' },
                                            { label: 'Sezoninis koef.', value: `${selected.seasonal_coefficient}×`, cls: selected.seasonal_coefficient > 1.3 ? 'danger' : 'secondary' },
                                        ].map(({ label, value, cls }) => (
                                            <div className="col-md-4" key={label}>
                                                <div className={`card border-${cls}`}>
                                                    <div className="card-body py-2 text-center">
                                                        <div className={`fs-5 fw-bold text-${cls}`}>{value}</div>
                                                        <div className="small text-muted">{label}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Istorijos grafikas (tekstinis) */}
                                    <h6>Išdavimų istorija (12 mėn.)</h6>
                                    <div className="table-responsive">
                                        <table className="table table-sm table-bordered">
                                            <thead className="table-light">
                                            <tr>
                                                {selected.monthly_history?.map(m => (
                                                    <th key={m.label} className="text-center small">{m.label}</th>
                                                ))}
                                            </tr>
                                            </thead>
                                            <tbody>
                                            <tr>
                                                {selected.monthly_history?.map(m => (
                                                    <td key={m.label} className="text-center small">
                                                            <span className={m.usage > 0 ? 'fw-bold' : 'text-muted'}>
                                                                {m.usage}
                                                            </span>
                                                        {/* Mini bar */}
                                                        <div className="mt-1">
                                                            <div
                                                                className="bg-primary rounded"
                                                                style={{
                                                                    height: '4px',
                                                                    width: `${Math.min(100, (m.usage / (selected.avg_monthly_usage * 2 || 1)) * 100)}%`,
                                                                    minWidth: m.usage > 0 ? '4px' : '0',
                                                                }}
                                                            />
                                                        </div>
                                                    </td>
                                                ))}
                                            </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Rekomendacija */}
                                    <div className={`alert alert-${STATUS_CONFIG[selected.status]?.cls || 'info'} mt-3`}>
                                        <strong>Rekomendacija: </strong>
                                        {selected.status === 'out_of_stock' && 'Sandėlyje nėra likučio — papildyti nedelsiant.'}
                                        {selected.status === 'reorder_now' && `Likutis (${selected.current_stock}) pasiekė reorder point (${selected.reorder_point}) — rekomenduojama užsakyti papildymą.`}
                                        {selected.status === 'low' && `Likutis užteks maždaug ${selected.months_of_stock} mėn. — planuoti papildymą.`}
                                        {selected.status === 'warning' && `Likutis užteks maždaug ${selected.months_of_stock} mėn. — stebėti situaciją.`}
                                        {selected.status === 'ok' && `Likutis pakankamas — užteks apie ${selected.months_of_stock} mėn.`}
                                        {selected.status === 'no_data' && 'Nėra išdavimų istorijos — prognozė negalima.'}
                                        {selected.seasonal_coefficient > 1.3 && (
                                            <div className="mt-1 small">⚠ Kitą mėnesį numatomas padidėjęs poreikis (sezoninis koef. {selected.seasonal_coefficient}×).</div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setSelected(null)}>
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

export default ForecastView;