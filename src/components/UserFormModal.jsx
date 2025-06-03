import React, { useEffect, useState } from 'react';
import axios from '../axios';
import { toast } from 'react-toastify';

const UserFormModal = ({ show, user, onClose, onSuccess }) => {
    const [name, setName] = useState('');
    const [surname, setSurname] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [roles, setRoles] = useState([]);
    const [selectedRoleIds, setSelectedRoleIds] = useState([]);

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        const fetchRoles = async () => {
            try {
                const res = await axios.get('/roles', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setRoles(res.data.data || []);
            } catch (error) {
                toast.error('Nepavyko gauti rolių.');
            }
        };
        if (show) fetchRoles();
    }, [show]);

    useEffect(() => {
        if (user) {
            setName(user.Name || '');
            setSurname(user.Surname || '');
            setUsername(user.Username || '');
            setEmail(user.Email || '');
            setPassword('');
            setConfirmPassword('');

            const roleIds = user.user_roles?.map(ur => ur.fkRoleid_Role) || [];
            setSelectedRoleIds(roleIds);
        } else {
            resetForm();
        }
    }, [user]);

    const resetForm = () => {
        setName('');
        setSurname('');
        setUsername('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setSelectedRoleIds([]);
    };

    const handleRoleToggle = (id) => {
        setSelectedRoleIds(prev =>
            prev.includes(id)
                ? prev.filter(rid => rid !== id)
                : [...prev, id]
        );
    };

    const handleSubmit = async () => {
        const token = localStorage.getItem('authToken');
        const payload = {
            Name: name,
            Surname: surname,
            Username: username,
            Email: email,
            Password: password || undefined,
            Password_confirmation: confirmPassword || undefined,
            RoleIds: selectedRoleIds
        };

        try {
            if (user) {
                await axios.put(`/users/${user.id_User}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post('/users', payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            toast.success('Naudotojas išsaugotas sėkmingai!');
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error('Klaida išsaugant naudotoją.');
        }
    };

    if (!show) return null;

    return (
        <div className="modal d-block" tabIndex="-1">
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">{user ? 'Redaguoti naudotoją' : 'Naujas naudotojas'}</h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body">
                        <div className="mb-3">
                            <label>Vardas</label>
                            <input type="text" className="form-control" value={name} onChange={e => setName(e.target.value)} />
                        </div>
                        <div className="mb-3">
                            <label>Pavardė</label>
                            <input type="text" className="form-control" value={surname} onChange={e => setSurname(e.target.value)} />
                        </div>
                        <div className="mb-3">
                            <label>Naudotojo vardas</label>
                            <input type="text" className="form-control" value={username} onChange={e => setUsername(e.target.value)} />
                        </div>
                        <div className="mb-3">
                            <label>El. paštas</label>
                            <input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} />
                        </div>
                        {!user && (
                            <>
                                <div className="mb-3">
                                    <label>Slaptažodis</label>
                                    <input type="password" className="form-control" value={password} onChange={e => setPassword(e.target.value)} />
                                </div>
                                <div className="mb-3">
                                    <label>Pakartoti slaptažodį</label>
                                    <input type="password" className="form-control" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                                </div>
                            </>
                        )}
                        <div className="mb-3">
                            <label>Rolės</label>
                            {roles.map(role => (
                                <div key={role.id_Role} className="form-check">
                                    <input
                                        type="checkbox"
                                        className="form-check-input"
                                        id={`role-${role.id_Role}`}
                                        checked={selectedRoleIds.includes(role.id_Role)}
                                        onChange={() => handleRoleToggle(role.id_Role)}
                                    />
                                    <label className="form-check-label" htmlFor={`role-${role.id_Role}`}>
                                        {role.Name}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button className="btn btn-secondary" onClick={onClose}>Atšaukti</button>
                        <button className="btn btn-primary" onClick={handleSubmit}>Išsaugoti</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserFormModal;
