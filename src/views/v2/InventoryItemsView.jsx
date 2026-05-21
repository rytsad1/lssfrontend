import React, { useEffect, useState } from 'react';
import axios from '../../axios';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import InventoryItemFormModal from '../../components/v2/InventoryItemFormModal';

const InventoryItemsView = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');

    const [showModal, setShowModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    const fetchItems = async (searchTerm = search) => {
        setLoading(true);
        setError('');
        try {
            const params = {};
            if (searchTerm) params.search = searchTerm;
            if (activeFilter !== 'all') params.is_active = activeFilter === 'active';

            const response = await axios.get('/v2/inventory/items', { params });
            setItems(response.data.data || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Klaida kraunant daiktus');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeFilter]);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchItems();
    };

    const handleNew = () => {
        setSelectedItem(null);
        setShowModal(true);
    };

    const handleEdit = (item) => {
        setSelectedItem(item);
        setShowModal(true);
    };

    const handleDelete = async (item) => {
        if (!window.confirm(`Ar tikrai ištrinti daiktą „${item.name}"?`)) return;

        try {
            await axios.delete(`/v2/inventory/items/${item.id}`);
            toast.success('Daiktas ištrintas.');
            fetchItems();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Klaida šalinant daiktą.');
        }
    };

    const renderBadges = (item) => {
        const badges = [];
        if (item.is_expirable) badges.push(<span key="exp" className="badge bg-warning text-dark me-1">Galiojimas</span>);
        if (item.is_asset) badges.push(<span key="ast" className="badge bg-info me-1">Turtas</span>);
        if (item.is_serialized) badges.push(<span key="ser" className="badge bg-secondary me-1">Serijinis</span>);
        if (!item.is_active) badges.push(<span key="ina" className="badge bg-danger me-1">Neaktyvus</span>);
        return badges;
    };

    return (
        <div className="container mt-4" style={{ paddingTop: '70px' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h3>Daiktų valdymas</h3>
                <div>
                    <Link to="/v2/stock" className="btn btn-outline-secondary me-2">Likučiai</Link>
                    <button className="btn btn-primary" onClick={handleNew}>
                        + Naujas daiktas
                    </button>
                </div>
            </div>

            <div className="row mb-3">
                <div className="col-md-8">
                    <form onSubmit={handleSearch}>
                        <div className="input-group">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Paieška pagal kodą, pavadinimą, aprašymą..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <button type="submit" className="btn btn-primary">Ieškoti</button>
                            {search && (
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    onClick={() => {
                                        setSearch('');
                                        fetchItems('');
                                    }}
                                >
                                    Išvalyti
                                </button>
                            )}
                        </div>
                    </form>
                </div>
                <div className="col-md-4">
                    <select
                        className="form-select"
                        value={activeFilter}
                        onChange={(e) => setActiveFilter(e.target.value)}
                    >
                        <option value="all">Visi</option>
                        <option value="active">Tik aktyvūs</option>
                        <option value="inactive">Tik neaktyvūs</option>
                    </select>
                </div>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            {loading ? (
                <div className="text-center my-5">
                    <div className="spinner-border" role="status"></div>
                </div>
            ) : items.length === 0 ? (
                <div className="alert alert-info">
                    Nėra daiktų. {search ? 'Pakeisk paiešką.' : 'Sukurk pirmą daiktą.'}
                </div>
            ) : (
                <table className="table table-bordered table-hover">
                    <thead className="table-light">
                    <tr>
                        <th>Kodas</th>
                        <th>Pavadinimas</th>
                        <th>Vienetas</th>
                        <th className="text-center">Variantai</th>
                        <th>Savybės</th>
                        <th style={{ width: '230px' }}>Veiksmai</th>
                    </tr>
                    </thead>
                    <tbody>
                    {items.map(item => (
                        <tr key={item.id}>
                            <td><code>{item.code}</code></td>
                            <td>
                                <strong>{item.name}</strong>
                                {item.description && (
                                    <div><small className="text-muted">{item.description}</small></div>
                                )}
                            </td>
                            <td>{item.unit_of_measure}</td>
                            <td className="text-center">
                                    <span className="badge bg-secondary">
                                        {item.variants_count ?? 0}
                                    </span>
                            </td>
                            <td>{renderBadges(item)}</td>
                            <td>
                                <Link
                                    to={`/v2/items/${item.id}/variants`}
                                    className="btn btn-sm btn-outline-info me-1"
                                    title="Tvarkyti variantus"
                                >
                                    Variantai
                                </Link>
                                <button
                                    className="btn btn-sm btn-outline-warning me-1"
                                    onClick={() => handleEdit(item)}
                                >
                                    Redaguoti
                                </button>
                                <button
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => handleDelete(item)}
                                >
                                    Šalinti
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}

            <InventoryItemFormModal
                show={showModal}
                item={selectedItem}
                onClose={() => setShowModal(false)}
                onSuccess={fetchItems}
            />
        </div>
    );
};

export default InventoryItemsView;