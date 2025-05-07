import React, { useState } from 'react';
import axios from '../axios';

const ItemImport = ({ show, onClose, onImportSuccess }) => {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState([]);
    const [error, setError] = useState(null);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setError(null);
    };

    const handlePreview = async () => {
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);

        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.post('/items/import/preview', formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                }
            });
            setPreview(response.data);
        } catch (err) {
            setError('Nepavyko gauti peržiūros.');
        }
    };

    const handleImport = async () => {
    try {
        const token = localStorage.getItem('authToken');
        const response = await axios.post('/items/import/confirm',
            { items: preview }, // siunčiame jau peržiūrėtus duomenis, ne failą!
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            }
        );
        onImportSuccess(response.data.imported);
    } catch (err) {
        setError('Importavimas nepavyko.');
    }
};

    if (!show) return null;

    return (
        <div className="modal d-block" tabIndex="-1">
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Importuoti daiktus</h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body">
                        {error && <div className="alert alert-danger">{error}</div>}
                        <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} className="form-control" />
                        <button onClick={handlePreview} className="btn btn-secondary mt-2">Peržiūrėti</button>

                        {preview.length > 0 && (
                            <div className="mt-4">
                                <h6>Peržiūra:</h6>
                                <table className="table table-bordered">
                                    <thead>
                                        <tr>
                                            <th>Pavadinimas</th>
                                            <th>Kodas</th>
                                            <th>Kaina</th>
                                            <th>Kiekis</th>
                                            <th>Matas</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {preview.map((item, index) => (
                                            <tr key={index}>
                                                <td>{item.Name}</td>
                                                <td>{item.InventoryNumber}</td>
                                                <td>{item.Price}</td>
                                                <td>{item.Quantity}</td>
                                                <td>{item.UnitOfMeasure}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                    <div className="modal-footer">
                        <button className="btn btn-secondary" onClick={onClose}>Atšaukti</button>
                        <button className="btn btn-success" onClick={handleImport} disabled={!preview.length}>
                            Importuoti
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ItemImport;
