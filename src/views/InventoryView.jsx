import React, { useEffect, useState } from 'react';
import axios from '../axios';
import ItemAddForm from '../components/ItemAddForm';
import ItemImport from '../components/ItemImport';
import ItemEditForm from '../components/ItemEditForm';
import ItemWriteOffModal from '../components/ItemWriteOffModal';

const InventoryView = () => {
    const [items, setItems] = useState([]);
    const [error, setError] = useState(null);
    const [showImportModal, setShowImportModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedItems, setSelectedItems] = useState([]);
    const [showWriteOffModal, setShowWriteOffModal] = useState(false);

    const handleSelect = (itemId) => {
        setSelectedItems(prev =>
            prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
        );
    };

    const handleWriteOffConfirmed = (writeOffIds) => {
        setItems(prev => prev.filter(item => !writeOffIds.includes(item.id_Item)));
        setSelectedItems([]);
    };

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
                    headers: { Authorization: `Bearer ${token}` }
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

            <div className="d-flex gap-2 mb-3">
                <button className="btn btn-primary" onClick={() => setShowImportModal(true)}>
                    Importuoti iš Excel
                </button>

                <button
                    className="btn btn-danger"
                    onClick={() => setShowWriteOffModal(true)}
                    disabled={selectedItems.length === 0}
                >
                    Nurašyti pasirinktus daiktus
                </button>
            </div>

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
                        <th>Pasirinkti</th>
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
                            <td>
                                <input
                                    type="checkbox"
                                    checked={selectedItems.includes(item.id_Item)}
                                    onChange={() => handleSelect(item.id_Item)}
                                />
                            </td>
                            <td>{item.Name}</td>
                            <td>{item.Description}</td>
                            <td>{item.Price}</td>
                            <td>{item.InventoryNumber}</td>
                            <td>{item.Quantity}</td>
                            <td>{item.UnitOfMeasure}</td>
                            <td>
                                <button
                                    className="btn btn-sm btn-warning"
                                    onClick={() => handleEdit(item)}
                                >
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

            <ItemWriteOffModal
                show={showWriteOffModal}
                onClose={() => setShowWriteOffModal(false)}
                selectedItemIds={selectedItems}
                allItems={items}
                onConfirm={handleWriteOffConfirmed}
            />
        </div>
    );
};

export default InventoryView;
