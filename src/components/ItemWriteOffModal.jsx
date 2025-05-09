import React, { useEffect, useState } from 'react';
import axios from '../axios';
import { format } from 'date-fns';

const ItemWriteOffModal = ({ show, onClose, selectedItemIds, allItems, onConfirm }) => {
    const [quantities, setQuantities] = useState({});
    const [reasons, setReasons] = useState({});

    useEffect(() => {
        const initialQuantities = {};
        const initialReasons = {};
        selectedItemIds.forEach(id => {
            const item = allItems.find(i => i.id_Item === id);
            if (item) {
                initialQuantities[id] = item.Quantity;
                initialReasons[id] = '';
            }
        });
        setQuantities(initialQuantities);
        setReasons(initialReasons);
    }, [selectedItemIds]);

    const handleQuantityChange = (id, value) => {
        const intValue = parseInt(value, 10);
        if (!isNaN(intValue)) {
            setQuantities(prev => ({ ...prev, [id]: intValue }));
        }
    };

    const handleReasonChange = (id, value) => {
        setReasons(prev => ({ ...prev, [id]: value }));
    };

    const handleConfirm = async () => {
        const payload = selectedItemIds.map(id => ({
            id,
            quantity: quantities[id] || 1,
            reason: reasons[id] || ''
        }));

        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.post('/items/writeoff/confirm', {
                items: payload
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const downloadUrl = response.data.file;
            if (downloadUrl) {
                // Automatinis atsisiuntimas atidarant failą naujame lange
                window.open(downloadUrl, '_blank');
            }

            onConfirm(payload.map(p => p.id));
            onClose();
        } catch (error) {
            alert('Nepavyko nurašyti daiktų.');
        }
    };

    const selectedItems = allItems.filter(item => selectedItemIds.includes(item.id_Item));
    if (!show) return null;

    return (
        <div className="modal d-block" tabIndex="-1">
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Patvirtinti daiktų nurašymą</h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body">
                        <p>Įveskite kiekį ir nurašymo priežastį kiekvienam pasirinktam daiktui:</p>
                        {selectedItems.map(item => (
                            <div key={item.id_Item} className="mb-3">
                                <strong>{item.Name} ({item.InventoryNumber})</strong> – max: {item.Quantity}
                                <div className="d-flex mt-1">
                                    <input
                                        type="number"
                                        min="1"
                                        max={item.Quantity}
                                        value={quantities[item.id_Item] || ''}
                                        onChange={(e) => handleQuantityChange(item.id_Item, e.target.value)}
                                        className="form-control me-2"
                                        placeholder="Kiekis"
                                        style={{ maxWidth: '120px' }}
                                    />
                                    <input
                                        type="text"
                                        value={reasons[item.id_Item] || ''}
                                        onChange={(e) => handleReasonChange(item.id_Item, e.target.value)}
                                        className="form-control"
                                        placeholder="Nurašymo priežastis"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="modal-footer">
                        <button className="btn btn-secondary" onClick={onClose}>Atšaukti</button>
                        <button className="btn btn-danger" onClick={handleConfirm}>Patvirtinti ir nurašyti</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ItemWriteOffModal;
