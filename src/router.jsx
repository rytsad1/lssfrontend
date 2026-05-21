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
import InventoryItemsView from './views/v2/InventoryItemsView';
import ItemVariantsView from './views/v2/ItemVariantsView';
import StockBatchesView from './views/v2/StockBatchesView';


// V2 views
import StockView from './views/v2/StockView';
import InventoryImportView from './views/v2/InventoryImportView';
import InventoryMovementsView from './views/v2/InventoryMovementsView';
import IssueView from './views/v2/IssueView';
//import AssetUnitsView from './views/v2/AssetUnitsView'; // jei dar nėra

import { isAuthenticated } from './auth';

const PrivateRoute = ({ children }) => {
    return isAuthenticated() ? children : <Navigate to="/login" />;
};

const AppRouter = () => (
    <Routes>
        <Route path="/login" element={<Login />} />

        {/* Sena sistema */}
        <Route path="/inventory" element={<PrivateRoute><InventoryView /></PrivateRoute>} />
        <Route path="/users" element={<PrivateRoute><UserManagmentView /></PrivateRoute>} />
        <Route path="/orders" element={<PrivateRoute><OrderView /></PrivateRoute>} />
        <Route path="/orderhistory" element={<PrivateRoute><OrderHistoryView /></PrivateRoute>} />
        <Route path="/ordermanagement" element={<PrivateRoute><OrderManagementView /></PrivateRoute>} />
        <Route path="/permissionview" element={<PrivateRoute><PermissionView /></PrivateRoute>} />
        <Route path="/writeofflog" element={<PrivateRoute><WriteOffLogView /></PrivateRoute>} />
        <Route path="/issue" element={<PrivateRoute><IssuedItemsView /></PrivateRoute>} />

        {/* Nauja sistema (v2) */}
        <Route path="/v2/stock" element={<PrivateRoute><StockView /></PrivateRoute>} />
            <Route path="/v2/items/:itemId/variants" element={<PrivateRoute><ItemVariantsView /></PrivateRoute>} />

        <Route path="/" element={<PrivateRoute><HomeView /></PrivateRoute>} />
            <Route path="/v2/items" element={<PrivateRoute><InventoryItemsView /></PrivateRoute>} />
            <Route path="/v2/batches" element={<PrivateRoute><StockBatchesView /></PrivateRoute>} />
        <Route path="/v2/import" element={<PrivateRoute><InventoryImportView /></PrivateRoute>} />
        <Route path="/v2/movements" element={<PrivateRoute><InventoryMovementsView /></PrivateRoute>} />
        <Route path="/v2/issue" element={<PrivateRoute><IssueView /></PrivateRoute>} />
    </Routes>
);

export default AppRouter;