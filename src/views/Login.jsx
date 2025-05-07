import React, { useState } from 'react';
import axios from '../axios';
import { useNavigate } from 'react-router-dom';
import { login } from '../auth';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        try {
            const response = await axios.post('/login', {
                Email: email,
                Password: password,
            });
            login(response.data.access_token);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Prisijungimo klaida');
        }
    };

    return (
        <div className="login-form">
            <h2>Prisijungimas</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="email"
                    placeholder="El. paštas"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Slaptažodis"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button type="submit">Prisijungti</button>
            </form>
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    );
};

export default Login;