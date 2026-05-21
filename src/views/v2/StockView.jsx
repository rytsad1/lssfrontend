import React, { useEffect, useState } from 'react';
import axios from '../../axios';
import { Link } from 'react-router-dom';

const StockView = () => {
    const [stock, setStock] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');

    const fetchStock = async (searchTerm = search) => {
        setLoading(true);
        setError('');
        try {
            const params = searchTerm ? { search: searchTerm } : {};
            const response = await axios.get('/v2/inventory/stock', { params });
            setStock(response.data.data || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Klaida kraunant likučius');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStock();
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchStock(search);
    };

    return (
        <div className="container mt-4" style={{ paddingTop: '70px' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h3>Sandėlio likučiai</h3>
                <div>
                    <Link to="/v2/items" className="btn btn-outline-primary me-2">Daiktų valdymas</Link>
                    <Link to="/v2/import" className="btn btn-success">Importas</Link>
                </div>
            </div>

            <form className="mb-3" onSubmit={handleSearch}>
                <div className="input-group">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Paieška pagal kodą, pavadinimą, SKU..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <button type="submit" className="btn btn-primary">Ieškoti</button>
                    {search && (
                        <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => { setSearch(''); fetchStock(''); }}
                        >
                            Išvalyti
                        </button>
                    )}
                </div>
            </form>

            {error && <div className="alert alert-danger">{error}</div>}

            {loading ? (
                <div className="text-center my-5">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Kraunama...</span>
                    </div>
                </div>
            ) : stock.length === 0 ? (
                <div className="alert alert-info">Nėra duomenų. {search && 'Pakeisk paieškos užklausą.'}</div>
            ) : (
                <table className="table table-bordered table-hover">
                    <thead className="table-light">
                    <tr>
                        <th>Kodas</th>
                        <th>Pavadinimas</th>
                        <th>SKU / Variantas</th>
                        <th>Dydis</th>
                        <th className="text-end">Kiekis</th>
                        <th className="text-end">Pasibaigę</th>
                        <th className="text-end">Vienetai</th>
                        {/*<th>Veiksmai</th>*/}
                    </tr>
                    </thead>
                    <tbody>
                    {stock.map(row => (
                        <tr key={row.variant_id}>
                            <td>{row.item_code}</td>
                            <td>{row.item_name}</td>
                            <td>
                                <small className="text-muted">{row.sku}</small><br />
                                {row.variant_name}
                            </td>
                            <td>{row.size || '—'}</td>
                            <td className="text-end">
                                    <span className={row.total_quantity > 0 ? 'text-success fw-bold' : 'text-muted'}>
                                        {row.total_quantity}
                                    </span>
                            </td>
                            <td className="text-end">
                                {row.expired_quantity > 0 ? (
                                    <span className="text-danger fw-bold">{row.expired_quantity}</span>
                                ) : (
                                    <span className="text-muted">0</span>
                                )}
                            </td>
                            <td className="text-end">
                                {row.available_assets_count > 0 ? row.available_assets_count : '—'}
                            </td>
                            {/*<td>*/}
                            {/*    /!*<Link*!/*/}
                            {/*    /!*    to={`/v2/stock/${row.variant_id}`}*!/*/}
                            {/*    /!*    className="btn btn-sm btn-outline-info"*!/*/}
                            {/*    /!*>*!/*/}
                            {/*    /!*    Detalės*!/*/}
                            {/*    /!*</Link>*!/*/}
                            {/*</td>*/}
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default StockView;