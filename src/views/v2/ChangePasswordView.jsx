import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../axios';
import { toast } from 'react-toastify';

const ChangePasswordView = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        current_password:      '',
        password:              '',
        password_confirmation: '',
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.password !== form.password_confirmation) {
            toast.error('Slaptažodžiai nesutampa'); return;
        }
        if (form.password.length < 8) {
            toast.error('Slaptažodis turi būti bent 8 simboliai'); return;
        }
        setLoading(true);
        try {
            await axios.post('/v1/change-password', form);
            toast.success('Slaptažodis pakeistas!');
            navigate('/');
        } catch (e) {
            toast.error(e.response?.data?.message || 'Klaida keičiant slaptažodį.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="d-flex justify-content-center align-items-center"
             style={{ minHeight: '100vh', background: '#f8f9fa' }}>
            <div className="card shadow-sm" style={{ width: '100%', maxWidth: '420px' }}>
                <div className="card-header text-center py-3"
                     style={{ background: '#2C5F2D' }}>
                    <h5 className="text-white mb-0">Slaptažodžio keitimas</h5>
                    <small style={{ color: '#97BC62' }}>
                        Privaloma pakeisti prisijungus pirmą kartą
                    </small>
                </div>
                <div className="card-body p-4">
                    <div className="alert alert-warning">
                        <strong>⚠ Būtina pakeisti slaptažodį</strong> prieš naudojantis sistema.
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label className="form-label">Dabartinis slaptažodis *</label>
                            <input
                                type="password"
                                className="form-control"
                                value={form.current_password}
                                onChange={e => setForm(p => ({ ...p, current_password: e.target.value }))}
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Naujas slaptažodis *</label>
                            <input
                                type="password"
                                className="form-control"
                                placeholder="Min. 8 simboliai"
                                value={form.password}
                                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label className="form-label">Pakartoti naują slaptažodį *</label>
                            <input
                                type="password"
                                className="form-control"
                                value={form.password_confirmation}
                                onChange={e => setForm(p => ({ ...p, password_confirmation: e.target.value }))}
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="btn w-100"
                            style={{ background: '#2C5F2D', color: 'white' }}
                            disabled={loading}
                        >
                            {loading ? 'Keičiama...' : 'Pakeisti slaptažodį'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ChangePasswordView;