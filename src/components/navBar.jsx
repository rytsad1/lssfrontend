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

            {/* Hamburger mygtukas — rodomas tik telefone */}
            <button
                className="navbar-toggler"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#navbarContent"
                aria-controls="navbarContent"
                aria-expanded="false"
                aria-label="Toggle navigation"
            >
                <span className="navbar-toggler-icon" />
            </button>

            <div className="collapse navbar-collapse" id="navbarContent">
                <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                    <li className="nav-item">
                        <Link className="nav-link" to="/users">Naudotojai</Link>
                    </li>

                    <li className="nav-item dropdown">
                        <a className="nav-link dropdown-toggle text-success" href="#" role="button"
                           data-bs-toggle="dropdown">
                            Sandėlys
                        </a>
                        <ul className="dropdown-menu">
                            <li><Link className="dropdown-item" to="/v2/overview">Inventorius (likučiai, daiktai, variantai, partijos)</Link></li>
                            <li><hr className="dropdown-divider"/></li>
                            <li><Link className="dropdown-item" to="/v2/issue">Išdavimas</Link></li>
                            <li><Link className="dropdown-item" to="/v2/writeoff">Nurašymas</Link></li>
                            <li><Link className="dropdown-item" to="/v2/kits">Komplektai</Link></li>
                            <li><Link className="dropdown-item" to="/v2/kit-assignment">Komplekto išdavimas</Link></li>
                            <li><hr className="dropdown-divider"/></li>
                            <li><Link className="dropdown-item" to="/v2/movements">Judėjimų istorija</Link></li>
                            <li><hr className="dropdown-divider"/></li>
                            <li><Link className="dropdown-item" to="/v2/my-orders">Mano daiktai</Link></li>
                            <li><Link className="dropdown-item" to="/v2/warehouse-orders">Sandėlio užklausos</Link></li>
                            <li><Link className="dropdown-item" to="/v2/issue-request">Prašyti išduoti</Link></li>
                            <li><hr className="dropdown-divider"/></li>
                            <li><Link className="dropdown-item" to="/v2/forecast">Paklausos prognozė</Link></li>
                            <li><Link className="dropdown-item" to="/v2/anomalies">Anomalijos</Link></li>
                        </ul>
                    </li>

                    <li className="nav-item">
                        <Link className="nav-link" to="/permissionview">Rolių valdymas</Link>
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