import React, { useEffect, useState } from 'react';
import axios from '../axios';
import ItemAddForm from '../components/ItemAddForm';
import ItemImport from '../components/ItemImport';
import ItemEditForm from '../components/ItemEditForm';
import ItemWriteOffModal from '../components/ItemWriteOffModal';
import BillOfLadingModal from '../components/BillOfLadingModal';
import {toast} from "react-toastify";

const InventoryView = () => {
    const [items, setItems] = useState([]);
    const [error, setError] = useState(null);
    const [showImportModal, setShowImportModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedItems, setSelectedItems] = useState([]);
    const [showWriteOffModal, setShowWriteOffModal] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showBillModal, setShowBillModal] = useState(false);
    const [selectedItemsData, setSelectedItemsData] = useState([]);

    const handleTransferToDepartment = () => {
        if (selectedItems.length === 0) {
            toast.error('Pasirinkite bent vieną daiktą.');
            return;
        }

        const selected = items
            .filter(item => selectedItems.includes(item.id_Item))
            .map(item => ({
                ...item,
                quantity: 1 // numatytas kiekis, vėliau keičiamas
            }));

        setSelectedItemsData(selected);
        setShowBillModal(true);
    };


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
    const handleBillSubmit = async (departmentId, items) => {
        const token = localStorage.getItem('authToken');
        try {
            // 1. Sukuriamas susijęs užsakymas
            const orderPayload = {
                type: 'Issue',
                comment: '',
                items: items.map(item => ({
                    item_id: item.id_Item,
                    quantity: item.quantity
                })),
                target_user_id: null, // Kadangi perduodama rinktinei, nurodoma null
            };

            const orderRes = await axios.post('/orders/full', orderPayload, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const orderId = orderRes.data?.order_id;
            if (!orderId) throw new Error('Užsakymo ID negautas');

            // 2. Apskaičiuojama suma
            const sum = items.reduce((total, item) =>
                total + (item.Price || 0) * item.quantity, 0);

            // 3. Sukuriamas važtaraštis
            const billPayload = {
                Date: new Date().toISOString().slice(0, 10),
                Sum: sum,
                Type: 1,
                fkOrderid_Order: orderId,
                department_id: departmentId,
                items: items.map(item => ({
                    item_id: item.id_Item,
                    quantity: item.quantity
                })),
                comment: '',
            };

            const billRes = await axios.post('/billoflading/create', billPayload, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const billId = billRes.data?.bill_id;
            if (!billId) throw new Error('Važtaraščio ID nerastas');

            // 4. Parsisiunčiamas PDF failas naudojant `axios` (su token)
            const pdfRes = await axios.get(`/billoflading/pdf/${billId}`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob',
            });

            // 5. Sukuriama atsisiunčiamo failo nuoroda
            const blob = new Blob([pdfRes.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `vaztarastis_${billId}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success('Važtaraštis sukurtas ir atsisiųstas.');
            setShowBillModal(false);
            setSelectedItems([]);
        } catch (err) {
            console.error(err);
            toast.error('Klaida kuriant važtaraštį.');
        }
    };



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

                <button className="btn btn-secondary" onClick={handleTransferToDepartment}>
                    Perduoti rinktinei
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
            <BillOfLadingModal
                isOpen={showBillModal}
                onClose={() => setShowBillModal(false)}
                items={selectedItemsData}
                onSubmit={handleBillSubmit}
            />
        </div>
    );
};

export default InventoryView;
