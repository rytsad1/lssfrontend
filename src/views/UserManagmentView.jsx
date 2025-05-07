import React, { useEffect, useState } from 'react';
import axios from '../axios';
import UserFormModal from '../components/UserFormModal';

const UserManagementView = () => {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const token = localStorage.getItem('authToken');
    const headers = { Authorization: `Bearer ${token}` };

    const fetchUsers = async () => {
        const response = await axios.get('/users', { headers });
        setUsers(response.data.data);
    };

    const fetchRoles = async () => {
        const response = await axios.get('/roles', { headers });
        setRoles(response.data);
    };

    const fetchPermissions = async () => {
        const response = await axios.get('/permissions', { headers });
        setPermissions(response.data);
    };

    useEffect(() => {
        fetchUsers();
        fetchRoles();
        fetchPermissions();
    }, []);

    const handleEdit = (user) => {
        setSelectedUser(user);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Ar tikrai norite pašalinti naudotoją?')) {
            await axios.delete(`/users/${id}`, { headers });
            fetchUsers();
        }
    };

    return (
        <div className="container mt-4">
            <h3>Naudotojų valdymas</h3>
            <button className="btn btn-primary mb-3" onClick={() => { setSelectedUser(null); setShowModal(true); }}>
                Pridėti naudotoją
            </button>

            <table className="table table-bordered">
                <thead>
                <tr>
                    <th>Vardas</th>
                    <th>El. paštas</th>
                    <th>Veiksmai</th>
                </tr>
                </thead>
                <tbody>
                {users.map(user => (
                    <tr key={user.id_User}>
                        <td>{user.Name}</td>
                        <td>{user.Email}</td>
                        <td>
                            <button className="btn btn-sm btn-warning me-2" onClick={() => handleEdit(user)}>Redaguoti</button>
                            <button className="btn btn-sm btn-danger" onClick={() => handleDelete(user.id_User)}>Šalinti</button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>

            <UserFormModal
                show={showModal}
                user={selectedUser}
                roles={roles}
                permissions={permissions}
                onClose={() => setShowModal(false)}
                onSuccess={fetchUsers}
            />
        </div>
    );
};

export default UserManagementView;
