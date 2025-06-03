import React, { useEffect, useState } from 'react';
import axios from '../axios';
import { toast } from 'react-toastify';

const WriteOffLogView = () => {
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.get('/writeoff-logs', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLogs(response.data);
        } catch (error) {
            toast.error('Nepavyko gauti nurašymo žurnalo duomenų.');
        }
    };

    return (
        <div className="container mt-4">
            <h3>Nurašymo žurnalas</h3>
            <table className="table table-striped">
                <thead>
                <tr>
                    <th>Data</th>
                    <th>Daikto pavadinimas</th>
                    <th>Kiekis</th>
                    <th>Priežastis</th>
                    <th>Inventorinis Nr.</th>
                    <th>Vartotojas</th>
                </tr>
                </thead>
                <tbody>
                {logs.map((log) => (
                    <tr key={log.id_WriteOffLog}>
                        <td>{log.Date}</td>
                        <td>{log.item?.Name || '–'}</td>
                        <td>{log.Quantity}</td>
                        <td>{log.Reason}</td>
                        <td>{log.item?.InventoryNumber || '–'}</td>
                        <td>
                            {log.handled_by
                                ? `${log.handled_by.Name} ${log.handled_by.Surname}`
                                : '–'}
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};

export default WriteOffLogView;
