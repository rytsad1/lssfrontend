import React, { useEffect, useState } from 'react';
import axios from '../../axios';
import { toast } from 'react-toastify';

const KitAssignmentView = () => {
    const [templates, setTemplates] = useState([]);
    const [users, setUsers]         = useState([]);
    const [step, setStep]           = useState(1); // 1=forma, 2=preview, 3=done

    const [form, setForm] = useState({
        kit_template_id: '',
        user_id: '',
        is_temporary: false,
        reason: '',
        measurements_override: {
            clothing_size: '',
            shoe_size: '',
            head_size: '',
            glove_size: '',
        },
    });

    const [userMeasurements, setUserMeasurements] = useState(null);
    const [preview, setPreview]     = useState(null);
    const [result, setResult]       = useState(null);
    const [loading, setLoading]     = useState(false);

    useEffect(() => {
        axios.get('/v2/inventory/kits', { params: { is_active: true } })
            .then(res => setTemplates(res.data.data || []))
            .catch(() => {});
        axios.get('/v1/users')
            .then(res => setUsers(res.data.data || res.data || []))
            .catch(() => {});
    }, []);

    // Kai pasirenka naudotoją — užkraunam jo matavimus
    useEffect(() => {
        if (!form.user_id) { setUserMeasurements(null); return; }
        axios.get(`/v2/inventory/users/${form.user_id}/measurements`)
            .then(res => setUserMeasurements(res.data))
            .catch(() => setUserMeasurements(null));
    }, [form.user_id]);

    const handlePreview = async () => {
        if (!form.kit_template_id) { toast.error('Pasirink komplektą'); return; }
        if (!form.user_id) { toast.error('Pasirink naudotoją'); return; }

        setLoading(true);
        try {
            const override = {};
            Object.entries(form.measurements_override).forEach(([k, v]) => {
                if (v) override[k] = v;
            });

            const res = await axios.post('/v2/inventory/kit-assignments/preview', {
                kit_template_id:       parseInt(form.kit_template_id),
                user_id:               parseInt(form.user_id),
                measurements_override: Object.keys(override).length ? override : undefined,
            });
            setPreview(res.data.data);
            setStep(2);
        } catch (e) {
            toast.error(e.response?.data?.error || e.response?.data?.message || 'Klaida');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async () => {
        if (!preview) return;

        // Surenkami tik available items
        const items = preview.items
            .filter(i => i.available)
            .flatMap(i => i.selected.map(s => ({
                item_variant_id: s.item_variant_id,
                quantity:        s.quantity,
                asset_unit_id:   s.asset_unit_id ?? null,
            })));

        if (items.length === 0) {
            toast.error('Nėra nė vieno prieinamo elemento');
            return;
        }

        setLoading(true);
        try {
            const res = await axios.post('/v2/inventory/kit-assignments/confirm', {
                kit_template_id:      parseInt(form.kit_template_id),
                user_id:              parseInt(form.user_id),
                is_temporary:         form.is_temporary,
                reason:               form.reason || 'Komplekto išdavimas',
                items,
            });
            setResult(res.data);
            setStep(3);
            toast.success('Komplektas išduotas.');
        } catch (e) {
            toast.error(e.response?.data?.error || e.response?.data?.message || 'Klaida');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setStep(1);
        setPreview(null);
        setResult(null);
        setForm(p => ({ ...p, kit_template_id: '', user_id: '', reason: '' }));
    };

    const selectedUser = users.find(u => u.id_User == form.user_id);
    const selectedTemplate = templates.find(t => t.id == form.kit_template_id);

    return (
        <div className="container mt-4" style={{ paddingTop: '70px' }}>
            <h3 className="mb-4">Komplekto išdavimas</h3>

            {/* Stepper */}
            <ul className="nav nav-pills mb-4">
                {['Pasirinkimas', 'Peržiūra', 'Rezultatas'].map((label, i) => {
                    const n = i + 1;
                    return (
                        <li className="nav-item" key={n}>
                            <span className={`nav-link ${step === n ? 'active' : step > n ? 'text-success' : 'disabled'}`}>
                                {n}. {label}
                            </span>
                        </li>
                    );
                })}
            </ul>

            {/* STEP 1 — FORMA */}
            {step === 1 && (
                <div className="card">
                    <div className="card-body">
                        <div className="row g-3">
                            <div className="col-md-6">
                                <label className="form-label">Komplekto šablonas *</label>
                                <select className="form-select"
                                        value={form.kit_template_id}
                                        onChange={e => setForm(p => ({ ...p, kit_template_id: e.target.value }))}>
                                    <option value="">— Pasirink komplektą —</option>
                                    {templates.map(t => (
                                        <option key={t.id} value={t.id}>
                                            {t.name} ({t.code})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-md-6">
                                <label className="form-label">Gavėjas *</label>
                                <select className="form-select"
                                        value={form.user_id}
                                        onChange={e => setForm(p => ({ ...p, user_id: e.target.value }))}>
                                    <option value="">— Pasirink naudotoją —</option>
                                    {users.map(u => (
                                        <option key={u.id_User} value={u.id_User}>
                                            {u.Name} {u.Surname}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Naudotojo dydžiai */}
                            {form.user_id && (
                                <div className="col-12">
                                    <div className={`alert py-2 ${userMeasurements?.clothing_size ? 'alert-info' : 'alert-warning'}`}>
                                        {userMeasurements?.clothing_size ? (
                                            <div className="d-flex gap-4 align-items-center">
                                                <span><strong>Dydžiai:</strong></span>
                                                {userMeasurements.clothing_size && <span>Aprangos: <strong>{userMeasurements.clothing_size}</strong></span>}
                                                {userMeasurements.shoe_size && <span>Batai: <strong>{userMeasurements.shoe_size}</strong></span>}
                                                {userMeasurements.head_size && <span>Galvos: <strong>{userMeasurements.head_size}</strong></span>}
                                                {userMeasurements.glove_size && <span>Pirštinės: <strong>{userMeasurements.glove_size}</strong></span>}
                                            </div>
                                        ) : (
                                            <span>⚠ Naudotojas neturi išsaugotų dydžių. Įvesk rankiniu būdu:</span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Dydžių override */}
                            {form.user_id && (
                                <div className="col-12">
                                    <label className="form-label">
                                        Dydžių korekcija
                                        <small className="text-muted ms-2">(pakeičia išsaugotus)</small>
                                    </label>
                                    <div className="row g-2">
                                        {[
                                            { key: 'clothing_size', label: 'Aprangos dydis', placeholder: 'S, M, L, XL...' },
                                            { key: 'shoe_size',     label: 'Batų dydis',    placeholder: '42, 43...' },
                                            { key: 'head_size',     label: 'Galvos dydis',  placeholder: '56, 58...' },
                                            { key: 'glove_size',    label: 'Pirštinių dydis', placeholder: '9, 10...' },
                                        ].map(({ key, label, placeholder }) => (
                                            <div className="col-md-3" key={key}>
                                                <label className="form-label form-label-sm">{label}</label>
                                                <input
                                                    type="text"
                                                    className="form-control form-control-sm"
                                                    placeholder={userMeasurements?.[key] || placeholder}
                                                    value={form.measurements_override[key]}
                                                    onChange={e => setForm(p => ({
                                                        ...p,
                                                        measurements_override: {
                                                            ...p.measurements_override,
                                                            [key]: e.target.value,
                                                        }
                                                    }))}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="col-md-6">
                                <label className="form-label">Priežastis</label>
                                <input type="text" className="form-control"
                                       placeholder="Naujo nario aprūpinimas..."
                                       value={form.reason}
                                       onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} />
                            </div>

                            <div className="col-md-3 d-flex align-items-end">
                                <div className="form-check">
                                    <input type="checkbox" className="form-check-input" id="is_temp"
                                           checked={form.is_temporary}
                                           onChange={e => setForm(p => ({ ...p, is_temporary: e.target.checked }))} />
                                    <label className="form-check-label" htmlFor="is_temp">Laikinas išdavimas</label>
                                </div>
                            </div>

                            <div className="col-12">
                                <button className="btn btn-primary"
                                        onClick={handlePreview}
                                        disabled={loading || !form.kit_template_id || !form.user_id}>
                                    {loading ? 'Tikrinama...' : 'Generuoti pasiūlymą →'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* STEP 2 — PREVIEW */}
            {step === 2 && preview && (
                <>
                    <div className={`alert ${preview.all_available ? 'alert-success' : 'alert-warning'} mb-3`}>
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <strong>{preview.kit_name}</strong> →{' '}
                                <strong>{selectedUser?.Name} {selectedUser?.Surname}</strong>
                                {form.is_temporary && <span className="badge bg-warning text-dark ms-2">Laikinas</span>}
                            </div>
                            <div>
                                {preview.all_available
                                    ? <span className="text-success fw-bold">✓ Visi elementai prieinami</span>
                                    : <span className="text-warning fw-bold">⚠ Kai kurių elementų trūksta</span>}
                            </div>
                        </div>
                    </div>

                    <div className="card mb-3">
                        <div className="card-body p-0">
                            <table className="table table-sm mb-0">
                                <thead className="table-light">
                                <tr>
                                    <th>Daiktas</th>
                                    <th>Variantas / Dydis</th>
                                    <th className="text-end">Kiekis</th>
                                    <th>Partija</th>
                                    <th>Statusas</th>
                                </tr>
                                </thead>
                                <tbody>
                                {preview.items.map((item, idx) => (
                                    <React.Fragment key={idx}>
                                        {item.available ? (
                                            item.selected.map((s, si) => (
                                                <tr key={si}>
                                                    {si === 0 && (
                                                        <td rowSpan={item.selected.length}>
                                                            <strong>{item.item_name}</strong>
                                                            <div><code className="small">{item.item_code}</code></div>
                                                        </td>
                                                    )}
                                                    <td>
                                                        {s.variant_name}
                                                        {s.variant_size && <span className="badge bg-secondary ms-1">{s.variant_size}</span>}
                                                    </td>
                                                    <td className="text-end">{s.quantity}</td>
                                                    <td><code className="small">{s.batch_number || `#${s.stock_batch_id}`}</code></td>
                                                    {si === 0 && (
                                                        <td rowSpan={item.selected.length}>
                                                            <span className="badge bg-success">✓ Yra</span>
                                                        </td>
                                                    )}
                                                </tr>
                                            ))
                                        ) : (
                                            <tr className="table-danger">
                                                <td>
                                                    <strong>{item.item_name}</strong>
                                                    <div><code className="small">{item.item_code}</code></div>
                                                </td>
                                                <td>{item.requested_size && <span className="badge bg-secondary">{item.requested_size}</span>}</td>
                                                <td className="text-end">{item.required_quantity}</td>
                                                <td>—</td>
                                                <td>
                                                    <span className="badge bg-danger">✕ Nėra</span>
                                                    <div className="small text-muted">{item.reason}</div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {!preview.all_available && (
                        <div className="alert alert-warning small">
                            ⚠ Bus išduoti tik prieinami elementai. Neprieinami bus praleisti.
                        </div>
                    )}

                    <div className="d-flex gap-2">
                        <button className="btn btn-outline-secondary" onClick={() => setStep(1)}>
                            ← Atgal
                        </button>
                        <button className="btn btn-success"
                                onClick={handleConfirm}
                                disabled={loading || !preview.items.some(i => i.available)}>
                            {loading ? 'Išduodama...' : '✓ Patvirtinti ir išduoti'}
                        </button>
                    </div>
                </>
            )}

            {/* STEP 3 — REZULTATAS */}
            {step === 3 && result && (
                <>
                    <div className="alert alert-success">
                        <h5>✓ Komplektas išduotas</h5>
                        <div>Judėjimų sukurta: <strong>{result.data?.movements?.length ?? 0}</strong></div>
                    </div>

                    <div className="d-flex gap-2">
                        <button className="btn btn-primary" onClick={handleReset}>
                            Naujas išdavimas
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default KitAssignmentView;