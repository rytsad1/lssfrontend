import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify'; // BŪTINAS importas, jei naudoji toast
import 'react-toastify/dist/ReactToastify.css';

// Inline stiliai modalui
const modalBackdropStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999
};

const modalContentStyle = {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    minWidth: '400px',
    maxHeight: '80vh',
    overflowY: 'auto',
};

const BillOfLadingModal = ({ isOpen, onClose, items, onSubmit }) => {
    const [departmentId, setDepartmentId] = useState(null);
    const [editableItems, setEditableItems] = useState(items);

    useEffect(() => {
        setEditableItems(items);
    }, [items]);

    const handleQuantityChange = (id, quantity) => {
        setEditableItems(prev =>
            prev.map(item =>
                item.id_Item === id
                    ? { ...item, quantity: parseInt(quantity) || 1 }
                    : item
            )
        );
    };

    const handleSubmit = () => {
        if (!departmentId) {
            toast.error("Pasirinkite rinktinę");
            return;
        }
        onSubmit(departmentId, editableItems);
    };

    if (!isOpen) return null;

    return (
        <div style={modalBackdropStyle}>
            <div style={modalContentStyle}>
                <h2>Perduoti rinktinei</h2>

                <div className="form-group mb-3">
                    <label>Pasirinkite rinktinę:</label>
                    <select
                        className="form-control"
                        onChange={e => setDepartmentId(e.target.value)}
                        value={departmentId || ''}
                    >
                        <option value="">-- Pasirinkite --</option>
                        <option value="1">Vilniaus rinktinė</option>
                        <option value="2">Kauno rinktinė</option>
                        {/* Pridėkite daugiau rinktinių jei reikia */}
                    </select>
                </div>

                <table className="table table-bordered mt-3">
                    <thead>
                    <tr>
                        <th>Daiktas</th>
                        <th>Kiekis</th>
                    </tr>
                    </thead>
                    <tbody>
                    {editableItems.map(item => (
                        <tr key={item.id_Item}>
                            <td>{item.Name}</td>
                            <td>
                                <input
                                    type="number"
                                    className="form-control"
                                    min="1"
                                    value={item.quantity}
                                    onChange={e =>
                                        handleQuantityChange(item.id_Item, e.target.value)
                                    }
                                />
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>

                <div className="d-flex justify-content-end gap-2 mt-4">
                    <button className="btn btn-success" onClick={handleSubmit}>
                        Patvirtinti ir atsisiųsti
                    </button>
                    <button className="btn btn-secondary" onClick={onClose}>
                        Atšaukti
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BillOfLadingModal;
