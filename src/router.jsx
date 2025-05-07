// src/router.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './views/Login';
import HomeView from './views/HomeView';
import InventoryView from './views/InventoryView';
import UserManagmentView from './views/UserManagmentView';
import { isAuthenticated } from './auth';

const PrivateRoute = ({ children }) => {
    return isAuthenticated() ? children : <Navigate to="/login" />;
};

const AppRouter = () => (
    <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/inventory" element={<InventoryView />} />
        <Route path="/users" element={<UserManagmentView />} />
        <Route path="/" element={
                <PrivateRoute>
                    <HomeView />
                </PrivateRoute>
            }
        />
    </Routes>
);

export default AppRouter;
