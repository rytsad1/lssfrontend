import React, { useState, useEffect } from 'react';
import axios from '../axios';
import { toast } from 'react-toastify';

const OrderCreateComponent = ({ onSuccess }) => {
  const [items, setItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState({});
  const [orderType, setOrderType] = useState('');
  const [orderTypes, setOrderTypes] = useState([]);
  const [comment, setComment] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const fetchData = async () => {
      try {
        const [itemsRes, typesRes] = await Promise.all([
          axios.get('/items', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/ordertypes', { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        setItems(itemsRes.data || []);
        setOrderTypes(typesRes.data.data || []);
      } catch (error) {
        console.error(error);
        toast.error('Klaida gaunant duomenis.');
      }
    };
    fetchData();
  }, []);

  const handleSelect = (itemId) => {
    setSelectedItems((prev) => {
      const updated = { ...prev };
      if (updated[itemId]) {
        delete updated[itemId];
      } else {
        updated[itemId] = 1;
      }
      return updated;
    });
  };

  const handleQuantityChange = (itemId, value) => {
    const quantity = parseInt(value, 10);
    if (!isNaN(quantity) && quantity > 0) {
      setSelectedItems((prev) => ({
        ...prev,
        [itemId]: quantity,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('authToken');

    const payload = {
      items: Object.entries(selectedItems).map(([itemId, quantity]) => ({
        item_id: Number(itemId),
        quantity: Number(quantity),
      })),
      type: Number(orderType),
      comment,
    };

    try {
      await axios.post('/orders/full', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Užsakymas sukurtas sėkmingai!');
      setSelectedItems({});
      setOrderType('');
      setComment('');
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error('Klaida kuriant užsakymą.');
    }
  };

  return (
    <div className="order-create-form">
      <h3>Naujas užsakymas</h3>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label>Užsakymo tipas</label>
          <select
            className="form-select"
            value={orderType}
            onChange={(e) => setOrderType(e.target.value)}
            required
          >
            <option value="">Pasirinkite tipą</option>
            {orderTypes.map((type) => (
              <option key={type.id_OrderType} value={type.id_OrderType}>
                {type.name}
              </option>
            ))}
          </select>
        </div>

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
                <th>Kaina</th>
                <th>Inventoriaus kodas</th>
                <th>Kiekis sandėlyje</th>
                <th>Matavimo vnt.</th>
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
                  <td>{item.Price}</td>
                  <td>{item.InventoryNumber}</td>
                  <td>{item.Quantity}</td>
                  <td>{item.UnitOfMeasure}</td>
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

        <div>
          <button type="submit" className="btn btn-primary">
            Pateikti užsakymą
          </button>
        </div>
      </form>
    </div>
  );
};

export default OrderCreateComponent;
