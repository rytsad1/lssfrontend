import React, { useState } from 'react';
import axios from '../axios';

const ItemAddForm = ({ onItemAdded }) => {
    const [form, setForm] = useState({
        Name: '',
        Description: '',
        Price: '',
        InventoryNumber: '',
        UnitOfMeasure: '',
        Quantity: '',
    });

    const [error, setError] = useState(null);
    const [show, setShow] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.post('/items', form, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            onItemAdded(response.data);
            setForm({
                Name: '',
                Description: '',
                Price: '',
                InventoryNumber: '',
                UnitOfMeasure: '',
                Quantity: '',

            });
            setError(null);
            setShow(false);
        } catch (err) {
            setError('Klaida pridedant daiktą.');
        }
    };

    return (
        <>
            <button className="btn btn-primary mb-3" onClick={() => setShow(true)}>Pridėti daiktą</button>

            {show && (
                <div className="custom-modal">
                    <div className="custom-modal-content">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5 className="m-0">Pridėti daiktą</h5>
                            <button className="btn-close" onClick={() => setShow(false)}></button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <input type="text" className="form-control mb-2" name="Name" placeholder="Pavadinimas" value={form.Name} onChange={handleChange} required />
                            <input type="text" className="form-control mb-2" name="Description" placeholder="Aprašymas" value={form.Description} onChange={handleChange} />
                            <input type="number" className="form-control mb-2" name="Price" placeholder="Kaina" value={form.Price} onChange={handleChange} required />
                            <input type="text" className="form-control mb-2" name="InventoryNumber" placeholder="Inventoriaus kodas" value={form.InventoryNumber} onChange={handleChange} required />
                            <input type="text" className="form-control mb-2" name="UnitOfMeasure" placeholder="Matavimo vnt." value={form.UnitOfMeasure} onChange={handleChange} required />
                            <input type="number" className="form-control mb-2" name="Quantity" placeholder="Kiekis" value={form.Quantity} onChange={handleChange} required />

                            {error && <div className="alert alert-danger">{error}</div>}

                            <div className="d-flex justify-content-end">
                                <button type="button" className="btn btn-secondary me-2" onClick={() => setShow(false)}>Atšaukti</button>
                                <button type="submit" className="btn btn-success">Išsaugoti</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default ItemAddForm;
