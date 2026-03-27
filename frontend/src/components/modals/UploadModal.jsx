import { useState, useRef } from 'react';
import { apiFetch } from '../../api/client';

export default function UploadModal({ open, onClose, onBack }) {
  const [file, setFile] = useState(null);
  const [camId, setCamId] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [jobId, setJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState('idle');
  const fileRef = useRef(null);

  const setUploadFile = (f) => setFile(f);

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) setUploadFile(f);
  };

  const pollJobStatus = async (id, attempts = 8) => {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const job = await apiFetch(`/api/jobs/${id}`);
      setJobStatus(job.status);

      if (job.status === 'completed' || job.status === 'failed') {
        return job;
      }

      await new Promise((resolve) => setTimeout(resolve, 1200));
    }

    return null;
  };

  const handleSubmit = async () => {
    setError('');
    if (!file) {
      setError('Please select a video file to upload.');
      return;
    }

    try {
      setLoading(true);
      setJobStatus('uploading');

      const formData = new FormData();
      formData.append('video', file);

      const job = await apiFetch('/api/videos/upload', {
        method: 'POST',
        body: formData,
      });

      setJobId(job.id);
      setJobStatus(job.status);
      await pollJobStatus(job.id);
      setSuccess(true);
    } catch (submitError) {
      console.error('Upload failed:', submitError);
      setError(submitError.message || 'Failed to upload and queue the footage.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setCamId('');
    setLocation('');
    setError('');
    setLoading(false);
    setSuccess(false);
    setJobId(null);
    setJobStatus('idle');
    onClose();
  };

  if (!open) return null;
  return (
    <div className="tw-modal-backdrop open" onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}>
      <div className="tw-modal">
        <div className="tw-modal-head">
          <button className="tw-modal-close" onClick={handleClose}>✕</button>
          <div className="eyebrow">CCTV FOOTAGE ANALYSIS</div>
          <h3>Upload<br /><em>CCTV Footage</em></h3>
        </div>
        <div className="tw-modal-body">
          {success ? (
            <div className="tw-success">
              <div className="tw-success-icon">✓</div>
              <h4>Footage Queued!</h4>
              <p>
                <strong style={{ color: '#1A237E' }}>{file?.name}</strong> has been submitted for YOLOv8 analysis.
                <br />Job ID: <strong>{jobId}</strong> · Current status: <strong>{jobStatus}</strong>
              </p>
              <button className="tw-submit" style={{ width: 'auto', padding: '.7rem 1.8rem', margin: '0 auto' }} onClick={handleClose}>
                Back to Dashboard →
              </button>
            </div>
          ) : (
            <>
              <div
                className="upload-drop"
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept="video/*,.mp4,.avi,.mov,.mkv"
                  style={{ display: 'none' }}
                  onChange={(e) => e.target.files[0] && setUploadFile(e.target.files[0])}
                />
                <div className="upload-icon">📤</div>
                {file ? (
                  <>
                    <div className="upload-filename">{file.name}</div>
                    <div className="upload-filesize">{(file.size / 1024 / 1024).toFixed(1)} MB · Click to change</div>
                  </>
                ) : (
                  <>
                    <div className="upload-placeholder">Drop footage here or click to browse</div>
                    <div className="upload-hint">MP4, AVI, MOV, MKV · Max 2GB</div>
                  </>
                )}
              </div>

              <div className="tw-row2" style={{ marginBottom: '1.2rem' }}>
                <div>
                  <label className="tw-field-label">Camera ID</label>
                  <input className="tw-input" type="text" value={camId} placeholder="CAM-04" onChange={(e) => setCamId(e.target.value)} />
                </div>
                <div>
                  <label className="tw-field-label">Location</label>
                  <input className="tw-input" type="text" value={location} placeholder="MG Road, Nashik" onChange={(e) => setLocation(e.target.value)} />
                </div>
              </div>

              <div className="upload-yolo-note">
                <strong style={{ color: '#1565C0' }}>YOLOv8 Analysis</strong> will detect: No Helmet · Signal Jump · Triple Riding · Wrong Lane — with timestamps and confidence scores.
              </div>

              {jobId && (
                <div className="upload-yolo-note" style={{ marginTop: '0.6rem' }}>
                  Job #{jobId} status: <strong>{jobStatus}</strong>
                </div>
              )}

              {error && <div className="tw-error">{error}</div>}

              <button className="tw-submit" disabled={loading} onClick={handleSubmit}>
                {loading ? <><span className="tw-spinner"></span> Uploading &amp; Queuing…</> : 'Analyse Footage →'}
              </button>
              <button onClick={() => { handleClose(); onBack(); }} style={{ width: '100%', marginTop: '.6rem', background: 'none', border: 'none', cursor: 'pointer', color: '#90A4AE', fontSize: '.75rem', padding: '.4rem', fontFamily: "'DM Sans',sans-serif" }}>
                ← Back
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
