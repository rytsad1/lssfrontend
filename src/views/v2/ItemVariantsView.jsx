import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from '../../axios';
import { toast } from 'react-toastify';
import ItemVariantFormModal from '../../components/v2/ItemVariantFormModal';

const ItemVariantsView = () => {
    const { itemId } = useParams();

    const [item, setItem] = useState(null);
    const [variants, setVariants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [showModal, setShowModal] = useState(false);
    const [selectedVariant, setSelectedVariant] = useState(null);

    const fetchItem = async () => {
        try {
            const response = await axios.get(`/v2/inventory/items/${itemId}`);
            setItem(response.data.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Klaida kraunant daiktą');
        }
    };

    const fetchVariants = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/v2/inventory/variants', {
                params: { item_id: itemId },
            });
            setVariants(response.data.data || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Klaida kraunant variantus');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItem();
        fetchVariants();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [itemId]);

    const handleNew = () => {
        setSelectedVariant(null);
        setShowModal(true);
    };

    const handleEdit = (variant) => {
        setSelectedVariant(variant);
        setShowModal(true);
    };

    const handleDelete = async (variant) => {
        if (!window.confirm(`Ar tikrai ištrinti variantą „${variant.name}" (${variant.sku})?`)) return;

        try {
            await axios.delete(`/v2/inventory/variants/${variant.id}`);
            toast.success('Variantas ištrintas.');
            fetchVariants();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Klaida šalinant variantą.');
        }
    };

    return (
        <div className="container mt-4">
            <nav aria-label="breadcrumb" className="mb-3">
                <ol className="breadcrumb">
                    <li className="breadcrumb-item"><Link to="/v2/items">Daiktai</Link></li>
                    <li className="breadcrumb-item active">
                        {item ? `${item.code} — ${item.name}` : 'Variantai'}
                    </li>
                </ol>
            </nav>

            {item && (
                <div className="card mb-3">
                    <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start">
                            <div>
                                <h4 className="mb-1">
                                    <code>{item.code}</code> — {item.name}
                                </h4>
                                {item.description && <p className="text-muted mb-1">{item.description}</p>}
                                <div>
                                    <small className="text-muted">Vienetas: {item.unit_of_measure}</small>
                                    {item.is_expirable && <span className="badge bg-warning text-dark ms-2">Galiojimas</span>}
                                    {item.is_asset && <span className="badge bg-info ms-2">Turtas</span>}
                                    {item.is_serialized && <span className="badge bg-secondary ms-2">Serijinis</span>}
                                </div>
                            </div>
                            <div>
                                <Link to="/v2/items" className="btn btn-outline-secondary me-2">
                                    ← Atgal
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="d-flex justify-content-between align-items-center mb-3">
                <h5>Variantai ({variants.length})</h5>
                <button className="btn btn-primary" onClick={handleNew} disabled={!item}>
                    + Naujas variantas
                </button>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            {loading ? (
                <div className="text-center my-5">
                    <div className="spinner-border" role="status"></div>
                </div>
            ) : variants.length === 0 ? (
                <div className="alert alert-info">
                    Šis daiktas dar neturi variantų. Sukurk pirmą variantą.
                </div>
            ) : (
                <table className="table table-bordered table-hover">
                    <thead className="table-light">
                    <tr>
                        <th>SKU</th>
                        <th>Pavadinimas</th>
                        <th>Dydis</th>
                        <th>Spalva</th>
                        <th>Modelis</th>
                        <th className="text-end">Likutis</th>
                        <th className="text-end">Vienetai</th>
                        <th>Status</th>
                        <th style={{ width: '180px' }}>Veiksmai</th>
                    </tr>
                    </thead>
                    <tbody>
                    {variants.map(v => (
                        <tr key={v.id}>
                            <td><code>{v.sku}</code></td>
                            <td>{v.name}</td>
                            <td>{v.size || '—'}</td>
                            <td>{v.color || '—'}</td>
                            <td>{v.model || '—'}</td>
                            <td className="text-end">
                                {v.available_batch_quantity > 0 ? (
                                    <span className="text-success fw-bold">{v.available_batch_quantity}</span>
                                ) : (
                                    <span className="text-muted">0</span>
                                )}
                            </td>
                            <td className="text-end">
                                {v.available_asset_count > 0 ? v.available_asset_count : '—'}
                            </td>
                            <td>
                                {v.is_active ? (
                                    <span className="badge bg-success">Aktyvus</span>
                                ) : (
                                    <span className="badge bg-danger">Neaktyvus</span>
                                )}
                            </td>
                            <td>
                                <button
                                    className="btn btn-sm btn-outline-warning me-1"
                                    onClick={() => handleEdit(v)}
                                >
                                    Redaguoti
                                </button>
                                <button
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => handleDelete(v)}
                                >
                                    Šalinti
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}

            <ItemVariantFormModal
                show={showModal}
                variant={selectedVariant}
                itemId={item?.id}
                itemName={item?.name}
                itemCode={item?.code}
                onClose={() => setShowModal(false)}
                onSuccess={fetchVariants}
            />
        </div>
    );
};

export default ItemVariantsView;