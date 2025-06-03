import React, { useEffect, useState } from 'react';
import axios from '../axios';
import { toast } from 'react-toastify';
import PermissionEditForm from '../components/PermissionEditForm';

const PermissionView = () => {
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [selectedRole, setSelectedRole] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRoles();
        fetchPermissions();
    }, []);

    const fetchRoles = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const res = await axios.get('/roles', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRoles(res.data.data);
        } catch (error) {
            toast.error('Nepavyko užkrauti rolių.');
        } finally {
            setLoading(false);
        }
    };

    const fetchPermissions = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const res = await axios.get('/permissions', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPermissions(res.data.data);
        } catch (error) {
            toast.error('Nepavyko užkrauti leidimų.');
        }
    };

    const handleRoleSelect = async (role) => {
        if (!role) return;
        const token = localStorage.getItem('authToken');

        try {
            const res = await axios.get(`/roles/${role.id_Role}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSelectedRole(res.data); // grąžins role su role.permissions (ID masyvas)
        } catch (err) {
            toast.error('Nepavyko užkrauti rolės informacijos.');
        }
    };


    return (
        <div className="container mt-4">
            <h2>Rolių leidimų valdymas</h2>
            {loading ? (
                <p>Kraunama...</p>
            ) : (
                <>
                    <div className="mb-3">
                        <label>Pasirinkite rolę</label>
                        <select
                            className="form-select"
                            value={selectedRole?.id_Role || ''}
                            onChange={(e) =>
                                handleRoleSelect(
                                    roles.find(r => r.id_Role === Number(e.target.value))
                                )
                            }
                        >
                            <option value="">-- Pasirinkite --</option>
                            {roles.map(role => (
                                <option key={role.id_Role} value={role.id_Role}>
                                    {role.Name}
                                </option>
                            ))}
                        </select>
                    </div>
                    {selectedRole && (
                        <PermissionEditForm
                            role={selectedRole}
                            permissions={permissions}
                            onUpdated={fetchRoles}
                        />
                    )}
                </>
            )}
        </div>
    );
};

export default PermissionView;
