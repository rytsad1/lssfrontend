import React, { useState, useEffect } from 'react';
import axios from '../axios';
import { toast } from 'react-toastify';

const PermissionEditForm = ({ role, permissions, onUpdated }) => {
    const [selectedIds, setSelectedIds] = useState([]);

    // Kai pasikeičia `role`, atnaujinam pažymėtus leidimus
    useEffect(() => {
        if (role?.permissions) {
            setSelectedIds(role.permissions); // Tiksliai kaip gauni iš RoleResource
        } else {
            setSelectedIds([]);
        }
    }, [role]);

    const handleChange = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
        );
    };

    const handleSave = async () => {
        const token = localStorage.getItem('authToken');
        try {
            await axios.put(`/roles/${role.id_Role}/permissions`, {
                permissions: selectedIds
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Leidimai atnaujinti.');
            onUpdated?.();
        } catch (err) {
            console.error(err);
            toast.error('Nepavyko išsaugoti leidimų.');
        }
    };

    return (
        <div>
            <h5>Redaguojama rolė: {role?.Name}</h5>
            <div className="mb-3">
                {permissions.map((perm) => {
                    const id = perm.id_Premission;
                    return (
                        <div key={id} className="form-check">
                            <input
                                type="checkbox"
                                className="form-check-input"
                                id={`perm-${id}`}
                                checked={selectedIds.includes(id)}
                                onChange={() => handleChange(id)}
                            />
                            <label className="form-check-label" htmlFor={`perm-${id}`}>
                                {perm.Name}
                            </label>
                        </div>
                    );
                })}
            </div>
            <button className="btn btn-success" onClick={handleSave}>Išsaugoti</button>
        </div>
    );
};

export default PermissionEditForm;
