import React, { useEffect, useState } from 'react';
import axios from '../../axios';
import { toast } from 'react-toastify';

const initialState = {
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
    const [form, setForm] = useState(initialState);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
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
        } else {
            setForm(initialState);
        }
        setErrors({});
    }, [item, show]);

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

        try {
            if (item) {
                await axios.put(`/v2/inventory/items/${item.id}`, form);
                toast.success('Daiktas atnaujintas.');
            } else {
                await axios.post('/v2/inventory/items', form);
                toast.success('Daiktas sukurtas.');
            }
            onSuccess();
            onClose();
        } catch (error) {
            const data = error.response?.data;
            if (data?.errors) {
                setErrors(data.errors);
            } else {
                toast.error(data?.message || 'Klaida išsaugant daiktą.');
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
                            {item ? 'Redaguoti daiktą' : 'Naujas daiktas'}
                        </h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>

                    <div className="modal-body">
                        <div className="row">
                            <div className="col-md-4 mb-3">
                                <label className="form-label">Kodas *</label>
                                <input
                                    type="text"
                                    name="code"
                                    className={`form-control ${errors.code ? 'is-invalid' : ''}`}
                                    value={form.code}
                                    onChange={handleChange}
                                    required
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
                                    onChange={handleChange}
                                    required
                                />
                                {errors.name && <div className="invalid-feedback">{errors.name[0]}</div>}
                            </div>
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Aprašymas</label>
                            <textarea
                                name="description"
                                className="form-control"
                                rows="2"
                                value={form.description}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="row">
                            <div className="col-md-4 mb-3">
                                <label className="form-label">Matavimo vienetas *</label>
                                <input
                                    type="text"
                                    name="unit_of_measure"
                                    className={`form-control ${errors.unit_of_measure ? 'is-invalid' : ''}`}
                                    value={form.unit_of_measure}
                                    onChange={handleChange}
                                    placeholder="vnt, kg, l..."
                                    required
                                />
                                {errors.unit_of_measure && <div className="invalid-feedback">{errors.unit_of_measure[0]}</div>}
                            </div>
                        </div>

                        <hr />

                        <h6 className="text-muted">Daikto savybės</h6>
                        <div className="row">
                            <div className="col-md-6">
                                <div className="form-check mb-2">
                                    <input
                                        type="checkbox"
                                        name="is_expirable"
                                        id="is_expirable"
                                        className="form-check-input"
                                        checked={form.is_expirable}
                                        onChange={handleChange}
                                    />
                                    <label htmlFor="is_expirable" className="form-check-label">
                                        Turi galiojimą (maistas, vaistai, baterijos)
                                    </label>
                                </div>

                                <div className="form-check mb-2">
                                    <input
                                        type="checkbox"
                                        name="is_asset"
                                        id="is_asset"
                                        className="form-check-input"
                                        checked={form.is_asset}
                                        onChange={handleChange}
                                    />
                                    <label htmlFor="is_asset" className="form-check-label">
                                        Ilgalaikis turtas (telefonas, kompiuteris)
                                    </label>
                                </div>
                            </div>

                            <div className="col-md-6">
                                <div className="form-check mb-2">
                                    <input
                                        type="checkbox"
                                        name="is_serialized"
                                        id="is_serialized"
                                        className="form-check-input"
                                        checked={form.is_serialized}
                                        onChange={handleChange}
                                    />
                                    <label htmlFor="is_serialized" className="form-check-label">
                                        Vienetinis (su serijiniu numeriu)
                                    </label>
                                </div>

                                <div className="form-check mb-2">
                                    <input
                                        type="checkbox"
                                        name="is_active"
                                        id="is_active"
                                        className="form-check-input"
                                        checked={form.is_active}
                                        onChange={handleChange}
                                    />
                                    <label htmlFor="is_active" className="form-check-label">
                                        Aktyvus
                                    </label>
                                </div>
                            </div>
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

export default InventoryItemFormModal;