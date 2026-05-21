import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../axios';
import NavBar from '../../components/NavBar';

const StockBatchDetailView = () => {

    const { id } = useParams();
    const navigate = useNavigate();

    const [batch, setBatch] = useState(null);
    const [editMode, setEditMode] = useState(false);

    const [form, setForm] = useState({
        quantity_remaining: '',
        expiration_date: '',
        notes: ''
    });

    const fetchBatch = async () => {
        const res = await axios.get(`/v2/inventory/batches/${id}`);
        setBatch(res.data.data);

        setForm({
            quantity_remaining: res.data.data.quantity_remaining,
            expiration_date: res.data.data.expiration_date?.split('T')[0] || '',
            notes: res.data.data.notes || ''
        });
    };

    useEffect(() => {
        fetchBatch();
    }, [id]);

    const handleUpdate = async () => {
        await axios.put(`/v2/inventory/batches/${id}`, form);
        setEditMode(false);
        fetchBatch();
    };

    const handleDelete = async () => {

        if (!window.confirm('Ar tikrai nori ištrinti partiją?')) return;

        await axios.delete(`/v2/inventory/batches/${id}`);
        navigate('/v2/inventory/batches');
    };

    if (!batch) return <div>Loading...</div>;

    const isExpired = new Date(batch.expiration_date) < new Date();

    return (
        <>
            <NavBar />

            <div className="container" style={{ paddingTop: '90px' }}>

                <div className="d-flex justify-content-between align-items-center mb-3">

                    <h3>
                        Batch #{batch.id}{' '}
                        {isExpired && <span className="badge bg-danger">Expired</span>}
                    </h3>

                    <div>
                        <button
                            className="btn btn-outline-primary me-2"
                            onClick={() => setEditMode(!editMode)}
                        >
                            {editMode ? 'Cancel' : 'Edit'}
                        </button>

                        <button
                            className="btn btn-outline-danger"
                            onClick={handleDelete}
                        >
                            Delete
                        </button>
                    </div>

                </div>

                {/* VIEW MODE */}
                {!editMode ? (
                    <div className="card p-3">

                        <p><b>Item:</b> {batch.item_variant?.item?.name}</p>
                        <p><b>Variant:</b> {batch.item_variant?.name}</p>

                        <p><b>Remaining:</b> {batch.quantity_remaining}</p>
                        <p><b>Initial:</b> {batch.quantity_initial}</p>

                        <p><b>Expiration:</b> {batch.expiration_date}</p>

                        <p><b>Status:</b>
                            {isExpired ? (
                                <span className="badge bg-danger ms-2">Expired</span>
                            ) : (
                                <span className="badge bg-success ms-2">Active</span>
                            )}
                        </p>

                        <p><b>Notes:</b> {batch.notes || '-'}</p>

                    </div>
                ) : (
                    /* EDIT MODE */
                    <div className="card p-3">

                        <div className="mb-2">
                            <label>Remaining quantity</label>
                            <input
                                className="form-control"
                                value={form.quantity_remaining}
                                onChange={e =>
                                    setForm({ ...form, quantity_remaining: e.target.value })
                                }
                            />
                        </div>

                        <div className="mb-2">
                            <label>Expiration date</label>
                            <input
                                type="date"
                                className="form-control"
                                value={form.expiration_date}
                                onChange={e =>
                                    setForm({ ...form, expiration_date: e.target.value })
                                }
                            />
                        </div>

                        <div className="mb-2">
                            <label>Notes</label>
                            <textarea
                                className="form-control"
                                value={form.notes || ''}
                                onChange={e =>
                                    setForm({ ...form, notes: e.target.value })
                                }
                            />
                        </div>

                        <button className="btn btn-success" onClick={handleUpdate}>
                            Save changes
                        </button>

                    </div>
                )}

            </div>
        </>
    );
};

export default StockBatchDetailView;