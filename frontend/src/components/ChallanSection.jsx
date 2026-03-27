import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch, getApiBaseUrl } from '../api/client';

const ChallanSection = () => {
    const [challans, setChallans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending'); // pending, approved, rejected
    const [selectedChallan, setSelectedChallan] = useState(null);

    const fetchChallans = useCallback(async () => {
        try {
            setLoading(true);
            const data = await apiFetch('/challans');
            setChallans(data);
        } catch (error) {
            console.error('Error fetching challans:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchChallans();
    }, [fetchChallans]);

    const handleReview = async (id, status) => {
        try {
            await apiFetch(`/challans/${id}/review`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            fetchChallans(); // Refresh list
            setSelectedChallan(null);
        } catch (error) {
            console.error('Error reviewing challan:', error);
        }
    };

    const filteredChallans = challans.filter(c => filter === 'all' || c.status === filter);

    if (loading) return <div style={{ color: '#fff', padding: '20px' }}>Loading AI-issued challans...</div>;

    return (
        <div style={{ background: '#0d1720', height: '100%', display: 'flex', flexDirection: 'column', color: '#E3F0FF', fontFamily: "'DM Sans', sans-serif", overflow: 'hidden' }}>
            {/* HEADER */}
            <div style={{ padding: '24px', background: '#1a2535', borderBottom: '1px solid #2a3548' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontSize: '20px', fontWeight: 'bold' }}>Challan Review Center</h1>
                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>Validate AI-issued citations for enforcement official approval</p>
                        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.28)', marginTop: '6px' }}>API: {getApiBaseUrl()}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <div style={{ background: 'rgba(232, 93, 38, 0.1)', border: '1px solid rgba(232, 93, 38, 0.3)', padding: '6px 12px', borderRadius: '4px' }}>
                            <span style={{ fontSize: '10px', textTransform: 'uppercase', display: 'block', color: 'rgba(232,93,38,0.7)' }}>Pending Cases</span>
                            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{challans.filter(c => c.status === 'pending').length}</span>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '20px', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#666', marginRight: '8px' }}>FILTER BY STATUS:</span>
                    <button onClick={() => setFilter('pending')} style={{ padding: '6px 14px', background: filter === 'pending' ? '#e85d26' : 'transparent', border: `1px solid ${filter === 'pending' ? '#e85d26' : '#2a3548'}`, color: '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>PENDING</button>
                    <button onClick={() => setFilter('approved')} style={{ padding: '6px 14px', background: filter === 'approved' ? '#2e7d32' : 'transparent', border: `1px solid ${filter === 'approved' ? '#2e7d32' : '#2a3548'}`, color: '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>APPROVED</button>
                    <button onClick={() => setFilter('rejected')} style={{ padding: '6px 14px', background: filter === 'rejected' ? '#c62828' : 'transparent', border: `1px solid ${filter === 'rejected' ? '#c62828' : '#2a3548'}`, color: '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>REJECTED</button>
                    <button onClick={() => setFilter('all')} style={{ padding: '6px 14px', background: filter === 'all' ? '#1565c0' : 'transparent', border: `1px solid ${filter === 'all' ? '#1565c0' : '#2a3548'}`, color: '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>ALL VIEW</button>
                </div>
            </div>

            {/* TABLE CONTENT */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 24px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                    <thead>
                        <tr style={{ background: '#1a2535', borderBottom: '2px solid #2a3548' }}>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }}>Evidence</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }}>Case ID</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }}>Plate ID</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }}>Violation Type</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }}>Zone / Location</th>
                            <th style={{ padding: '12px', textAlign: 'center', fontSize: '11px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }}>AI Confidence</th>
                            <th style={{ padding: '12px', textAlign: 'center', fontSize: '11px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }}>Timestamp</th>
                            <th style={{ padding: '12px', textAlign: 'center', fontSize: '11px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }}>Status</th>
                            <th style={{ padding: '12px', textAlign: 'right', fontSize: '11px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredChallans.map((c, i) => (
                            <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)', cursor: 'pointer' }} onClick={() => setSelectedChallan(c)}>
                                <td style={{ padding: '8px 12px' }}>
                                    <div style={{ width: '60px', height: '40px', borderRadius: '4px', overflow: 'hidden', border: '1px solid #2a3548' }}>
                                        <img src={c.image} alt="thumb" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                </td>
                                <td style={{ padding: '12px', fontSize: '13px', fontWeight: 'bold', color: '#42a5f5' }}>#TW-{c.id}</td>
                                <td style={{ padding: '12px' }}>
                                    <span style={{ background: '#1a3a6e', color: '#fff', fontSize: '11px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '2px', border: '1px solid rgba(255,255,255,0.2)' }}>{c.plate}</span>
                                </td>
                                <td style={{ padding: '12px', fontSize: '13px', fontWeight: 'bold' }}>{c.type}</td>
                                <td style={{ padding: '12px' }}>
                                    <div style={{ fontSize: '13px' }}>{c.location}</div>
                                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>{c.ward} Ward · {c.zone}</div>
                                </td>
                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: c.conf > 90 ? '#52b788' : '#f4a261' }}>{c.conf}%</div>
                                </td>
                                <td style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>{c.time}</td>
                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                    <span style={{ 
                                        fontSize: '10px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '10px', textTransform: 'uppercase',
                                        background: c.status === 'pending' ? 'rgba(244, 162, 97, 0.1)' : c.status === 'approved' ? 'rgba(82, 183, 136, 0.1)' : 'rgba(198, 40, 40, 0.1)',
                                        color: c.status === 'pending' ? '#f4a261' : c.status === 'approved' ? '#52b788' : '#ef5350',
                                        border: `1px solid ${c.status === 'pending' ? 'rgba(244, 162, 97, 0.3)' : c.status === 'approved' ? 'rgba(82, 183, 136, 0.3)' : 'rgba(198, 40, 40, 0.3)'}`
                                    }}>
                                        ● {c.status}
                                    </span>
                                </td>
                                <td style={{ padding: '12px', textAlign: 'right' }}>
                                    <button style={{ background: '#e85d26', color: '#fff', border: 'none', padding: '4px 12px', fontSize: '11px', fontWeight: 'bold', borderRadius: '3px', cursor: 'pointer' }}>
                                        REVIEW
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredChallans.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '100px', opacity: 0.3 }}>
                        <span style={{ fontSize: '40px' }}>✅</span>
                        <p>No challans matches this filter.</p>
                    </div>
                )}
            </div>

            {/* REVIEW MODAL */}
            {selectedChallan && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setSelectedChallan(null)}>
                    <div style={{ background: '#fff', width: '900px', maxWidth: '100%', maxHeight: '90vh', overflow: 'hidden', borderRadius: '12px', display: 'flex', color: '#1a1a1a' }} onClick={e => e.stopPropagation()}>
                        <div style={{ flex: 1, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <img src={selectedChallan.image} alt="full-violation" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                        </div>
                        <div style={{ width: '360px', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ background: '#1a3a6e', color: '#fff', padding: '20px' }}>
                                <div style={{ fontSize: '11px', textTransform: 'uppercase', opacity: 0.6, letterSpacing: '1px' }}>Violation Verification</div>
                                <h2 style={{ fontSize: '20px', margin: '4px 0' }}>{selectedChallan.type}</h2>
                                <div style={{ fontSize: '12px' }}>#TW-{selectedChallan.id} · {selectedChallan.plate}</div>
                            </div>
                            <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
                                <div style={{ marginBottom: '20px' }}>
                                    <h3 style={{ fontSize: '11px', textTransform: 'uppercase', color: '#888', marginBottom: '8px' }}>Location Details</h3>
                                    <p style={{ fontSize: '14px', fontWeight: 'bold' }}>Nazik Zone · {selectedChallan.location}</p>
                                    <p style={{ fontSize: '12px', color: '#666' }}>Ward: {selectedChallan.ward}</p>
                                </div>
                                <div style={{ marginBottom: '20px' }}>
                                    <h3 style={{ fontSize: '11px', textTransform: 'uppercase', color: '#888', marginBottom: '8px' }}>AI Evidence</h3>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <div style={{ flex: 1, background: '#f5f7fa', padding: '8px', borderRadius: '4px', border: '1px solid #e0e0e0' }}>
                                            <div style={{ fontSize: '9px', color: '#888' }}>CONFIDENCE</div>
                                            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#2e7d32' }}>{selectedChallan.conf}%</div>
                                        </div>
                                        <div style={{ flex: 1, background: '#f5f7fa', padding: '8px', borderRadius: '4px', border: '1px solid #e0e0e0' }}>
                                            <div style={{ fontSize: '9px', color: '#888' }}>FINE</div>
                                            <div style={{ fontSize: '14px', fontWeight: 'bold' }}>₹{selectedChallan.fine}</div>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '11px', textTransform: 'uppercase', color: '#888', marginBottom: '8px' }}>Officer Review</h3>
                                    <p style={{ fontSize: '12px', color: '#555', lineHeight: '1.5' }}>
                                        Please review the image evidence carefully. Ensure the vehicle plate and violation type are clearly visible before approval.
                                    </p>
                                </div>
                            </div>
                            {selectedChallan.status === 'pending' && (
                                <div style={{ padding: '20px', borderTop: '1px solid #e0e0e0', display: 'flex', gap: '10px' }}>
                                    <button onClick={() => handleReview(selectedChallan.id, 'rejected')} style={{ flex: 1, padding: '12px', background: '#c62828', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>REJECT</button>
                                    <button onClick={() => handleReview(selectedChallan.id, 'approved')} style={{ flex: 1, padding: '12px', background: '#2e7d32', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>APPROVE</button>
                                </div>
                            ) || (
                                <div style={{ padding: '20px', borderTop: '1px solid #e0e0e0', textAlign: 'center' }}>
                                    <div style={{ padding: '10px', background: selectedChallan.status === 'approved' ? '#e8f5e9' : '#fde8e8', color: selectedChallan.status === 'approved' ? '#1b5e20' : '#c62828', fontWeight: 'bold', borderRadius: '4px', textTransform: 'uppercase' }}>
                                        Status: {selectedChallan.status}
                                    </div>
                                    <button onClick={() => setSelectedChallan(null)} style={{ marginTop: '10px', color: '#1a3a6e', border: 'none', background: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Close</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChallanSection;
