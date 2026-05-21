import React, { useEffect, useState } from 'react';
import axios from '../../axios';
import { toast } from 'react-toastify';

const emptyVariant = () => ({
    tempId: Date.now() + Math.random(),
    sku: '',
    name: '',
    size: '',
    color: '',
    model: '',
    is_active: true,
    batches: [emptyBatch()],
});

const emptyBatch = () => ({
    tempId: Date.now() + Math.random(),
    batch_number: '',
    received_date: new Date().toISOString().substring(0, 10),
    quantity_initial: '',
    expiration_date: '',
    source_reference: '',
    notes: '',
});

const initialItemState = {
    code: '',
    name: '',
    description: '',
    unit_of_measure: 'vnt',
    is_expirable: false,
    is_asset: false,
    is_serialized: false,
    is_active: true,
};

const InventoryItemFormModal = ({ show, item, onClose, onSuccess }) => {
    const isEdit = !!item;

    const [step, setStep] = useState(1); // 1=daiktas, 2=variantai, 3=partijos
    const [form, setForm] = useState(initialItemState);
    const [variants, setVariants] = useState([emptyVariant()]);
    const [addVariants, setAddVariants] = useState(true);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!show) return;
        setStep(1);
        setErrors({});

        if (item) {
            setForm({
                code: item.code || '',
                name: item.name || '',
                description: item.description || '',
                unit_of_measure: item.unit_of_measure || 'vnt',
                is_expirable: !!item.is_expirable,
                is_asset: !!item.is_asset,
                is_serialized: !!item.is_serialized,
                is_active: item.is_active !== false,
            });
            setAddVariants(false);
            setVariants([emptyVariant()]);
        } else {
            setForm(initialItemState);
            setAddVariants(true);
            setVariants([emptyVariant()]);
        }
    }, [item, show]);

    // Auto-generuojam SKU variantams pagal item kodą
    useEffect(() => {
        if (!form.code || isEdit) return;
        setVariants(prev => prev.map((v, i) => ({
            ...v,
            sku: v.sku || `${form.code}-${i + 1}`,
        })));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.code]);

    const handleItemChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    // --- Variant handlers ---
    const handleVariantChange = (vIdx, field, value) => {
        setVariants(prev => prev.map((v, i) =>
            i === vIdx ? { ...v, [field]: value } : v
        ));
    };

    const handleAddVariant = () => {
        const newV = emptyVariant();
        newV.sku = form.code ? `${form.code}-${variants.length + 1}` : '';
        setVariants(prev => [...prev, newV]);
    };

    const handleRemoveVariant = (vIdx) => {
        if (variants.length === 1) {
            toast.warning('Turi būti bent vienas variantas.');
            return;
        }
        setVariants(prev => prev.filter((_, i) => i !== vIdx));
    };

    // --- Batch handlers ---
    const handleBatchChange = (vIdx, bIdx, field, value) => {
        setVariants(prev => prev.map((v, i) => {
            if (i !== vIdx) return v;
            return {
                ...v,
                batches: v.batches.map((b, j) =>
                    j === bIdx ? { ...b, [field]: value } : b
                ),
            };
        }));
    };

    const handleAddBatch = (vIdx) => {
        setVariants(prev => prev.map((v, i) =>
            i === vIdx ? { ...v, batches: [...v.batches, emptyBatch()] } : v
        ));
    };

    const handleRemoveBatch = (vIdx, bIdx) => {
        setVariants(prev => prev.map((v, i) => {
            if (i !== vIdx) return v;
            if (v.batches.length === 1) {
                toast.warning('Turi būti bent viena partija.');
                return v;
            }
            return { ...v, batches: v.batches.filter((_, j) => j !== bIdx) };
        }));
    };

    // --- Validation ---
    const validateStep1 = () => {
        const e = {};
        if (!form.code.trim()) e.code = ['Kodas privalomas'];
        if (!form.name.trim()) e.name = ['Pavadinimas privalomas'];
        if (!form.unit_of_measure.trim()) e.unit_of_measure = ['Vienetas privalomas'];
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const validateStep2 = () => {
        const e = {};
        variants.forEach((v, i) => {
            if (!v.sku.trim()) e[`variant_${i}_sku`] = ['SKU privalomas'];
            if (!v.name.trim()) e[`variant_${i}_name`] = ['Pavadinimas privalomas'];
        });
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const validateStep3 = () => {
        const e = {};
        variants.forEach((v, vIdx) => {
            v.batches.forEach((b, bIdx) => {
                if (!b.quantity_initial && b.quantity_initial !== 0) {
                    e[`batch_${vIdx}_${bIdx}_qty`] = ['Kiekis privalomas'];
                }
            });
        });
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    // --- Submit ---
    const handleSubmit = async () => {
        setSubmitting(true);
        setErrors({});

        try {
            let savedItem;

            if (isEdit) {
                const res = await axios.put(`/v2/inventory/items/${item.id}`, form);
                savedItem = res.data.data;
                toast.success('Daiktas atnaujintas.');
            } else {
                const res = await axios.post('/v2/inventory/items', form);
                savedItem = res.data.data;
            }

            if (!isEdit && addVariants) {
                for (const v of variants) {
                    const varRes = await axios.post('/v2/inventory/variants', {
                        item_id: savedItem.id,
                        sku: v.sku,
                        name: v.name,
                        size: v.size || null,
                        color: v.color || null,
                        model: v.model || null,
                        is_active: v.is_active,
                    });
                    const savedVariant = varRes.data.data;

                    for (const b of v.batches) {
                        if (!b.quantity_initial) continue;
                        await axios.post('/v2/inventory/batches', {
                            item_variant_id: savedVariant.id,
                            batch_number: b.batch_number || null,
                            received_date: b.received_date || null,
                            quantity_initial: parseFloat(b.quantity_initial),
                            quantity_remaining: parseFloat(b.quantity_initial),
                            expiration_date: b.expiration_date || null,
                            source_reference: b.source_reference || null,
                            notes: b.notes || null,
                        });
                    }
                }
                toast.success('Daiktas, variantai ir partijos sukurti.');
            }

            onSuccess();
            onClose();
        } catch (error) {
            const data = error.response?.data;
            if (data?.errors) {
                setErrors(data.errors);
                toast.error('Pataisyk klaidas formoje.');
            } else {
                toast.error(data?.message || 'Klaida išsaugant.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (!show) return null;

    const totalSteps = isEdit ? 1 : (addVariants ? 3 : 1);

    return (
        <div className="modal d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-xl">
                <div className="modal-content">

                    {/* Header */}
                    <div className="modal-header">
                        <div>
                            <h5 className="modal-title mb-1">
                                {isEdit ? 'Redaguoti daiktą' : 'Naujas daiktas'}
                            </h5>
                            {!isEdit && (
                                <div className="d-flex gap-2">
                                    {['Daiktas', 'Variantai', 'Partijos'].map((label, i) => {
                                        if (!addVariants && i > 0) return null;
                                        const n = i + 1;
                                        return (
                                            <span
                                                key={n}
                                                className={`badge ${step === n ? 'bg-primary' : step > n ? 'bg-success' : 'bg-secondary'}`}
                                            >
                                                {n}. {label}
                                            </span>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                        <button type="button" className="btn-close" onClick={onClose} />
                    </div>

                    {/* Body */}
                    <div className="modal-body">

                        {/* STEP 1 — Daiktas */}
                        {step === 1 && (
                            <>
                                <div className="row">
                                    <div className="col-md-4 mb-3">
                                        <label className="form-label">Kodas *</label>
                                        <input
                                            type="text"
                                            name="code"
                                            className={`form-control ${errors.code ? 'is-invalid' : ''}`}
                                            value={form.code}
                                            onChange={handleItemChange}
                                        />
                                        {errors.code && <div className="invalid-feedback">{errors.code[0]}</div>}
                                    </div>
                                    <div className="col-md-8 mb-3">
                                        <label className="form-label">Pavadinimas *</label>
                                        <input
                                            type="text"
                                            name="name"
                                            className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                                            value={form.name}
                                            onChange={handleItemChange}
                                        />
                                        {errors.name && <div className="invalid-feedback">{errors.name[0]}</div>}
                                    </div>
                                </div>

                                <div className="row">
                                    <div className="col-md-8 mb-3">
                                        <label className="form-label">Aprašymas</label>
                                        <textarea
                                            name="description"
                                            className="form-control"
                                            rows="2"
                                            value={form.description}
                                            onChange={handleItemChange}
                                        />
                                    </div>
                                    <div className="col-md-4 mb-3">
                                        <label className="form-label">Matavimo vienetas *</label>
                                        <input
                                            type="text"
                                            name="unit_of_measure"
                                            className={`form-control ${errors.unit_of_measure ? 'is-invalid' : ''}`}
                                            value={form.unit_of_measure}
                                            onChange={handleItemChange}
                                            placeholder="vnt, kg, l..."
                                        />
                                        {errors.unit_of_measure && <div className="invalid-feedback">{errors.unit_of_measure[0]}</div>}
                                    </div>
                                </div>

                                <hr />
                                <h6 className="text-muted">Savybės</h6>
                                <div className="row">
                                    {[
                                        { name: 'is_expirable', label: 'Galiojantis (maistas, degalai — išdavus automatiškai nurašomas)' },
                                        { name: 'is_asset', label: 'Ilgalaikis turtas' },
                                        { name: 'is_serialized', label: 'Vienetinis (su S/N)' },
                                        { name: 'is_active', label: 'Aktyvus' },
                                    ].map(({ name, label }) => (
                                        <div className="col-md-3" key={name}>
                                            <div className="form-check">
                                                <input
                                                    type="checkbox"
                                                    name={name}
                                                    id={name}
                                                    className="form-check-input"
                                                    checked={form[name]}
                                                    onChange={handleItemChange}
                                                />
                                                <label htmlFor={name} className="form-check-label">{label}</label>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {!isEdit && (
                                    <div className="mt-3 p-3 bg-light rounded">
                                        <div className="form-check">
                                            <input
                                                type="checkbox"
                                                id="addVariants"
                                                className="form-check-input"
                                                checked={addVariants}
                                                onChange={(e) => setAddVariants(e.target.checked)}
                                            />
                                            <label htmlFor="addVariants" className="form-check-label">
                                                <strong>Pridėti variantus ir partijas dabar</strong>
                                                <div className="text-muted small">Jei nežymi — daiktas bus sukurtas tuščias, variantus galėsi pridėti vėliau.</div>
                                            </label>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {/* STEP 2 — Variantai */}
                        {step === 2 && (
                            <>
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <div>
                                        <h6 className="mb-0">Variantai daiktui: <strong>{form.name}</strong></h6>
                                        <small className="text-muted">Pvz. skirtingi dydžiai, spalvos, modeliai</small>
                                    </div>
                                    <button className="btn btn-sm btn-outline-primary" onClick={handleAddVariant}>
                                        + Pridėti variantą
                                    </button>
                                </div>

                                {variants.map((v, vIdx) => (
                                    <div key={v.tempId} className="card mb-3 border-primary">
                                        <div className="card-header d-flex justify-content-between align-items-center py-2">
                                            <span className="fw-bold">Variantas {vIdx + 1}</span>
                                            <button
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={() => handleRemoveVariant(vIdx)}
                                            >
                                                ✕ Pašalinti
                                            </button>
                                        </div>
                                        <div className="card-body">
                                            <div className="row">
                                                <div className="col-md-4 mb-2">
                                                    <label className="form-label form-label-sm">SKU *</label>
                                                    <input
                                                        type="text"
                                                        className={`form-control form-control-sm ${errors[`variant_${vIdx}_sku`] ? 'is-invalid' : ''}`}
                                                        value={v.sku}
                                                        onChange={(e) => handleVariantChange(vIdx, 'sku', e.target.value)}
                                                        placeholder={`${form.code}-${vIdx + 1}`}
                                                    />
                                                    {errors[`variant_${vIdx}_sku`] && <div className="invalid-feedback">{errors[`variant_${vIdx}_sku`][0]}</div>}
                                                </div>
                                                <div className="col-md-4 mb-2">
                                                    <label className="form-label form-label-sm">Pavadinimas *</label>
                                                    <input
                                                        type="text"
                                                        className={`form-control form-control-sm ${errors[`variant_${vIdx}_name`] ? 'is-invalid' : ''}`}
                                                        value={v.name}
                                                        onChange={(e) => handleVariantChange(vIdx, 'name', e.target.value)}
                                                        placeholder={form.name}
                                                    />
                                                    {errors[`variant_${vIdx}_name`] && <div className="invalid-feedback">{errors[`variant_${vIdx}_name`][0]}</div>}
                                                </div>
                                                <div className="col-md-4 mb-2">
                                                    <label className="form-label form-label-sm">Dydis</label>
                                                    <input
                                                        type="text"
                                                        className="form-control form-control-sm"
                                                        value={v.size}
                                                        onChange={(e) => handleVariantChange(vIdx, 'size', e.target.value)}
                                                        placeholder="S, M, L, 42..."
                                                    />
                                                </div>
                                                <div className="col-md-4 mb-2">
                                                    <label className="form-label form-label-sm">Spalva</label>
                                                    <input
                                                        type="text"
                                                        className="form-control form-control-sm"
                                                        value={v.color}
                                                        onChange={(e) => handleVariantChange(vIdx, 'color', e.target.value)}
                                                    />
                                                </div>
                                                <div className="col-md-4 mb-2">
                                                    <label className="form-label form-label-sm">Modelis</label>
                                                    <input
                                                        type="text"
                                                        className="form-control form-control-sm"
                                                        value={v.model}
                                                        onChange={(e) => handleVariantChange(vIdx, 'model', e.target.value)}
                                                    />
                                                </div>
                                                <div className="col-md-4 mb-2 d-flex align-items-end">
                                                    <div className="form-check">
                                                        <input
                                                            type="checkbox"
                                                            className="form-check-input"
                                                            id={`v_active_${vIdx}`}
                                                            checked={v.is_active}
                                                            onChange={(e) => handleVariantChange(vIdx, 'is_active', e.target.checked)}
                                                        />
                                                        <label htmlFor={`v_active_${vIdx}`} className="form-check-label small">Aktyvus</label>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}

                        {/* STEP 3 — Partijos */}
                        {step === 3 && (
                            <>
                                <p className="text-muted">Nustatyk pradinį kiekį kiekvienam variantui. Kiekis <strong>0</strong> — partija nebus sukurta.</p>

                                {variants.map((v, vIdx) => (
                                    <div key={v.tempId} className="card mb-4">
                                        <div className="card-header d-flex justify-content-between align-items-center py-2">
                                            <span className="fw-bold">
                                                <code>{v.sku}</code> — {v.name}
                                                {v.size && <span className="badge bg-secondary ms-2">{v.size}</span>}
                                            </span>
                                            <button
                                                className="btn btn-sm btn-outline-primary"
                                                onClick={() => handleAddBatch(vIdx)}
                                            >
                                                + Partija
                                            </button>
                                        </div>
                                        <div className="card-body p-2">
                                            {v.batches.map((b, bIdx) => (
                                                <div key={b.tempId} className="border rounded p-2 mb-2">
                                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                                        <small className="text-muted fw-bold">Partija {bIdx + 1}</small>
                                                        {v.batches.length > 1 && (
                                                            <button
                                                                className="btn btn-sm btn-outline-danger py-0"
                                                                onClick={() => handleRemoveBatch(vIdx, bIdx)}
                                                            >✕</button>
                                                        )}
                                                    </div>
                                                    <div className="row g-2">
                                                        <div className="col-md-2">
                                                            <label className="form-label form-label-sm">Kiekis *</label>
                                                            <input
                                                                type="number"
                                                                step="0.001"
                                                                className={`form-control form-control-sm ${errors[`batch_${vIdx}_${bIdx}_qty`] ? 'is-invalid' : ''}`}
                                                                value={b.quantity_initial}
                                                                onChange={(e) => handleBatchChange(vIdx, bIdx, 'quantity_initial', e.target.value)}
                                                                placeholder="0"
                                                            />
                                                            {errors[`batch_${vIdx}_${bIdx}_qty`] && <div className="invalid-feedback">{errors[`batch_${vIdx}_${bIdx}_qty`][0]}</div>}
                                                        </div>
                                                        <div className="col-md-2">
                                                            <label className="form-label form-label-sm">Partijos Nr.</label>
                                                            <input
                                                                type="text"
                                                                className="form-control form-control-sm"
                                                                value={b.batch_number}
                                                                onChange={(e) => handleBatchChange(vIdx, bIdx, 'batch_number', e.target.value)}
                                                                placeholder="BATCH-001"
                                                            />
                                                        </div>
                                                        <div className="col-md-2">
                                                            <label className="form-label form-label-sm">Gavimo data</label>
                                                            <input
                                                                type="date"
                                                                className="form-control form-control-sm"
                                                                value={b.received_date}
                                                                onChange={(e) => handleBatchChange(vIdx, bIdx, 'received_date', e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="col-md-2">
                                                            <label className="form-label form-label-sm">Galioja iki</label>
                                                            <input
                                                                type="date"
                                                                className="form-control form-control-sm"
                                                                value={b.expiration_date}
                                                                onChange={(e) => handleBatchChange(vIdx, bIdx, 'expiration_date', e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="col-md-4">
                                                            <label className="form-label form-label-sm">Šaltinis / Pastabos</label>
                                                            <input
                                                                type="text"
                                                                className="form-control form-control-sm"
                                                                value={b.source_reference}
                                                                onChange={(e) => handleBatchChange(vIdx, bIdx, 'source_reference', e.target.value)}
                                                                placeholder="Sąskaita, Excel..."
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Atšaukti
                        </button>

                        {step > 1 && (
                            <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={() => setStep(s => s - 1)}
                            >
                                ← Atgal
                            </button>
                        )}

                        {/* Paskutinis žingsnis arba redagavimas */}
                        {(step === totalSteps || isEdit) ? (
                            <button
                                className="btn btn-success"
                                onClick={handleSubmit}
                                disabled={submitting}
                            >
                                {submitting ? 'Saugoma...' : isEdit ? 'Išsaugoti' : 'Sukurti viską'}
                            </button>
                        ) : (
                            <button
                                className="btn btn-primary"
                                onClick={() => {
                                    if (step === 1 && !validateStep1()) return;
                                    if (step === 2 && !validateStep2()) return;
                                    setStep(s => s + 1);
                                }}
                            >
                                Toliau →
                            </button>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default InventoryItemFormModal;