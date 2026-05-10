import React from 'react';
import { Link } from 'react-router-dom';

const HomeView = () => {
    return (
        <div className="container mt-5">
            <h1>LSS sandėlio sistema</h1>
            <p className="text-muted">Sveiki prisijungę.</p>

            <div className="row mt-4">
                <div className="col-md-6">
                    <div className="card mb-3">
                        <div className="card-body">
                            <h5 className="card-title text-success">Nauja sandėlio sistema</h5>
                            <p className="card-text">
                                Patobulinta sistema su variantais, partijomis ir galiojimo sekimu.
                            </p>
                            <Link to="/v2/stock" className="btn btn-success me-2">Likučiai</Link>
                            <Link to="/v2/import" className="btn btn-outline-success">Importas</Link>
                        </div>
                    </div>
                </div>
                <div className="col-md-6">
                    <div className="card mb-3">
                        <div className="card-body">
                            <h5 className="card-title">Sena sistema</h5>
                            <p className="card-text">Esama veikianti sistema.</p>
                            <Link to="/inventory" className="btn btn-outline-primary">Inventorius</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomeView;