import React, { useEffect, useState } from 'react';
import axios from '../axios';
import { toast } from 'react-toastify';

const IssuedItemsView = () => {
    const [issuedItems, setIssuedItems] = useState([]);

    useEffect(() => {
        const fetchIssuedItems = async () => {
            try {
                const token = localStorage.getItem('authToken');
                const response = await axios.get('/temporary-issues', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setIssuedItems(response.data.data);
            } catch (error) {
                console.error(error);
                toast.error('Nepavyko gauti išduotų daiktų sąrašo.');
            }
        };

        fetchIssuedItems();
    }, []);

    const handleReturn = async (id) => {
        try {
            const token = localStorage.getItem('authToken');
            await axios.post(`/temporary-issues/${id}/return`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Daiktas grąžintas.');
            setIssuedItems(prev => prev.filter(item => item.id_TemporaryIssueLog !== id));
        } catch (error) {
            console.error(error);
            toast.error('Klaida grąžinant daiktą.');
        }
    };

    return (
        <div>
            <h3>Man išduoti daiktai</h3>
            {issuedItems.length === 0 ? (
                <p>Šiuo metu neturite išduotų daiktų.</p>
            ) : (
                <table className="table table-bordered">
                    <thead>
                    <tr>
                        <th>Pavadinimas</th>
                        <th>Inventoriaus kodas</th>
                        <th>Išdavimo data</th>
                        <th>Komentaras</th>
                        <th>Kiekis</th>
                        <th>Veiksmas</th>
                    </tr>
                    </thead>
                    <tbody>
                    {issuedItems.map(item => (
                        <tr key={item.id_TemporaryIssueLog}>
                            <td>{item.item?.Name}</td>
                            <td>{item.item?.InventoryNumber}</td>
                            <td>{item.IssuedDate}</td>
                            <td>{item.Comment}</td>
                            <td>{item.Quantity}</td>
                            <td>
                                <button
                                    className="btn btn-sm btn-success"
                                    onClick={() => handleReturn(item.id_TemporaryIssueLog)}
                                >
                                    Grąžinti
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default IssuedItemsView;
