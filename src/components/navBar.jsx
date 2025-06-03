import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { isAuthenticated, logout } from '../auth';

const NavBar = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="navbar navbar-expand-lg navbar-light bg-light px-3 fixed-top">
            <Link className="navbar-brand" to="/">LSS App</Link>
            <div className="collapse navbar-collapse">
                <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                    <li className="nav-item">
                        <Link className="nav-link" to="/users">Naudotojai</Link>
                    </li>
                    <li className="nav-item">
                        <Link className="nav-link" to="/inventory">Inventorius</Link>
                    </li>
                    <li className="nav-item">
                        <Link className="nav-link" to="/orders">Užsakymas</Link>
                    </li>
                    <li className="nav-item">
                        <Link className="nav-link" to="/orderhistory">Užsakymų istorija</Link>
                    </li>
                    <li className="nav-item">
                        <Link className="nav-link" to="/ordermanagement">Užsakymų valdymas</Link>
                    </li>
                    <li className="nav-item">
                        <Link className="nav-link" to="/permissionview">Rolių ir leidimų valdymas</Link>
                    </li>
                    <li className="nav-item">
                        <Link className="nav-link" to="/writeofflog">Nurašymai</Link>
                    </li>
                    <li className="nav-item">
                        <Link className="nav-link" to="/issue">Išdavimai</Link>
                    </li>
                </ul>
                <ul className="navbar-nav">
                    {isAuthenticated() ? (
                        <li className="nav-item">
                        <button className="btn btn-outline-danger" onClick={handleLogout}>Atsijungti</button>
                        </li>
                    ) : (
                        <li className="nav-item">
                            <Link className="btn btn-outline-primary" to="/login">Prisijungti</Link>
                        </li>
                    )}
                </ul>
            </div>
        </nav>
    );
};

export default NavBar;