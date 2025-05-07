import React, { useEffect, useState } from 'react';
import axios from '../axios';
import { toast } from 'react-toastify';

const UserFormModal = ({ show, user, onClose, onSuccess }) => {
    const [name, setName] = useState('');
    const [surname, setSurname] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [Password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [selectedRoleId, setSelectedRoleId] = useState(null);
    const [selectedPermissionIds, setSelectedPermissionIds] = useState([]);

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        const fetchData = async () => {
            const [rolesRes, permissionsRes] = await Promise.all([
                axios.get('/roles', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('/permissions', { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setRoles(rolesRes.data.data || []);
            setPermissions(permissionsRes.data.data || []);
        };
        if (show) fetchData();
    }, [show]);

    useEffect(() => {
        if (user) {
            setName(user.Name || '');
            setSurname(user.Surname || '');
            setUsername(user.Username || '');
            setEmail(user.Email || '');
            setPassword('');
            setConfirmPassword('');
            if (user.user_roles && user.user_roles[0]) {
                setSelectedRoleId(user.user_roles[0].role?.id_Role || null);
                const permissionIds = user.user_roles[0].role?.role_permissions
                    ?.map(rp => rp.permission?.id_Permission)
                    ?.filter(id => id != null) || [];
                setSelectedPermissionIds(permissionIds);
            }
        } else {
            setName('');
            setSurname('');
            setUsername('');
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            setSelectedRoleId(null);
            setSelectedPermissionIds([]);
        }
    }, [user]);

    const handleCheckboxChange = (id) => {
        setSelectedPermissionIds(prev =>
            prev.includes(id)
                ? prev.filter(pid => pid !== id)
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
            Password: Password || undefined,
            Password_confirmation: confirmPassword || undefined,
            RoleId: selectedRoleId,
            PermissionIds: selectedPermissionIds.filter(id => id != null),

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
                                    <input type="password" className="form-control" value={Password} onChange={e => setPassword(e.target.value)} />
                                </div>
                                <div className="mb-3">
                                    <label>Pakartoti slaptažodį</label>
                                    <input type="password" className="form-control" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                                </div>
                            </>
                        )}
                        <div className="mb-3">
                            <label>Rolė</label>
                            <select className="form-select" value={selectedRoleId || ''} onChange={e => setSelectedRoleId(Number(e.target.value))}>
                                <option value="">Pasirinkite rolę</option>
                                {roles.map(role => (
                                    <option key={role.id_Role} value={role.id_Role}>{role.Name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="mb-3">
                            <label>Teisės</label>
                            {permissions.map(perm => (
                                <div key={perm.id_Premission} className="form-check">
                                    <input
                                        type="checkbox"
                                        className="form-check-input"
                                        id={`perm-${perm.id_Premission}`}
                                        checked={selectedPermissionIds.includes(perm.id_Premission)}
                                        onChange={() => handleCheckboxChange(perm.id_Premission)}
                                    />
                                    <label className="form-check-label" htmlFor={`perm-${perm.id_Premission}`}>
                                        {perm.Name}
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
