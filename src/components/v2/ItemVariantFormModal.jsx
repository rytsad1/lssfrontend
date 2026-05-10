import React, { useEffect, useState } from 'react';
import axios from '../../axios';
import { toast } from 'react-toastify';

const initialState = {
    sku: '',
    name: '',
    size: '',
    color: '',
    model: '',
    is_active: true,
};

const ItemVariantFormModal = ({ show, variant, itemId, itemName, itemCode, onClose, onSuccess }) => {
    const [form, setForm] = useState(initialState);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (variant) {
            setForm({
                sku: variant.sku || '',
                name: variant.name || '',
                size: variant.size || '',
                color: variant.color || '',
                model: variant.model || '',
                is_active: variant.is_active !== false,
            });
        } else {
            // pasiūlomas SKU pagal item code
            setForm({
                ...initialState,
                sku: itemCode ? `${itemCode}-` : '',
                name: itemName || '',
            });
        }
        setErrors({});
    }, [variant, show, itemCode, itemName]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setErrors({});

        const payload = {
            ...form,
            item_id: itemId,
            // tuščias string -> null
            size: form.size || null,
            color: form.color || null,
            model: form.model || null,
        };

        try {
            if (variant) {
                await axios.put(`/v2/inventory/variants/${variant.id}`, payload);
                toast.success('Variantas atnaujintas.');
            } else {
                await axios.post('/v2/inventory/variants', payload);
                toast.success('Variantas sukurtas.');
            }
            onSuccess();
            onClose();
        } catch (error) {
            const data = error.response?.data;
            if (data?.errors) {
                setErrors(data.errors);
            } else {
                toast.error(data?.message || 'Klaida išsaugant variantą.');
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
                            {variant ? 'Redaguoti variantą' : 'Naujas variantas'}
                            {itemName && <small className="text-muted ms-2">({itemName})</small>}
                        </h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>

                    <div className="modal-body">
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="form-label">SKU *</label>
                                <input
                                    type="text"
                                    name="sku"
                                    className={`form-control ${errors.sku ? 'is-invalid' : ''}`}
                                    value={form.sku}
                                    onChange={handleChange}
                                    placeholder="Pvz: RUB-001-M"
                                    required
                                />
                                {errors.sku && <div className="invalid-feedback">{errors.sku[0]}</div>}
                                <div className="form-text">Unikalus identifikatorius variantui</div>
                            </div>

                            <div className="col-md-6 mb-3">
                                <label className="form-label">Pavadinimas *</label>
                                <input
                                    type="text"
                                    name="name"
                                    className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                                    value={form.name}
                                    onChange={handleChange}
                                    placeholder="Pvz: Kelnės M"
                                    required
                                />
                                {errors.name && <div className="invalid-feedback">{errors.name[0]}</div>}
                            </div>
                        </div>

                        <h6 className="text-muted mt-2">Atributai</h6>
                        <div className="row">
                            <div className="col-md-4 mb-3">
                                <label className="form-label">Dydis</label>
                                <input
                                    type="text"
                                    name="size"
                                    className={`form-control ${errors.size ? 'is-invalid' : ''}`}
                                    value={form.size}
                                    onChange={handleChange}
                                    placeholder="S, M, L, 42, 43..."
                                />
                                {errors.size && <div className="invalid-feedback">{errors.size[0]}</div>}
                            </div>
                            <div className="col-md-4 mb-3">
                                <label className="form-label">Spalva</label>
                                <input
                                    type="text"
                                    name="color"
                                    className={`form-control ${errors.color ? 'is-invalid' : ''}`}
                                    value={form.color}
                                    onChange={handleChange}
                                    placeholder="Žalia, juoda..."
                                />
                                {errors.color && <div className="invalid-feedback">{errors.color[0]}</div>}
                            </div>
                            <div className="col-md-4 mb-3">
                                <label className="form-label">Modelis</label>
                                <input
                                    type="text"
                                    name="model"
                                    className={`form-control ${errors.model ? 'is-invalid' : ''}`}
                                    value={form.model}
                                    onChange={handleChange}
                                    placeholder="Samsung A55..."
                                />
                                {errors.model && <div className="invalid-feedback">{errors.model[0]}</div>}
                            </div>
                        </div>

                        <div className="form-check mb-2">
                            <input
                                type="checkbox"
                                name="is_active"
                                id="variant_is_active"
                                className="form-check-input"
                                checked={form.is_active}
                                onChange={handleChange}
                            />
                            <label htmlFor="variant_is_active" className="form-check-label">
                                Aktyvus
                            </label>
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

export default ItemVariantFormModal;