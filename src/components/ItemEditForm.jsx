import React, { useState, useEffect } from 'react';
import axios from '../axios';

const ItemEditForm = ({ show, item, onClose, onItemUpdated }) => {
    const [formData, setFormData] = useState({
        Name: '',
        Description: '',
        Price: '',
        InventoryNumber: '',
        UnitOfMeasure: '',
        Quantity: ''
    });
    const [error, setError] = useState(null);

    useEffect(() => {
        if (item) {
            setFormData({
                Name: item.Name || '',
                Description: item.Description || '',
                Price: item.Price || '',
                InventoryNumber: item.InventoryNumber || '',
                UnitOfMeasure: item.UnitOfMeasure || '',
                Quantity: item.Quantity || ''
            });
        }
    }, [item]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.put(`/items/${item.id_Item}`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            onItemUpdated(response.data);
            onClose();
        } catch (err) {
            setError('Redagavimas nepavyko.');
        }
    };

    if (!show) return null;

    return (
        <div className="modal d-block" tabIndex="-1">
            <div className="modal-dialog">
                <div className="modal-content">
                    <form onSubmit={handleSubmit}>
                        <div className="modal-header">
                            <h5 className="modal-title">Redaguoti daiktą</h5>
                            <button type="button" className="btn-close" onClick={onClose}></button>
                        </div>
                        <div className="modal-body">
                            {error && <div className="alert alert-danger">{error}</div>}

                            <div className="mb-3">
                                <label>Pavadinimas</label>
                                <input type="text" name="Name" value={formData.Name} onChange={handleChange} className="form-control" />
                            </div>
                            <div className="mb-3">
                                <label>Aprašymas</label>
                                <input type="text" name="Description" value={formData.Description} onChange={handleChange} className="form-control" />
                            </div>
                            <div className="mb-3">
                                <label>Kaina</label>
                                <input type="number" step="0.01" name="Price" value={formData.Price} onChange={handleChange} className="form-control" />
                            </div>
                            <div className="mb-3">
                                <label>Inventoriaus kodas</label>
                                <input type="text" name="InventoryNumber" value={formData.InventoryNumber} onChange={handleChange} className="form-control" />
                            </div>
                            <div className="mb-3">
                                <label>Matavimo vienetas</label>
                                <input type="text" name="UnitOfMeasure" value={formData.UnitOfMeasure} onChange={handleChange} className="form-control" />
                            </div>
                            <div className="mb-3">
                                <label>Kiekis</label>
                                <input type="number" name="Quantity" value={formData.Quantity} onChange={handleChange} className="form-control" />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={onClose}>Atšaukti</button>
                            <button type="submit" className="btn btn-primary">Išsaugoti</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ItemEditForm;
