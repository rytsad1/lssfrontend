import React, { useState } from 'react';
import axios from '../../axios';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const InventoryImportView = () => {
    const navigate = useNavigate();

    const [file, setFile] = useState(null);
    const [previewRows, setPreviewRows] = useState([]);
    const [step, setStep] = useState(1); // 1=upload, 2=preview, 2.5=conflicts, 3=done
    const [loading, setLoading] = useState(false);
    const [confirmResult, setConfirmResult] = useState(null);

    // Konfliktai
    const [conflicts, setConflicts] = useState([]);
    const [conflictDecisions, setConflictDecisions] = useState({}); // { code: 'skip'|'update'|'add_batch' }

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (!selected) return;

        const ext = selected.name.split('.').pop().toLowerCase();
        if (!['xls', 'xlsx'].includes(ext)) {
            toast.error('Tinka tik .xls arba .xlsx formatai');
            return;
        }

        setFile(selected);
    };

    const handlePreview = async () => {
        if (!file) {
            toast.error('Pasirink failą');
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post('/v2/inventory/import/preview', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setPreviewRows(response.data || []);
            setStep(2);

            if (response.data.length === 0) {
                toast.warning('Faile nerasta tinkamų eilučių');
            } else {
                toast.success(`Rasta ${response.data.length} eilučių`);
            }
        } catch (err) {
            const data = err.response?.data;
            if (data?.errors) {
                Object.values(data.errors).flat().forEach(msg => toast.error(msg));
            } else {
                toast.error(data?.message || 'Klaida skaitant failą');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRowChange = (index, field, value) => {
        setPreviewRows(prev => prev.map((row, i) =>
            i === index ? { ...row, [field]: value } : row
        ));
    };

    const handleRemoveRow = (index) => {
        setPreviewRows(prev => prev.filter((_, i) => i !== index));
    };

    const handleToggleFlag = (index, field) => {
        setPreviewRows(prev => prev.map((row, i) =>
            i === index ? { ...row, [field]: !row[field] } : row
        ));
    };

    // Pirmas importo bandymas (be konflikto sprendimo)
    const handleConfirm = async () => {
        if (previewRows.length === 0) {
            toast.error('Nėra eilučių importavimui');
            return;
        }

        if (!window.confirm(`Importuoti ${previewRows.length} eilučių į sandėlį?`)) return;

        await runImport(previewRows.map(row => buildRowPayload(row)));
    };

    // Antras bandymas — po konflikto sprendimo
    const handleResolveConflicts = async () => {
        // Patikrinam, ar visi konfliktai turi sprendimą
        const unresolved = conflicts.filter(c => !conflictDecisions[c.incoming_item.code]);

        if (unresolved.length > 0) {
            toast.error(`Dar liko ${unresolved.length} nesprestų konfliktų`);
            return;
        }

        // Sudarom items su conflict_resolution kiekvienam
        const itemsWithResolutions = previewRows.map(row => {
            const conflict = conflicts.find(c => c.incoming_item.code === row.code);
            const resolution = conflict ? conflictDecisions[row.code] : null;

            return buildRowPayload(row, resolution);
        });

        await runImport(itemsWithResolutions);
    };

    const buildRowPayload = (row, resolution = null) => ({
        code: String(row.code),
        name: String(row.name),
        description: row.description || null,
        unit_of_measure: row.unit_of_measure || 'vnt',
        quantity: parseFloat(row.quantity) || 0,
        price: parseFloat(row.price) || 0,
        is_asset: !!row.is_asset,
        is_serialized: !!row.is_serialized,
        is_expirable: !!row.is_expirable,
        expiration_date: row.expiration_date || null,
        batch_number: row.batch_number || null,
        conflict_resolution: resolution,
    });

    const runImport = async (items) => {
        setLoading(true);
        try {
            const response = await axios.post('/v2/inventory/import/confirm', { items });
            const result = response.data;

            if (result.conflicts_count > 0) {
                // Yra konfliktų — rodome sprendimo žingsnį
                setConflicts(result.conflicts);

                // Pradinį sprendimą — pagal default
                const defaults = {};
                result.conflicts.forEach(c => {
                    defaults[c.incoming_item.code] = 'add_batch';
                });
                setConflictDecisions(defaults);

                setConfirmResult(result);
                setStep(2.5);
                toast.warning(`Rasta ${result.conflicts_count} konfliktų. Pasirink, ką daryti su kiekvienu.`);
            } else {
                setConfirmResult(result);
                setStep(3);
                setConflicts([]);
                toast.success(`Sėkmingai importuota ${result.imported_count} eilučių`);
            }
        } catch (err) {
            const data = err.response?.data;
            if (data?.errors) {
                Object.values(data.errors).flat().forEach(msg => toast.error(msg));
            } else {
                toast.error(data?.message || 'Klaida importuojant');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleStartOver = () => {
        setFile(null);
        setPreviewRows([]);
        setStep(1);
        setConfirmResult(null);
        setConflicts([]);
        setConflictDecisions({});
    };

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h3>Excel importas</h3>
                <Link to="/v2/stock" className="btn btn-outline-secondary">Likučiai</Link>
            </div>

            {/* Stepper */}
            <ul className="nav nav-pills mb-4">
                <li className="nav-item">
                    <span className={`nav-link ${step === 1 ? 'active' : (step > 1 ? 'text-success' : 'disabled')}`}>
                        1. Įkelti failą
                    </span>
                </li>
                <li className="nav-item">
                    <span className={`nav-link ${step === 2 ? 'active' : (step > 2 ? 'text-success' : 'disabled')}`}>
                        2. Peržiūrėti
                    </span>
                </li>
                {step === 2.5 && (
                    <li className="nav-item">
                        <span className="nav-link active bg-warning text-dark">
                            ⚠ Konfliktai
                        </span>
                    </li>
                )}
                <li className="nav-item">
                    <span className={`nav-link ${step === 3 ? 'active' : 'disabled'}`}>
                        3. Rezultatas
                    </span>
                </li>
            </ul>

            {/* STEP 1 — UPLOAD */}
            {step === 1 && (
                <div className="card">
                    <div className="card-body">
                        <h5>Pasirink Excel failą</h5>
                        <p className="text-muted">
                            Formato pavyzdys: pirma eilutė — organizacija/data, antra — antraštės,
                            nuo trečios — duomenys. Stulpeliai: Pavadinimas, Kodas, Matas, Kiekis, (Text), Kaina.
                        </p>

                        <input
                            type="file"
                            accept=".xls,.xlsx"
                            className="form-control mb-3"
                            onChange={handleFileChange}
                        />

                        {file && (
                            <div className="alert alert-info">
                                Pasirinkta: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(1)} KB)
                            </div>
                        )}

                        <button
                            className="btn btn-primary"
                            onClick={handlePreview}
                            disabled={!file || loading}
                        >
                            {loading ? 'Skaitoma...' : 'Peržiūrėti'}
                        </button>
                    </div>
                </div>
            )}

            {/* STEP 2 — PREVIEW */}
            {step === 2 && (
                <>
                    <div className="alert alert-info">
                        Rasta <strong>{previewRows.length}</strong> eilučių. Patikrink duomenis prieš importavimą.
                        Gali ištrinti eilutes ar pažymėti specialias savybes (turtas, galiojimas).
                    </div>

                    {previewRows.length > 0 ? (
                        <div className="table-responsive">
                            <table className="table table-bordered table-sm">
                                <thead className="table-light">
                                <tr>
                                    <th style={{ width: '40px' }}>#</th>
                                    <th>Kodas</th>
                                    <th>Pavadinimas</th>
                                    <th style={{ width: '80px' }}>Vienetas</th>
                                    <th style={{ width: '100px' }}>Kiekis</th>
                                    <th style={{ width: '100px' }}>Kaina</th>
                                    <th style={{ width: '120px' }}>Partija</th>
                                    <th style={{ width: '140px' }}>Galioja iki</th>
                                    <th style={{ width: '180px' }}>Savybės</th>
                                    <th style={{ width: '60px' }}></th>
                                </tr>
                                </thead>
                                <tbody>
                                {previewRows.map((row, idx) => (
                                    <tr key={idx}>
                                        <td>{idx + 1}</td>
                                        <td>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                value={row.code || ''}
                                                onChange={(e) => handleRowChange(idx, 'code', e.target.value)}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                value={row.name || ''}
                                                onChange={(e) => handleRowChange(idx, 'name', e.target.value)}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                value={row.unit_of_measure || ''}
                                                onChange={(e) => handleRowChange(idx, 'unit_of_measure', e.target.value)}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                step="0.001"
                                                className="form-control form-control-sm"
                                                value={row.quantity || 0}
                                                onChange={(e) => handleRowChange(idx, 'quantity', e.target.value)}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="form-control form-control-sm"
                                                value={row.price || 0}
                                                onChange={(e) => handleRowChange(idx, 'price', e.target.value)}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                value={row.batch_number || ''}
                                                placeholder="BATCH-..."
                                                onChange={(e) => handleRowChange(idx, 'batch_number', e.target.value)}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="date"
                                                className="form-control form-control-sm"
                                                value={row.expiration_date || ''}
                                                onChange={(e) => handleRowChange(idx, 'expiration_date', e.target.value)}
                                            />
                                        </td>
                                        <td>
                                            <div className="form-check form-check-inline">
                                                <input
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    id={`asset-${idx}`}
                                                    checked={!!row.is_asset}
                                                    onChange={() => handleToggleFlag(idx, 'is_asset')}
                                                />
                                                <label className="form-check-label small" htmlFor={`asset-${idx}`}>Turtas</label>
                                            </div>
                                            <div className="form-check form-check-inline">
                                                <input
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    id={`exp-${idx}`}
                                                    checked={!!row.is_expirable}
                                                    onChange={() => handleToggleFlag(idx, 'is_expirable')}
                                                />
                                                <label className="form-check-label small" htmlFor={`exp-${idx}`}>Galioj.</label>
                                            </div>
                                        </td>
                                        <td>
                                            <button
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={() => handleRemoveRow(idx)}
                                                title="Pašalinti eilutę"
                                            >
                                                ✕
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="alert alert-warning">Nėra eilučių.</div>
                    )}

                    <div className="d-flex justify-content-between mt-3">
                        <button className="btn btn-outline-secondary" onClick={handleStartOver}>
                            ← Pradėti iš naujo
                        </button>
                        <button
                            className="btn btn-success"
                            onClick={handleConfirm}
                            disabled={loading || previewRows.length === 0}
                        >
                            {loading ? 'Importuojama...' : `Importuoti ${previewRows.length} eilučių`}
                        </button>
                    </div>
                </>
            )}

            {/* STEP 2.5 — CONFLICTS */}
            {step === 2.5 && (
                <>
                    <div className="alert alert-warning">
                        <h5>⚠ Rasta konfliktų</h5>
                        Šie daiktai jau egzistuoja duomenų bazėje su skirtingais duomenimis.
                        Pasirink, ką daryti su kiekvienu. Tada paspausk „Tęsti importą".
                    </div>

                    {conflicts.map((c, idx) => (
                        <div key={idx} className="card mb-3 border-warning">
                            <div className="card-header bg-warning text-dark">
                                <strong>{c.incoming_item.code}</strong>
                                {c.mismatched_fields?.length > 0 && (
                                    <small className="ms-2">
                                        (skiriasi: {c.mismatched_fields.join(', ')})
                                    </small>
                                )}
                            </div>
                            <div className="card-body">
                                <div className="row mb-3">
                                    <div className="col-md-6">
                                        <small className="text-muted">Duomenų bazėje:</small>
                                        <div className="border p-2 rounded bg-light">
                                            <div><strong>{c.existing_item.name}</strong></div>
                                            <div>Vienetas: {c.existing_item.unit_of_measure}</div>
                                            <div className="text-muted small">ID: {c.existing_item.id}</div>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <small className="text-muted">Iš Excel:</small>
                                        <div className="border p-2 rounded bg-light">
                                            <div><strong>{c.incoming_item.name}</strong></div>
                                            <div>Vienetas: {c.incoming_item.unit_of_measure}</div>
                                            <div>Kiekis: {c.incoming_item.quantity}</div>
                                        </div>
                                    </div>
                                </div>

                                <label className="form-label"><strong>Ką darom?</strong></label>
                                <div className="form-check">
                                    <input
                                        type="radio"
                                        className="form-check-input"
                                        id={`add-${idx}`}
                                        name={`decision-${idx}`}
                                        checked={conflictDecisions[c.incoming_item.code] === 'add_batch'}
                                        onChange={() => setConflictDecisions(prev => ({ ...prev, [c.incoming_item.code]: 'add_batch' }))}
                                    />
                                    <label htmlFor={`add-${idx}`} className="form-check-label">
                                        <strong>Pridėti partiją</strong> prie esamo daikto (palieka senus duomenis, tik prideda likutį)
                                    </label>
                                </div>
                                <div className="form-check">
                                    <input
                                        type="radio"
                                        className="form-check-input"
                                        id={`update-${idx}`}
                                        name={`decision-${idx}`}
                                        checked={conflictDecisions[c.incoming_item.code] === 'update'}
                                        onChange={() => setConflictDecisions(prev => ({ ...prev, [c.incoming_item.code]: 'update' }))}
                                    />
                                    <label htmlFor={`update-${idx}`} className="form-check-label">
                                        <strong>Atnaujinti duomenis</strong> (perrašo pavadinimą/vienetą + prideda partiją)
                                    </label>
                                </div>
                                <div className="form-check">
                                    <input
                                        type="radio"
                                        className="form-check-input"
                                        id={`skip-${idx}`}
                                        name={`decision-${idx}`}
                                        checked={conflictDecisions[c.incoming_item.code] === 'skip'}
                                        onChange={() => setConflictDecisions(prev => ({ ...prev, [c.incoming_item.code]: 'skip' }))}
                                    />
                                    <label htmlFor={`skip-${idx}`} className="form-check-label">
                                        <strong>Praleisti</strong> šitą eilutę (nieko nedaryti)
                                    </label>
                                </div>
                            </div>
                        </div>
                    ))}

                    <div className="d-flex justify-content-between mt-3">
                        <button className="btn btn-outline-secondary" onClick={handleStartOver}>
                            ← Pradėti iš naujo
                        </button>
                        <button
                            className="btn btn-success"
                            onClick={handleResolveConflicts}
                            disabled={loading}
                        >
                            {loading ? 'Importuojama...' : 'Tęsti importą'}
                        </button>
                    </div>
                </>
            )}

            {/* STEP 3 — RESULT */}
            {step === 3 && confirmResult && (
                <>
                    <div className="alert alert-success">
                        <h5>{confirmResult.message}</h5>
                        <p className="mb-0">
                            Sėkmingai importuota: <strong>{confirmResult.imported_count}</strong>
                        </p>
                    </div>

                    {confirmResult.imported?.length > 0 && (
                        <div className="card mb-3">
                            <div className="card-header">Importuoti daiktai ({confirmResult.imported.length})</div>
                            <div className="card-body p-0">
                                <table className="table table-sm mb-0">
                                    <thead>
                                    <tr>
                                        <th>Kodas</th>
                                        <th>Pavadinimas</th>
                                        <th className="text-end">Kiekis</th>
                                        <th>Statusas</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {confirmResult.imported.map((row, idx) => (
                                        <tr key={idx}>
                                            <td><code>{row.code}</code></td>
                                            <td>{row.name}</td>
                                            <td className="text-end">{row.quantity}</td>
                                            <td>
                                                {row.was_existing ? (
                                                    <span className="badge bg-info">
                                                            {row.resolution === 'update' ? 'Atnaujinta' : 'Pridėta partija'}
                                                        </span>
                                                ) : (
                                                    <span className="badge bg-success">Nauja</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    <div className="d-flex gap-2">
                        <button className="btn btn-outline-primary" onClick={handleStartOver}>
                            Naujas importas
                        </button>
                        <button className="btn btn-success" onClick={() => navigate('/v2/stock')}>
                            Eiti į likučius
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default InventoryImportView;