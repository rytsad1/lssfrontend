import React, { useEffect, useState } from 'react';
import axios from '../../axios';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import StockBatchFormModal from '../../components/v2/StockBatchFormModal';

const StockBatchesView = () => {
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [variantFilter, setVariantFilter] = useState('');
    const [variants, setVariants] = useState([]);
    const [expiringDays, setExpiringDays] = useState('');

    const [showModal, setShowModal] = useState(false);
    const [selectedBatch, setSelectedBatch] = useState(null);

    const fetchBatches = async () => {
        setLoading(true);
        setError('');
        try {
            const params = {};
            if (variantFilter) params.item_variant_id = variantFilter;
            if (expiringDays) params.expiring_within_days = expiringDays;

            const response = await axios.get('/v2/inventory/batches', { params });
            setBatches(response.data.data || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Klaida kraunant partijas');
        } finally {
            setLoading(false);
        }
    };

    const fetchVariants = async () => {
        try {
            const res = await axios.get('/v2/inventory/variants', { params: { per_page: 1000 } });
            setVariants(res.data.data || []);
        } catch {
            // tylim
        }
    };

    useEffect(() => {
        fetchVariants();
        fetchBatches();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        fetchBatches();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [variantFilter, expiringDays]);

    const handleNew = () => {
        setSelectedBatch(null);
        setShowModal(true);
    };

    const handleEdit = (batch) => {
        setSelectedBatch(batch);
        setShowModal(true);
    };

    const handleDelete = async (batch) => {
        if (!window.confirm(`Ar tikrai ištrinti partiją „${batch.batch_number || `#${batch.id}`}"?`)) return;

        try {
            await axios.delete(`/v2/inventory/batches/${batch.id}`);
            toast.success('Partija ištrinta.');
            fetchBatches();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Klaida šalinant partiją.');
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('lt-LT');
    };

    const getExpirationBadge = (batch) => {
        if (!batch.expiration_date) return <span className="text-muted">—</span>;

        if (batch.is_expired) {
            return (
                <span className="text-danger fw-bold">
                    {formatDate(batch.expiration_date)} <small>(pasibaigė)</small>
                </span>
            );
        }

        const daysLeft = Math.ceil(
            (new Date(batch.expiration_date) - new Date()) / (1000 * 60 * 60 * 24)
        );

        if (daysLeft <= 30) {
            return (
                <span className="text-warning fw-bold">
                    {formatDate(batch.expiration_date)} <small>({daysLeft} d.)</small>
                </span>
            );
        }

        return formatDate(batch.expiration_date);
    };

    return (
        <div className="container mt-4" style={{ paddingTop: '70px' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h3>Partijos</h3>
                <div>
                    <Link to="/v2/stock" className="btn btn-outline-secondary me-2">Likučiai</Link>
                    <button className="btn btn-primary" onClick={handleNew}>
                        + Nauja partija
                    </button>
                </div>
            </div>

            <div className="row mb-3">
                <div className="col-md-6">
                    <label className="form-label">Filtruoti pagal variantą</label>
                    <select
                        className="form-select"
                        value={variantFilter}
                        onChange={(e) => setVariantFilter(e.target.value)}
                    >
                        <option value="">— Visi variantai —</option>
                        {variants.map(v => (
                            <option key={v.id} value={v.id}>
                                {v.sku} — {v.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="col-md-6">
                    <label className="form-label">Galioja per (dienų)</label>
                    <select
                        className="form-select"
                        value={expiringDays}
                        onChange={(e) => setExpiringDays(e.target.value)}
                    >
                        <option value="">Visos partijos</option>
                        <option value="7">Per 7 dienas</option>
                        <option value="30">Per 30 dienų</option>
                        <option value="90">Per 90 dienų</option>
                        <option value="365">Per metus</option>
                    </select>
                </div>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            {loading ? (
                <div className="text-center my-5">
                    <div className="spinner-border" role="status"></div>
                </div>
            ) : batches.length === 0 ? (
                <div className="alert alert-info">
                    Nėra partijų pagal pasirinktus filtrus.
                </div>
            ) : (
                <table className="table table-bordered table-hover">
                    <thead className="table-light">
                    <tr>
                        <th>Partijos Nr.</th>
                        <th>Variantas</th>
                        <th>Gauta</th>
                        <th className="text-end">Pradinis</th>
                        <th className="text-end">Likutis</th>
                        <th>Galioja iki</th>
                        <th>Šaltinis</th>
                        <th style={{ width: '180px' }}>Veiksmai</th>
                    </tr>
                    </thead>
                    <tbody>
                    {batches.map(batch => (
                        <tr key={batch.id} className={batch.is_expired ? 'table-danger' : ''}>
                            <td>
                                {batch.batch_number ? (
                                    <code>{batch.batch_number}</code>
                                ) : (
                                    <span className="text-muted">#{batch.id}</span>
                                )}
                            </td>
                            <td>
                                {batch.item_variant ? (
                                    <>
                                        <code>{batch.item_variant.sku}</code>
                                        <br />
                                        <small>
                                            {batch.item_variant.item?.name} — {batch.item_variant.name}
                                        </small>
                                    </>
                                ) : '—'}
                            </td>
                            <td>{formatDate(batch.received_date)}</td>
                            <td className="text-end">{batch.quantity_initial}</td>
                            <td className="text-end">
                                    <span className={parseFloat(batch.quantity_remaining) > 0 ? 'fw-bold' : 'text-muted'}>
                                        {batch.quantity_remaining}
                                    </span>
                            </td>
                            <td>{getExpirationBadge(batch)}</td>
                            <td><small>{batch.source_reference || '—'}</small></td>
                            <td>
                                <button
                                    className="btn btn-sm btn-outline-warning me-1"
                                    onClick={() => handleEdit(batch)}
                                >
                                    Redaguoti
                                </button>
                                <button
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => handleDelete(batch)}
                                >
                                    Šalinti
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}

            <StockBatchFormModal
                show={showModal}
                batch={selectedBatch}
                onClose={() => setShowModal(false)}
                onSuccess={fetchBatches}
            />
        </div>
    );
};

export default StockBatchesView;