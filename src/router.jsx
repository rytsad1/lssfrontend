// src/router.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './views/Login';
import HomeView from './views/HomeView';
import InventoryView from './views/InventoryView';
import UserManagmentView from './views/UserManagmentView';
import OrderView from './views/OrderView';
import OrderHistoryView from './views/OrderHistoryView';
import OrderManagementView from './views/OrderManagementView';
import PermissionView from './views/PermissionView';
import WriteOffLogView from "./views/WriteOffLogView.jsx";
import IssuedItemsView from './views/IssuedItemsView';
//import BillOfLandingView from './views/BillOfLandingView';
import { isAuthenticated } from './auth';

const PrivateRoute = ({ children }) => {
    return isAuthenticated() ? children : <Navigate to="/login" />;
};

const AppRouter = () => (
    <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/inventory" element={<InventoryView />} />
        <Route path="/users" element={<UserManagmentView />} />
         <Route path="/orders" element={<OrderView />} />
        <Route path="/orderhistory" element={<OrderHistoryView />} />
        <Route path="/ordermanagement" element={<OrderManagementView />} />
        <Route path="permissionview" element={<PermissionView />} />
        <Route path="/writeofflog" element={<WriteOffLogView />} />
        <Route path="/issue" element={<IssuedItemsView />} />
        {/*<Route path="/billoflading" element={<BillOfLandingView />} />*/}
        <Route path="/" element={
                <PrivateRoute>
                    <HomeView />
                </PrivateRoute>
            }
        />
    </Routes>
);

export default AppRouter;
