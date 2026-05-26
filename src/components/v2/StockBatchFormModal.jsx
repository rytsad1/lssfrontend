import React, { useEffect, useState } from 'react';
import axios from '../../axios';
import { toast } from 'react-toastify';

const initialState = {
    item_variant_id: '',
    batch_number: '',
    received_date: '',
    quantity_initial: '',
    quantity_remaining: '',
    expiration_date: '',
    source_reference: '',
    notes: '',
};

const StockBatchFormModal = ({ show, batch, presetVariantId, onClose, onSuccess }) => {
    const [form, setForm]         = useState(initialState);
    const [variants, setVariants] = useState([]);
    const [errors, setErrors]     = useState({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (show) {
            axios.get('/v2/inventory/variants', { params: { per_page: 1000 } })
                .then(res => setVariants(res.data.data || []))
                .catch(e => { if (e.response?.status !== 403) toast.error('Nepavyko įkrauti variantų sąrašo'); });
        }
    }, [show]);

    useEffect(() => {
        if (batch) {
            setForm({
                // item_variant_id imamas iš batch arba iš presetVariantId (kai atidaroma iš overview)
                item_variant_id:    batch.item_variant_id || presetVariantId || '',
                batch_number:       batch.batch_number || '',
                received_date:      batch.received_date ? batch.received_date.substring(0, 10) : '',
                quantity_initial:   batch.quantity_initial || '',
                quantity_remaining: batch.quantity_remaining || '',
                expiration_date:    batch.expiration_date ? batch.expiration_date.substring(0, 10) : '',
                source_reference:   batch.source_reference || '',
                notes:              batch.notes || '',
            });
        } else {
            setForm({
                ...initialState,
                item_variant_id: presetVariantId || '',
                received_date:   new Date().toISOString().substring(0, 10),
            });
        }
        setErrors({});
    }, [batch, show, presetVariantId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => {
            const next = { ...prev, [name]: value };
            if (!batch && name === 'quantity_initial') {
                next.quantity_remaining = value;
            }
            return next;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setErrors({});

        const payload = {
            ...form,
            item_variant_id:    parseInt(form.item_variant_id, 10),
            quantity_initial:   parseFloat(form.quantity_initial),
            quantity_remaining: parseFloat(form.quantity_remaining),
            received_date:      form.received_date    || null,
            expiration_date:    form.expiration_date  || null,
            batch_number:       form.batch_number     || null,
            source_reference:   form.source_reference || null,
            notes:              form.notes            || null,
        };

        try {
            if (batch) {
                await axios.put(`/v2/inventory/batches/${batch.id}`, payload);
                toast.success('Partija atnaujinta.');
            } else {
                await axios.post('/v2/inventory/batches', payload);
                toast.success('Partija sukurta.');
            }
            onSuccess();
            onClose();
        } catch (error) {
            const data = error.response?.data;
            if (data?.errors) {
                setErrors(data.errors);
            } else {
                toast.error(data?.message || 'Klaida išsaugant partiją.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (!show) return null;

    return (
        <div className="modal d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
                <form className="modal-content" onSubmit={handleSubmit}>
                    <div className="modal-header">
                        <h5 className="modal-title">
                            {batch ? 'Redaguoti partiją' : 'Nauja partija'}
                        </h5>
                        <button type="button" className="btn-close" onClick={onClose} />
                    </div>

                    <div className="modal-body">

                        <div className="mb-3">
                            <label className="form-label">Variantas *</label>
                            <select
                                name="item_variant_id"
                                className={`form-select ${errors.item_variant_id ? 'is-invalid' : ''}`}
                                value={form.item_variant_id}
                                onChange={handleChange}
                                required
                                disabled={!!batch}
                            >
                                <option value="">— Pasirink variantą —</option>
                                {variants.map(v => (
                                    <option key={v.id} value={v.id}>
                                        {v.sku} — {v.name}
                                        {v.item ? ` (${v.item.name})` : ''}
                                    </option>
                                ))}
                            </select>
                            {errors.item_variant_id && (
                                <div className="invalid-feedback">{errors.item_variant_id[0]}</div>
                            )}
                        </div>

                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="form-label">Partijos numeris</label>
                                <input
                                    type="text"
                                    name="batch_number"
                                    className={`form-control ${errors.batch_number ? 'is-invalid' : ''}`}
                                    value={form.batch_number}
                                    onChange={handleChange}
                                    placeholder="BATCH-001"
                                />
                                {errors.batch_number && (
                                    <div className="invalid-feedback">{errors.batch_number[0]}</div>
                                )}
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label">Gavimo data</label>
                                <input
                                    type="date"
                                    name="received_date"
                                    className={`form-control ${errors.received_date ? 'is-invalid' : ''}`}
                                    value={form.received_date}
                                    onChange={handleChange}
                                />
                                {errors.received_date && (
                                    <div className="invalid-feedback">{errors.received_date[0]}</div>
                                )}
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-md-4 mb-3">
                                <label className="form-label">Pradinis kiekis *</label>
                                <input
                                    type="number"
                                    step="0.001"
                                    name="quantity_initial"
                                    className={`form-control ${errors.quantity_initial ? 'is-invalid' : ''}`}
                                    value={form.quantity_initial}
                                    onChange={handleChange}
                                    required
                                />
                                {errors.quantity_initial && (
                                    <div className="invalid-feedback">{errors.quantity_initial[0]}</div>
                                )}
                            </div>
                            <div className="col-md-4 mb-3">
                                <label className="form-label">Likęs kiekis *</label>
                                <input
                                    type="number"
                                    step="0.001"
                                    name="quantity_remaining"
                                    className={`form-control ${errors.quantity_remaining ? 'is-invalid' : ''}`}
                                    value={form.quantity_remaining}
                                    onChange={handleChange}
                                    required
                                />
                                {errors.quantity_remaining && (
                                    <div className="invalid-feedback">{errors.quantity_remaining[0]}</div>
                                )}
                                {!batch && (
                                    <div className="form-text">Naujai partijai paprastai sutampa su pradiniu</div>
                                )}
                            </div>
                            <div className="col-md-4 mb-3">
                                <label className="form-label">Galiojimo data</label>
                                <input
                                    type="date"
                                    name="expiration_date"
                                    className={`form-control ${errors.expiration_date ? 'is-invalid' : ''}`}
                                    value={form.expiration_date}
                                    onChange={handleChange}
                                />
                                {errors.expiration_date && (
                                    <div className="invalid-feedback">{errors.expiration_date[0]}</div>
                                )}
                            </div>
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Šaltinis</label>
                            <input
                                type="text"
                                name="source_reference"
                                className="form-control"
                                value={form.source_reference}
                                onChange={handleChange}
                                placeholder="Excel importas, Sąskaita Nr..."
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Pastabos</label>
                            <textarea
                                name="notes"
                                className="form-control"
                                rows="2"
                                value={form.notes}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Atšaukti
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={submitting}>
                            {submitting ? 'Saugoma...' : 'Išsaugoti'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StockBatchFormModal;