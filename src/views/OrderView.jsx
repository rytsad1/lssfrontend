// src/components/OrderView.jsx
import React, { useEffect, useState } from 'react';
import axios from '../axios';
import { toast } from 'react-toastify';
import OrderCreateComponent from '../components/OrderCreateComponent';



const OrderView = () => {





  return (
    <div className="order-view">
      <h2>Užsakymų sąrašas</h2>
      <OrderCreateComponent onSuccess={() => toast.success("Užsakymas pateiktas!")} />

      <table className="table mt-4">

      </table>
    </div>
  );
};

export default OrderView;
