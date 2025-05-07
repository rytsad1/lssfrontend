import React, { useEffect, useState } from 'react';
import axios from '../axios';
import ItemAddForm from '../components/ItemAddForm';
import ItemImport from '../components/ItemImport';
import ItemEditForm from '../components/ItemEditForm';

const InventoryView = () => {
    const [items, setItems] = useState([]);
    const [error, setError] = useState(null);
    const [showImportModal, setShowImportModal] = useState(false); // ← čia turi būti
    const [selectedItem, setSelectedItem] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);

    const handleEdit = (item) => {
        setSelectedItem(item);
        setShowEditModal(true);
    };

    const handleItemUpdated = (updatedItem) => {
        setItems(prev => prev.map(i => i.id_Item === updatedItem.id_Item ? updatedItem : i));
    };

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const token = localStorage.getItem('authToken');
                const response = await axios.get('/items', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                setItems(response.data);
            } catch (err) {
                setError('Nepavyko gauti inventoriaus sąrašo.');
            }
        };

        fetchItems();
    }, []);

    return (
        <div className="container mt-5">
            <h2 className="mt-4">Inventoriaus sąrašas</h2>

            {error && <div className="alert alert-danger">{error}</div>}

            <ItemAddForm onItemAdded={(newItem) => setItems(prev => [...prev, newItem])} />

            <button className="btn btn-primary mb-3" onClick={() => setShowImportModal(true)}>
                Importuoti iš Excel
            </button>

            <ItemImport
                show={showImportModal}
                onClose={() => setShowImportModal(false)}
                onImportSuccess={(importedItems) => {
                    setItems(prev => [...prev, ...importedItems]);
                    setShowImportModal(false);
                }}
            />

            {items.length === 0 ? (
                <p>Nėra inventoriaus įrašų.</p>
            ) : (
                <table className="table table-bordered mt-3">
                    <thead>
                    <tr>
                        <th>Pavadinimas</th>
                        <th>Aprašymas</th>
                        <th>Kaina</th>
                        <th>Inventoriaus kodas</th>
                        <th>Kiekis</th>
                        <th>Matavimo vnt.</th>
                        <th>Veiksmai</th>
                    </tr>
                    </thead>
                    <tbody>
                    {items.map((item) => (
                        <tr key={item.id_Item}>
                            <td>{item.Name}</td>
                            <td>{item.Description}</td>
                            <td>{item.Price}</td>
                            <td>{item.InventoryNumber}</td>
                            <td>{item.Quantity}</td>
                            <td>{item.UnitOfMeasure}</td>
                            <td>
                                <button className="btn btn-sm btn-warning me-2" onClick={() => handleEdit(item)}>
                                    Redaguoti
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>

            )}

            <ItemEditForm
                show={showEditModal}
                item={selectedItem}
                onClose={() => setShowEditModal(false)}
                onItemUpdated={handleItemUpdated}
            />

        </div>
    );
};

export default InventoryView;
