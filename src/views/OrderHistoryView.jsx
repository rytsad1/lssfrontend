// src/components/OrderHistoryView.jsx
import React, { useEffect, useState } from 'react';
import axios from '../axios';
import { toast } from 'react-toastify';

const OrderHistoryView = () => {
    const [history, setHistory] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const token = localStorage.getItem('authToken');
                const response = await axios.get('/orderhistory', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setHistory(response.data.data);
            } catch (err) {
                console.error(err);
                setError('Nepavyko gauti užsakymų istorijos.');
                toast.error('Klaida gaunant istoriją.');
            }
        };

        fetchHistory();
    }, []);

    const translateOrderType = (type) => {
        switch (type) {
            case 'Issue':
                return 'Išdavimas';
            case 'Return':
                return 'Grąžinimas';
            default:
                return type || '-';
        }
    };

    if (error) return <p>{error}</p>;

    return (
        <div>
            <h3>Užsakymų istorija</h3>
            {history.length === 0 ? (
                <p>Užsakymų istorija tuščia.</p>
            ) : (
                <table className="table table-bordered">
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Veiksmas</th>
                            <th>Komentaras</th>
                            <th>Naudotojas</th>
                            <th>Tipas</th>
                            <th>Užsakyti daiktai</th>
                        </tr>
                    </thead>
                    <tbody>
                        {history.map(h => (
                            <tr key={h.id_OrderHistory}>
                                <td>{h.Date}</td>
                                <td>{h.Action}</td>
                                <td>{h.Comment}</td>
                                <td>{h.performed_by?.Name} ({h.performed_by?.Email})</td>
                                <td>{translateOrderType(h.order?.OrderType)}</td>
                                <td>
                                    {h.order?.OrderItems?.map((item, idx) => (
                                        <div key={idx}>
                                            {item.Name} ({item.InventoryNumber}) – {item.Quantity} vnt.
                                        </div>
                                    ))}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default OrderHistoryView;
