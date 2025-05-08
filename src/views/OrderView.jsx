// src/components/OrderView.jsx
import React, { useEffect, useState } from 'react';
import axios from '../axios';
import { toast } from 'react-toastify';
import OrderCreateComponent from '../components/OrderCreateComponent';



const OrderView = () => {
  const [orders, setOrders] = useState([]);

  const fetchOrders = async () => {
    const token = localStorage.getItem('authToken');
    try {
      const res = await axios.get('/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(res.data.data || []);
    } catch (error) {
      console.error(error);
      toast.error('Klaida gaunant užsakymus.');
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);



  return (
    <div className="order-view">
      <h2>Užsakymų sąrašas</h2>
      <OrderCreateComponent onSuccess={fetchOrders} />
      <table className="table mt-4">
        <thead>
          <tr>
            <th>ID</th>
            <th>Data</th>
            <th>Naudotojas</th>
            <th>Tipas</th>
            <th>Statusas</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order.id_Order}>
              <td>{order.id_Order}</td>
              <td>{order.Date}</td>
              <td>{order.user?.Name} {order.user?.Surname}</td>
              <td>{order.orderType?.name}</td>
              <td>{order.orderStatus?.name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OrderView;
