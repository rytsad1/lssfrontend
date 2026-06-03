import React, { useEffect, useState } from 'react';
import axios from '../../axios';
import { toast } from 'react-toastify';

const STATUS_OPTIONS = [
    { value: 'in_stock',  label: 'Sandėlyje' },
    { value: 'repair',    label: 'Remontas'  },
];

const emptyForm = () => ({
    inventory_number: '',
    serial_number:    '',
    imei:             '',
    status:           'in_stock',
    notes:            '',
});

const AssetUnitFormModal = ({ show, asset, presetVariantId, onClose, onSuccess }) => {
    const [form, setForm]         = useState(emptyForm());
    const [variants, setVariants] = useState([]);
    const [variantId, setVariantId] = useState('');
    const [errors, setErrors]     = useState({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!show) return;
        // Kraunam tik asset variantus (is_asset = true)
        axios.get('/v2/inventory/variants', { params: { per_page: 1000 } })
            .then(res => {
                const all = res.data.data || [];
                // Filtruojam tik asset variantus
                setVariants(all.filter(v => v.item?.is_asset || v.item?.is_serialized));
            })
            .catch(() => {});
    }, [show]);

    useEffect(() => {
        if (asset) {
            setForm({
                inventory_number: asset.inventory_number || '',
                serial_number:    asset.serial_number    || '',
                imei:             asset.imei             || '',
                status:           asset.status           || 'in_stock',
                notes:            asset.notes            || '',
            });
            setVariantId(asset.item_variant_id || '');
        } else {
            setForm(emptyForm());
            setVariantId(presetVariantId || '');
        }
        setErrors({});
    }, [asset, show, presetVariantId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!variantId) { toast.error('Pasirink variantą'); return; }
        setSubmitting(true);
        setErrors({});

        const payload = {
            item_variant_id:  parseInt(variantId),
            inventory_number: form.inventory_number || null,
            serial_number:    form.serial_number    || null,
            imei:             form.imei             || null,
            status:           form.status,
            notes:            form.notes            || null,
        };

        try {
            if (asset) {
                await axios.put(`/v2/inventory/asset-units/${asset.id}`, payload);
                toast.success('Vienetas atnaujintas.');
            } else {
                await axios.post('/v2/inventory/asset-units', payload);
                toast.success('Vienetas sukurtas.');
            }
            onSuccess();
            onClose();
        } catch (error) {
            const data = error.response?.data;
            if (data?.errors) {
                setErrors(data.errors);
            } else {
                toast.error(data?.message || 'Klaida išsaugant.');
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
                            {asset ? 'Redaguoti asset vienetą' : 'Naujas asset vienetas'}
                        </h5>
                        <button type="button" className="btn-close" onClick={onClose} />
                    </div>

                    <div className="modal-body">
                        <div className="mb-3">
                            <label className="form-label">Variantas *</label>
                            <select
                                className={`form-select ${errors.item_variant_id ? 'is-invalid' : ''}`}
                                value={variantId}
                                onChange={e => setVariantId(e.target.value)}
                                disabled={!!asset}
                                required
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
                                <label className="form-label">Inventorinis numeris</label>
                                <input
                                    type="text"
                                    name="inventory_number"
                                    className={`form-control ${errors.inventory_number ? 'is-invalid' : ''}`}
                                    value={form.inventory_number}
                                    onChange={handleChange}
                                    placeholder="INV-001"
                                />
                                {errors.inventory_number && (
                                    <div className="invalid-feedback">{errors.inventory_number[0]}</div>
                                )}
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label">Serijos numeris (S/N)</label>
                                <input
                                    type="text"
                                    name="serial_number"
                                    className={`form-control ${errors.serial_number ? 'is-invalid' : ''}`}
                                    value={form.serial_number}
                                    onChange={handleChange}
                                    placeholder="SN-123456"
                                />
                                {errors.serial_number && (
                                    <div className="invalid-feedback">{errors.serial_number[0]}</div>
                                )}
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="form-label">IMEI</label>
                                <input
                                    type="text"
                                    name="imei"
                                    className={`form-control ${errors.imei ? 'is-invalid' : ''}`}
                                    value={form.imei}
                                    onChange={handleChange}
                                    placeholder="Telefonams"
                                />
                                {errors.imei && (
                                    <div className="invalid-feedback">{errors.imei[0]}</div>
                                )}
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label">Statusas</label>
                                <select
                                    name="status"
                                    className="form-select"
                                    value={form.status}
                                    onChange={handleChange}
                                >
                                    {STATUS_OPTIONS.map(s => (
                                        <option key={s.value} value={s.value}>{s.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Pastabos</label>
                            <textarea
                                name="notes"
                                className="form-control"
                                rows="2"
                                value={form.notes}
                                onChange={handleChange}
                                placeholder="Papildoma informacija..."
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

export default AssetUnitFormModal;