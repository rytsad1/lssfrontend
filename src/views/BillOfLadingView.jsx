import React, { useEffect, useState } from 'react';
import axios from '../axios';
import { toast } from 'react-toastify';

const BillOfLadingView = ({ billId, show, onClose }) => {
    const [pdfUrl, setPdfUrl] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!billId || !show) return;

        const fetchPdf = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('authToken');
                const response = await axios.get(`/billoflading/${billId}/download`, {
                    headers: { Authorization: `Bearer ${token}` },
                    responseType: 'blob'
                });

                const fileBlob = new Blob([response.data], { type: 'application/pdf' });
                const fileURL = URL.createObjectURL(fileBlob);
                setPdfUrl(fileURL);
            } catch (error) {
                toast.error('Nepavyko gauti važtaraščio PDF.');
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchPdf();
    }, [billId, show]);

    if (!show) return null;

    return (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-xl modal-dialog-scrollable">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Važtaraščio peržiūra (ID: {billId})</h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body" style={{ height: '80vh' }}>
                        {loading ? (
                            <p>Kraunama PDF...</p>
                        ) : pdfUrl ? (
                            <iframe
                                src={pdfUrl}
                                title="Važtaraščio PDF"
                                width="100%"
                                height="100%"
                                style={{ border: '1px solid #ccc' }}
                            />
                        ) : (
                            <p>PDF nerastas.</p>
                        )}
                    </div>
                    <div className="modal-footer">
                        {pdfUrl && (
                            <a href={pdfUrl} download={`vaztarastis_${billId}.pdf`} className="btn btn-primary">
                                Atsisiųsti PDF
                            </a>
                        )}
                        <button className="btn btn-secondary" onClick={onClose}>
                            Uždaryti
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BillOfLadingView;
