// src/components/OrderManagementView.jsx
import React, { useEffect, useState } from 'react';
import axios from '../axios';
import { toast } from 'react-toastify';

const OrderManagementView = () => {
    const [orders, setOrders] = useState([]);
    const [error, setError] = useState(null);

    const fetchOrders = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const res = await axios.get('/orders?status=waiting', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOrders(res.data.data);
        } catch (err) {
            setError('Klaida gaunant užsakymus.');
            toast.error('Nepavyko įkelti užsakymų.');
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleAction = async (orderId, action) => {
        try {
            const token = localStorage.getItem('authToken');
            await axios.post(`/orders/${orderId}/${action}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(`Užsakymas ${action === 'approve' ? 'patvirtintas' : 'atmestas'}.`);
            // Pašalinam iš state lokaliai
            setOrders(prev => prev.filter(o => o.id_Order !== orderId));
        } catch (err) {
            toast.error(`Klaida: nepavyko ${action === 'approve' ? 'patvirtinti' : 'atmesti'} užsakymo.`);
        }
    };


    if (error) return <p>{error}</p>;

    return (
        <div>
            <h3>Užsakymų valdymas</h3>
            {orders.length === 0 ? (
                <p>Šiuo metu nėra laukiančių užsakymų.</p>
            ) : (
                <table className="table table-bordered">
                    <thead>
                    <tr>
                        <th>Data</th>
                        <th>Naudotojas</th>
                        <th>Tipas</th>
                        <th>Komentaras</th>
                        <th>Daiktai</th>
                        <th>Veiksmai</th>
                    </tr>
                    </thead>
                    <tbody>
                    {orders.map(order => (
                        <tr key={order.id_Order}>
                            <td>{order.Date}</td>
                            <td>{order.User?.Name} {order.User?.Surname} ({order.User?.Email})</td>
                            <td>{order.OrderType === 'Issue' ? 'Išdavimas' : 'Grąžinimas'}</td>
                            <td>{order.OrderHistory?.Comment || '-'}</td>
                            <td>
                                {order.OrderItems?.map((item, idx) => (
                                    <div key={idx}>
                                        {item.Name} ({item.InventoryNumber}) – {item.Quantity} vnt.
                                    </div>
                                ))}
                            </td>
                            <td>
                                <button className="btn btn-success btn-sm me-2" onClick={() => handleAction(order.id_Order, 'approve')}>Patvirtinti</button>
                                <button className="btn btn-danger btn-sm" onClick={() => handleAction(order.id_Order, 'reject')}>Atmesti</button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default OrderManagementView;
