import React, { useEffect, useState, useCallback } from 'react';
import axios from '../../axios';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import InventoryItemFormModal from '../../components/v2/InventoryItemFormModal';
import StockBatchFormModal from '../../components/v2/StockBatchFormModal';
import ItemVariantFormModal from '../../components/v2/ItemVariantFormModal';

const PAGE_SIZE = 15;

const InventoryOverviewView = () => {
    const [items, setItems]               = useState([]);
    const [loading, setLoading]           = useState(false);
    const [search, setSearch]             = useState('');
    const [activeFilter, setActiveFilter] = useState('active');
    const [page, setPage]                 = useState(1);
    const [totalCount, setTotalCount]     = useState(0);
    const [expanded, setExpanded]         = useState({});
    const [expandedV, setExpandedV]       = useState({});

    // Rikiavimas
    const [sortCol, setSortCol]   = useState('name');
    const [sortDir, setSortDir]   = useState('asc');

    // Modalai
    const [showItemModal, setShowItemModal]       = useState(false);
    const [selectedItem, setSelectedItem]         = useState(null);
    const [showVariantModal, setShowVariantModal] = useState(false);
    const [selectedVariant, setSelectedVariant]   = useState(null);
    const [variantItemCtx, setVariantItemCtx]     = useState(null);
    const [showBatchModal, setShowBatchModal]     = useState(false);
    const [selectedBatch, setSelectedBatch]       = useState(null);
    const [batchVariantCtx, setBatchVariantCtx]   = useState(null);

    const fetchItems = useCallback(async (p = page, s = search, a = activeFilter) => {
        setLoading(true);
        try {
            const params = { page: p, per_page: PAGE_SIZE };
            if (s) params.search = s;
            if (a !== 'all') params.is_active = a === 'active';
            const res = await axios.get('/v2/inventory/overview', { params });
            setItems(res.data.data || []);
            setTotalCount(res.data.meta?.total ?? 0);
        } catch {
            toast.error('Klaida kraunant duomenis');
        } finally {
            setLoading(false);
        }
    }, [page, search, activeFilter]);

    useEffect(() => {
        fetchItems(page, search, activeFilter);
    }, [page, activeFilter]);

    const doSearch = () => { setPage(1); fetchItems(1, search, activeFilter); };

    const toggleItem    = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }));
    const toggleVariant = (id) => setExpandedV(p => ({ ...p, [id]: !p[id] }));

    const handleSort = (col) => {
        if (sortCol === col) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortCol(col);
            setSortDir('asc');
        }
    };

    const sortedItems = [...items].sort((a, b) => {
        let aVal, bVal;
        if (sortCol === 'name')    { aVal = a.name;  bVal = b.name; }
        else if (sortCol === 'code')  { aVal = a.code;  bVal = b.code; }
        else if (sortCol === 'stock') {
            aVal = a.variants?.reduce((s, v) => s + (v.total_stock || 0), 0) || 0;
            bVal = b.variants?.reduce((s, v) => s + (v.total_stock || 0), 0) || 0;
        }
        else if (sortCol === 'variants') { aVal = a.variants_count || 0; bVal = b.variants_count || 0; }
        if (typeof aVal === 'string') return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });

    const SortTh = ({ col, children, className = '' }) => {
        const active = sortCol === col;
        return (
            <th className={`${className}`} style={{ cursor: 'pointer', userSelect: 'none' }}
                onClick={() => handleSort(col)}>
                {children}
                <span className="ms-1" style={{ opacity: active ? 1 : 0.3 }}>
                    {active ? (sortDir === 'asc' ? '▲' : '▼') : '▲'}
                </span>
            </th>
        );
    };

    const deleteItem = async (item) => {
        if (!window.confirm(`Ištrinti „${item.name}"?`)) return;
        try {
            await axios.delete(`/v2/inventory/items/${item.id}`);
            toast.success('Daiktas ištrintas.');
            fetchItems(page, search, activeFilter);
        } catch (e) { toast.error(e.response?.data?.message || 'Klaida'); }
    };

    const deleteVariant = async (v) => {
        if (!window.confirm(`Ištrinti variantą „${v.sku}"?`)) return;
        try {
            await axios.delete(`/v2/inventory/variants/${v.id}`);
            toast.success('Variantas ištrintas.');
            fetchItems(page, search, activeFilter);
        } catch (e) { toast.error(e.response?.data?.message || 'Klaida'); }
    };

    const deleteBatch = async (b) => {
        if (!window.confirm(`Ištrinti partiją?`)) return;
        try {
            await axios.delete(`/v2/inventory/batches/${b.id}`);
            toast.success('Partija ištrinta.');
            fetchItems(page, search, activeFilter);
        } catch (e) { toast.error(e.response?.data?.message || 'Klaida'); }
    };

    const fmt = (d) => d ? new Date(d).toLocaleDateString('lt-LT') : '—';

    const expirationCell = (b) => {
        if (!b.expiration_date) return <span className="text-muted">—</span>;
        if (b.is_expired) return <span className="text-danger fw-bold">{fmt(b.expiration_date)} <small>(pasibaigė)</small></span>;
        const d = Math.ceil((new Date(b.expiration_date) - new Date()) / 86400000);
        if (d <= 30) return <span className="text-warning fw-bold">{fmt(b.expiration_date)} <small>({d}d.)</small></span>;
        return <span>{fmt(b.expiration_date)}</span>;
    };

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    return (
        <div className="container-fluid mt-4" style={{ paddingTop: '70px' }}>

            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h3>Inventoriaus peržiūra</h3>
                <div className="d-flex gap-2">
                    <Link to="/v2/import" className="btn btn-outline-success btn-sm">Excel importas</Link>
                    <button className="btn btn-primary btn-sm"
                            onClick={() => { setSelectedItem(null); setShowItemModal(true); }}>
                        + Naujas daiktas
                    </button>
                </div>
            </div>

            {/* Filtrai */}
            <div className="row g-2 mb-3">
                <div className="col-md-5">
                    <div className="input-group">
                        <input
                            className="form-control"
                            placeholder="Paieška pagal kodą, pavadinimą, SKU..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && doSearch()}
                        />
                        <button className="btn btn-primary" onClick={doSearch}>Ieškoti</button>
                        {search && (
                            <button className="btn btn-outline-secondary"
                                    onClick={() => { setSearch(''); setPage(1); fetchItems(1, '', activeFilter); }}>
                                ✕
                            </button>
                        )}
                    </div>
                </div>
                <div className="col-md-2">
                    <select className="form-select" value={activeFilter}
                            onChange={e => { setActiveFilter(e.target.value); setPage(1); }}>
                        <option value="all">Visi</option>
                        <option value="active">Tik aktyvūs</option>
                        <option value="inactive">Tik neaktyvūs</option>
                    </select>
                </div>
                <div className="col-auto d-flex gap-2">
                    <button className="btn btn-outline-secondary"
                            onClick={() => setExpanded(items.reduce((a, i) => ({ ...a, [i.id]: true }), {}))}>
                        Išskleisti viską
                    </button>
                    <button className="btn btn-outline-secondary"
                            onClick={() => { setExpanded({}); setExpandedV({}); }}>
                        Suskleisti
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-5"><div className="spinner-border" /></div>
            ) : (
                <>
                    <div className="table-responsive">
                        <table className="table table-bordered table-hover mb-0"
                               style={{ fontSize: '0.95rem' }}>
                            <thead className="table-dark">
                            <tr>
                                <th style={{ width: '36px' }}></th>
                                <SortTh col="code">Kodas</SortTh>
                                <SortTh col="name">Pavadinimas</SortTh>
                                <th>Savybės</th>
                                <SortTh col="variants" className="text-center">Variantai</SortTh>
                                <th className="text-end">Vnt.</th>
                                <SortTh col="stock" className="text-end">Iš viso likutis</SortTh>
                                <th className="text-end">Pasibaigę</th>
                                <th style={{ width: '220px' }}>Veiksmai</th>
                            </tr>
                            </thead>
                            <tbody style={{ fontSize: '0.95rem' }}>
                            {sortedItems.length === 0 ? (
                                <tr><td colSpan={9} className="text-center text-muted py-4">Nėra duomenų</td></tr>
                            ) : sortedItems.map(item => {
                                const isOpen = !!expanded[item.id];
                                const totalStock = item.variants?.reduce((s, v) => s + (v.total_stock || 0), 0) || 0;
                                const totalExpired = item.variants?.reduce((s, v) =>
                                    s + (v.batches?.filter(b => b.is_expired).reduce((bs, b) => bs + parseFloat(b.quantity_remaining || 0), 0) || 0), 0) || 0;

                                return (
                                    <React.Fragment key={item.id}>
                                        {/* ITEM ROW */}
                                        <tr
                                            className={isOpen ? '' : 'table-light'}
                                            style={{
                                                cursor: 'pointer',
                                                backgroundColor: isOpen ? '#e8f0fb' : undefined
                                            }}
                                            onClick={() => toggleItem(item.id)}
                                        >
                                            <td className="text-center align-middle">
                                                    <span style={{
                                                        display: 'inline-block',
                                                        transform: isOpen ? 'rotate(180deg)' : 'rotate(90deg)',
                                                        transition: 'transform 0.15s',
                                                        fontSize: '12px',
                                                        color: '#000',
                                                    }}>▼</span>
                                            </td>
                                            <td className="align-middle"><code
                                                style={{fontSize: '0.9rem'}}>{item.code}</code></td>
                                            <td className="align-middle">
                                                <strong>{item.name}</strong>
                                                {item.description && (
                                                    <div><small className="text-muted">{item.description}</small></div>
                                                )}
                                            </td>
                                            <td className="align-middle">
                                                {item.is_expirable &&
                                                    <span className="badge bg-warning text-dark me-1">Galiojimas</span>}
                                                {item.is_asset && <span className="badge bg-info me-1">Turtas</span>}
                                                {item.is_serialized &&
                                                    <span className="badge bg-secondary me-1">Serijinis</span>}
                                                {!item.is_active && <span className="badge bg-danger">Neaktyvus</span>}
                                            </td>
                                            <td className="text-center align-middle">
                                                <span className="badge bg-secondary">{item.variants_count ?? 0}</span>
                                            </td>
                                            <td className="text-end align-middle text-muted">{item.unit_of_measure}</td>
                                            <td className="text-end align-middle">
                                                    <span
                                                        className={`fw-bold ${totalStock > 0 ? 'text-success' : 'text-muted'}`}>
                                                        {totalStock % 1 === 0 ? totalStock : totalStock.toFixed(2)}
                                                    </span>
                                            </td>
                                            <td className="text-end align-middle">
                                                {totalExpired > 0
                                                    ? <span
                                                        className="text-danger fw-bold">{totalExpired % 1 === 0 ? totalExpired : totalExpired.toFixed(2)}</span>
                                                    : <span className="text-muted">—</span>}
                                            </td>
                                            <td className="align-middle" onClick={e => e.stopPropagation()}>
                                                <div className="d-flex gap-1 flex-nowrap">
                                                    <button className="btn btn-sm btn-outline-primary text-nowrap"
                                                            onClick={() => {
                                                                setVariantItemCtx(item);
                                                                setSelectedVariant(null);
                                                                setShowVariantModal(true);
                                                            }}>
                                                        + Variantas
                                                    </button>
                                                    <button className="btn btn-sm btn-outline-warning" onClick={() => {
                                                        setSelectedItem(item);
                                                        setShowItemModal(true);
                                                    }}>Redaguoti
                                                    </button>
                                                    <button className="btn btn-sm btn-outline-danger"
                                                            onClick={() => deleteItem(item)}>
                                                        Šalinti
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>

                                        {/* VARIANTS */}
                                        {isOpen && item.variants?.map(v => {
                                            const vOpen = !!expandedV[v.id];
                                            const vStock = v.total_stock || 0;

                                            return (
                                                <React.Fragment key={v.id}>
                                                    {/* VARIANT ROW */}
                                                    <tr style={{ backgroundColor: '#edf2e8', cursor: v.batches?.length > 0 ? 'pointer' : 'default' }}
                                                        onClick={() => v.batches?.length > 0 && toggleVariant(v.id)}>
                                                        <td className="text-center align-middle ps-3">
                                                            {v.batches?.length > 0 && (
                                                                <span style={{
                                                                    display: 'inline-block',
                                                                    transform: vOpen ? 'rotate(180deg)' : 'rotate(90deg)',
                                                                    transition: 'transform 0.15s',
                                                                    fontSize: '11px',
                                                                    color: '#000',
                                                                }}>▼</span>
                                                            )}
                                                        </td>
                                                        <td className="align-middle ps-4" colSpan={2}>
                                                            <code style={{ fontSize: '0.88rem' }}>{v.sku}</code>
                                                            <span className="ms-2 text-muted">{v.name}</span>
                                                            {v.size  && <span className="badge bg-secondary ms-1">{v.size}</span>}
                                                            {v.color && <span className="badge bg-light text-dark border ms-1">{v.color}</span>}
                                                        </td>
                                                        <td className="align-middle">
                                                                <span className={`badge ${v.is_active ? 'bg-success' : 'bg-danger'}`}>
                                                                    {v.is_active ? 'Aktyvus' : 'Neaktyvus'}
                                                                </span>
                                                            {v.batches?.length > 0 && (
                                                                <span className="badge bg-light text-dark border ms-1">
                                                                        {v.batches.length} partij{v.batches.length === 1 ? 'a' : 'os'}
                                                                    </span>
                                                            )}
                                                        </td>
                                                        <td></td>
                                                        <td></td>
                                                        <td className="text-end align-middle">
                                                                <span className={`fw-bold ${vStock > 0 ? 'text-success' : 'text-muted'}`}>
                                                                    {vStock % 1 === 0 ? vStock : vStock.toFixed(2)}
                                                                </span>
                                                        </td>
                                                        <td></td>
                                                        <td className="align-middle" onClick={e => e.stopPropagation()}>
                                                            <div className="d-flex gap-1 flex-nowrap">
                                                                <button className="btn btn-sm btn-outline-primary"
                                                                        onClick={() => { setBatchVariantCtx(v); setSelectedBatch(null); setShowBatchModal(true); }}>
                                                                    + Partija
                                                                </button>
                                                                <button className="btn btn-sm btn-outline-warning"
                                                                        onClick={() => { setSelectedVariant(v); setVariantItemCtx(item); setShowVariantModal(true); }}>
                                                                    Redaguoti
                                                                </button>
                                                                <button className="btn btn-sm btn-outline-danger"
                                                                        onClick={() => deleteVariant(v)}>
                                                                    Šalinti
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>

                                                    {/* BATCHES */}
                                                    {vOpen && v.batches?.map(b => (
                                                        <tr key={b.id} className={b.is_expired ? 'table-danger' : ''} style={{ backgroundColor: b.is_expired ? '#f8d7da' : '#f0f4f8' }}>
                                                            <td></td>
                                                            <td className="ps-5 align-middle" colSpan={2}>
                                                                {b.batch_number
                                                                    ? <code>{b.batch_number}</code>
                                                                    : <span className="text-muted">#{b.id}</span>}
                                                                <span className="text-muted ms-2 small">Gauta: {fmt(b.received_date)}</span>
                                                            </td>
                                                            <td className="align-middle">
                                                                <small className="text-muted">{b.source_reference || '—'}</small>
                                                            </td>
                                                            <td></td>
                                                            <td className="text-end align-middle text-muted">{b.quantity_initial}</td>
                                                            <td className="text-end align-middle">
                                                                    <span className={`fw-bold ${parseFloat(b.quantity_remaining) > 0 ? 'text-success' : 'text-muted'}`}>
                                                                        {b.quantity_remaining}
                                                                    </span>
                                                            </td>
                                                            <td className="align-middle">{expirationCell(b)}</td>
                                                            <td className="align-middle">
                                                                <div className="d-flex gap-1 flex-nowrap">
                                                                    <button className="btn btn-sm btn-outline-warning"
                                                                            onClick={() => { setSelectedBatch(b); setBatchVariantCtx(v); setShowBatchModal(true); }}>
                                                                        Redaguoti
                                                                    </button>
                                                                    <button className="btn btn-sm btn-outline-danger"
                                                                            onClick={() => deleteBatch(b)}>
                                                                        Šalinti
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </React.Fragment>
                                            );
                                        })}
                                    </React.Fragment>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>

                    {/* Paginacija */}
                    {totalPages > 1 && (
                        <div className="d-flex justify-content-between align-items-center mt-3">
                            <small className="text-muted">
                                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalCount)} iš {totalCount} daiktų
                            </small>
                            <ul className="pagination pagination-sm mb-0">
                                <li className={`page-item ${page <= 1 ? 'disabled' : ''}`}>
                                    <button className="page-link" onClick={() => setPage(p => p - 1)}>‹</button>
                                </li>
                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                                    .reduce((acc, p, i, arr) => {
                                        if (i > 0 && p - arr[i - 1] > 1) acc.push('...');
                                        acc.push(p); return acc;
                                    }, [])
                                    .map((p, i) => p === '...'
                                        ? <li key={`e${i}`} className="page-item disabled"><span className="page-link">…</span></li>
                                        : <li key={p} className={`page-item ${p === page ? 'active' : ''}`}>
                                            <button className="page-link" onClick={() => setPage(p)}>{p}</button>
                                        </li>
                                    )
                                }
                                <li className={`page-item ${page >= totalPages ? 'disabled' : ''}`}>
                                    <button className="page-link" onClick={() => setPage(p => p + 1)}>›</button>
                                </li>
                            </ul>
                        </div>
                    )}
                </>
            )}

            {/* Modalai */}
            <InventoryItemFormModal
                show={showItemModal}
                item={selectedItem}
                onClose={() => setShowItemModal(false)}
                onSuccess={() => { setShowItemModal(false); fetchItems(page, search, activeFilter); }}
            />
            <StockBatchFormModal
                show={showBatchModal}
                batch={selectedBatch}
                presetVariantId={batchVariantCtx?.id}
                onClose={() => setShowBatchModal(false)}
                onSuccess={() => { setShowBatchModal(false); fetchItems(page, search, activeFilter); }}
            />
            <ItemVariantFormModal
                show={showVariantModal}
                variant={selectedVariant}
                itemId={variantItemCtx?.id}
                itemName={variantItemCtx?.name}
                itemCode={variantItemCtx?.code}
                onClose={() => setShowVariantModal(false)}
                onSuccess={() => { setShowVariantModal(false); fetchItems(page, search, activeFilter); }}
            />
        </div>
    );
};

export default InventoryOverviewView;