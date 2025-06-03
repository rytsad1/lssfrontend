import React, { useState, useEffect } from 'react';
import axios from '../axios';
import { toast } from 'react-toastify';

const OrderCreateComponent = ({ onSuccess }) => {
  const [items, setItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState({});
  const [comment, setComment] = useState('');
  const [isWarehouseManager, setIsWarehouseManager] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const fetchData = async () => {
      try {
        const [itemsRes, roleRes] = await Promise.all([
          axios.get('/items', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/me', { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        setItems(itemsRes.data || []);
        const isManager = roleRes.data.isWarehouseManager || false;
        setIsWarehouseManager(isManager);

        // Tik jei sandėlininkas, siunčiame papildomą užklausą
        if (isManager) {
          const usersRes = await axios.get('/users', {
            headers: { Authorization: `Bearer ${token}` },
          });

          const normalizedUsers = (usersRes.data.data || []).map((user) => ({
            ...user,
            name: user.Name || '',
            email: user.Email || '',
          }));

          setUsers(normalizedUsers);
        }
      } catch (error) {
        console.error(error);
        toast.error('Klaida gaunant duomenis.');
      }
    };
    fetchData();
  }, []);

  const handleSelect = (itemId) => {
    setSelectedItems(prev => {
      const updated = { ...prev };
      if (updated[itemId]) delete updated[itemId];
      else updated[itemId] = 1;
      return updated;
    });
  };

  const handleQuantityChange = (itemId, value) => {
    const quantity = parseInt(value, 10);
    if (!isNaN(quantity) && quantity > 0) {
      setSelectedItems(prev => ({
        ...prev,
        [itemId]: quantity,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (Object.keys(selectedItems).length === 0) {
      toast.error('Pasirinkite bent vieną daiktą.');
      return;
    }

    if (isWarehouseManager && !selectedUserId) {
      toast.error('Pasirinkite vartotoją, kuriam išduodama.');
      return;
    }

    const token = localStorage.getItem('authToken');
    const payload = {
      type: 'Issue', // Užsakymo tipas fiksuotas
      items: Object.entries(selectedItems).map(([itemId, quantity]) => ({
        item_id: Number(itemId),
        quantity: Number(quantity),
      })),
      comment,
    };

    if (isWarehouseManager) {
      payload.target_user_id = selectedUserId;
    }

    try {
      await axios.post('/orders/full', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Užsakymas pateiktas sėkmingai!');
      setSelectedItems({});
      setComment('');
      setSelectedUserId('');
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error(error);
      toast.error('Klaida kuriant užsakymą.');
    }
  };

  return (
      <div className="order-create-form">
        <h3>Naujas užsakymas</h3>
        <form onSubmit={handleSubmit}>
          {isWarehouseManager && (
              <div className="mb-3">
                <label>Pasirinkite vartotoją, kuriam išduodama:</label>
                <select
                    className="form-select"
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    required
                >
                  <option value="">-- Pasirinkite --</option>
                  {users.map((user) => (
                      <option key={user.id_User} value={user.id_User}>
                        {user.name} ({user.email})
                      </option>
                  ))}
                </select>
              </div>
          )}

          <div className="mb-3">
            <label>Komentaras</label>
            <textarea
                className="form-control"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Papildoma informacija"
            />
          </div>

          <h5>Inventoriaus sąrašas</h5>
          {items.length === 0 ? (
              <p>Nėra inventoriaus įrašų.</p>
          ) : (
              <table className="table table-bordered mt-3">
                <thead>
                <tr>
                  <th>Pasirinkti</th>
                  <th>Pavadinimas</th>
                  <th>Aprašymas</th>
                  <th>Kiekis sandėlyje</th>
                  <th>Užsakomas kiekis</th>
                </tr>
                </thead>
                <tbody>
                {items.map((item) => (
                    <tr key={item.id_Item}>
                      <td>
                        <input
                            type="checkbox"
                            checked={selectedItems.hasOwnProperty(item.id_Item)}
                            onChange={() => handleSelect(item.id_Item)}
                        />
                      </td>
                      <td>{item.Name}</td>
                      <td>{item.Description}</td>
                      <td>{item.Quantity}</td>
                      <td>
                        {selectedItems.hasOwnProperty(item.id_Item) && (
                            <input
                                type="number"
                                min="1"
                                max={item.Quantity}
                                className="form-control"
                                value={selectedItems[item.id_Item]}
                                onChange={(e) => handleQuantityChange(item.id_Item, e.target.value)}
                            />
                        )}
                      </td>
                    </tr>
                ))}
                </tbody>
              </table>
          )}

          <button type="submit" className="btn btn-primary">
            Pateikti užsakymą
          </button>
        </form>
      </div>
  );
};

export default OrderCreateComponent;
