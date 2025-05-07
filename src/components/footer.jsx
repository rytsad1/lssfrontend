import React from 'react';

const Footer = () => {
    return (
        <footer className="bg-light text-center py-3 mt-5">
            <p className="mb-0">&copy; {new Date().getFullYear()} LSS Sandėlio sistema</p>
        </footer>
    );
};

export default Footer;