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

                    {/* Sena sistema dropdown */}
                    <li className="nav-item dropdown">
                        <a className="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                            Sena sistema
                        </a>
                        <ul className="dropdown-menu">
                            <li><Link className="dropdown-item" to="/inventory">Inventorius</Link></li>
                            <li><Link className="dropdown-item" to="/orders">Užsakymas</Link></li>
                            <li><Link className="dropdown-item" to="/orderhistory">Užsakymų istorija</Link></li>
                            <li><Link className="dropdown-item" to="/ordermanagement">Užsakymų valdymas</Link></li>
                            <li><Link className="dropdown-item" to="/writeofflog">Nurašymai</Link></li>
                            <li><Link className="dropdown-item" to="/issue">Išdavimai</Link></li>
                        </ul>
                    </li>

                    {/* Nauja sistema dropdown */}
                    <li className="nav-item dropdown">
                        <a className="nav-link dropdown-toggle text-success" href="#" role="button" data-bs-toggle="dropdown">
                            Sandėlys (nauja)
                        </a>
                        <ul className="dropdown-menu">
                            <li><Link className="dropdown-item" to="/v2/stock">Likučiai</Link></li>
                            <li><Link className="dropdown-item" to="/v2/items">Daiktai</Link></li>
                            <li><Link className="dropdown-item" to="/v2/variants">Variantai</Link></li>
                            <li><Link className="dropdown-item" to="/v2/batches">Partijos</Link></li>
                            <li><Link className="dropdown-item" to="/v2/asset-units">Vienetinis turtas</Link></li>
                            <li><hr className="dropdown-divider" /></li>
                            <li><Link className="dropdown-item" to="/v2/import">Excel importas</Link></li>
                            <li><Link className="dropdown-item" to="/v2/issue">Išdavimas</Link></li>
                            <li><Link className="dropdown-item" to="/v2/return">Grąžinimas</Link></li>
                            <li><Link className="dropdown-item" to="/v2/writeoff">Nurašymas</Link></li>
                            <li><hr className="dropdown-divider" /></li>
                            <li><Link className="dropdown-item" to="/v2/movements">Judėjimų istorija</Link></li>
                            <li><Link className="dropdown-item" to="/v2/kits">Komplektai</Link></li>
                            <li><Link className="dropdown-item" to="/v2/kit-assignment">Komplekto išdavimas</Link></li>
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