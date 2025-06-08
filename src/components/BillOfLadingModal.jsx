import React, { useEffect, useState } from 'react';
import axios from '../axios';

const BillOfLadingModal = ({ show, onClose, selectedItems, onConfirm }) => {
    const [departments, setDepartments] = useState([]);
    const [selectedDept, setSelectedDept] = useState('');
    const [quantities, setQuantities] = useState({});
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchDepartments = async () => {
            const token = localStorage.getItem('authToken');
            const res = await axios.get('/departments', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDepartments(res.data.data);
        };
        fetchDepartments();
    }, []);

    useEffect(() => {
        const initial = {};
        selectedItems.forEach(item => {
            initial[item.id_Item] = item.Quantity;
        });
        setQuantities(initial);
    }, [selectedItems]);

    const handleConfirm = async () => {
        if (!selectedDept) {
            alert('Pasirinkite rinktinę.');
            return;
        }

        setLoading(true);
        const token = localStorage.getItem('authToken');

        try {
            const orderPayload = {
                type: 'Issue',
                comment,
                items: selectedItems.map(item => ({
                    item_id: item.id_Item,
                    quantity: quantities[item.id_Item] || 1,
                })),
            };

            const orderRes = await axios.post('/orders/full', orderPayload, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const orderId = orderRes.data?.order_id;
            if (!orderId) throw new Error('Užsakymo ID negautas.');

            const sum = selectedItems.reduce((total, item) =>
                total + (item.Price || 0) * (quantities[item.id_Item] || 1), 0);

            const payload = {
                Date: new Date().toISOString().slice(0, 10),
                Sum: sum,
                Type: 1,
                fkOrderid_Order: orderId,
                department_id: selectedDept,
                items: selectedItems.map(item => ({
                    item_id: item.id_Item,
                    quantity: quantities[item.id_Item] || 1
                })),
                comment,
            };

            const billRes = await axios.post('/billoflading/create', payload, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const fileUrl = billRes.data?.file;
            if (!fileUrl) throw new Error('Važtaraščio PDF nuoroda negauta.');

            const link = document.createElement('a');
            link.href = fileUrl;
            link.download = `vaztarastis_${billRes.data.bill_id}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            onConfirm();
        } catch (e) {
            console.error(e);
            alert('Nepavyko sukurti važtaraščio.');
        } finally {
            setLoading(false);
        }
    };

    if (!show) return null;

    return (
        <div className="modal d-block">
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Perduoti rinktinei</h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body">
                        <div className="mb-3">
                            <label>Pasirinkite rinktinę:</label>
                            <select className="form-select" value={selectedDept} onChange={e => setSelectedDept(e.target.value)}>
                                <option value="">- Pasirinkti -</option>
                                {departments.map(dept => (
                                    <option key={dept.id_Department} value={dept.id_Department}>{dept.Name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="mb-3">
                            <label>Komentaras:</label>
                            <textarea className="form-control" value={comment} onChange={e => setComment(e.target.value)} />
                        </div>

                        <h6>Pasirinkti daiktai:</h6>
                        {selectedItems.map(item => (
                            <div key={item.id_Item} className="mb-2">
                                {item.Name} ({item.InventoryNumber}) – max: {item.Quantity}
                                <input
                                    type="number"
                                    value={quantities[item.id_Item] || 1}
                                    onChange={e => setQuantities(prev => ({
                                        ...prev,
                                        [item.id_Item]: parseInt(e.target.value)
                                    }))}
                                    className="form-control mt-1"
                                    min="1"
                                    max={item.Quantity}
                                />
                            </div>
                        ))}
                    </div>
                    <div className="modal-footer">
                        <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Atšaukti</button>
                        <button className="btn btn-success" onClick={handleConfirm} disabled={loading}>
                            {loading ? 'Kuriama...' : 'Sukurti važtaraštį'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BillOfLadingModal;
