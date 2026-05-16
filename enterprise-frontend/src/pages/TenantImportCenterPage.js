import React, { useState } from 'react';
import { createTenantImportJob } from './patient/helpers/syncApi';

export default function TenantImportCenterPage() {
  const [patientRef, setPatientRef] = useState('patient@raftop.local');
  const [sourceType, setSourceType] = useState('csv_import');
  const [sourceName, setSourceName] = useState('AirView CSV');
  const [deviceType, setDeviceType] = useState('CPAP');
  const [importedRows, setImportedRows] = useState('14');
  const [busy, setBusy] = useState(false);
  const [flashMessage, setFlashMessage] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setFlashMessage('');

    try {
      const job = await createTenantImportJob({
        patientRef,
        sourceType,
        sourceName,
        deviceType,
        importedRows: Number(importedRows || 0)
      });

      setFlashMessage(`Import job created: ${job.id}`);
    } catch (error) {
      setFlashMessage(error?.message || 'Failed to create tenant import job');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="tenant-import-center-page">
      <style>{pageStyles}</style>

      <section className="hero-card">
        <div>
          <div className="eyebrow">IMPORT CENTER</div>
          <h1>Tenant Import Center</h1>
          <p>
            Δημιουργία import jobs για patient sync recovery, CSV ingest και manual data rescue.
          </p>
        </div>
      </section>

      {flashMessage ? <div className="banner info">{flashMessage}</div> : null}

      <section className="page-card">
        <div className="section-title">Create Import Job</div>

        <form onSubmit={handleSubmit} className="form-wrap">
          <div className="field">
            <label className="field-label">Patient Email or ID</label>
            <input
              className="input"
              value={patientRef}
              onChange={(e) => setPatientRef(e.target.value)}
              placeholder="patient@raftop.local"
            />
          </div>

          <div className="field">
            <label className="field-label">Source Type</label>
            <select className="input" value={sourceType} onChange={(e) => setSourceType(e.target.value)}>
              <option value="csv_import">csv_import</option>
              <option value="manual_upload">manual_upload</option>
              <option value="integration_sync">integration_sync</option>
            </select>
          </div>

          <div className="field">
            <label className="field-label">Source Name</label>
            <input
              className="input"
              value={sourceName}
              onChange={(e) => setSourceName(e.target.value)}
              placeholder="AirView CSV"
            />
          </div>

          <div className="field">
            <label className="field-label">Device Type</label>
            <input
              className="input"
              value={deviceType}
              onChange={(e) => setDeviceType(e.target.value)}
              placeholder="CPAP"
            />
          </div>

          <div className="field">
            <label className="field-label">Imported Rows</label>
            <input
              className="input"
              type="number"
              min="1"
              value={importedRows}
              onChange={(e) => setImportedRows(e.target.value)}
            />
          </div>

          <button type="submit" className="primary-btn" disabled={busy}>
            {busy ? 'Creating...' : 'Create Import Job'}
          </button>
        </form>
      </section>
    </div>
  );
}

const pageStyles = `
  .tenant-import-center-page {
    display: flex;
    flex-direction: column;
    gap: 18px;
    padding: 18px;
  }

  .hero-card,
  .page-card {
    background: rgba(255,255,255,0.94);
    border: 1px solid rgba(148,163,184,0.18);
    border-radius: 24px;
    box-shadow: 0 14px 40px rgba(15,23,42,0.08);
  }

  .hero-card {
    padding: 24px;
    background:
      radial-gradient(circle at top right, rgba(34,197,94,0.10), transparent 28%),
      linear-gradient(135deg, rgba(255,255,255,0.98), rgba(240,253,244,0.96));
  }

  .page-card {
    padding: 20px;
  }

  .eyebrow {
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #16a34a;
    margin-bottom: 8px;
  }

  h1 {
    margin: 0;
    font-size: 30px;
    color: #0f172a;
  }

  p {
    color: #475569;
    line-height: 1.7;
  }

  .banner.info {
    border-radius: 18px;
    padding: 14px 16px;
    font-size: 14px;
    font-weight: 600;
    background: #eff6ff;
    color: #1d4ed8;
    border: 1px solid #bfdbfe;
  }

  .section-title,
  .field-label {
    font-size: 16px;
    font-weight: 900;
    color: #0f172a;
    margin-bottom: 12px;
  }

  .form-wrap {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .input {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid #d0d5dd;
    border-radius: 14px;
    padding: 12px 14px;
    background: #fff;
    color: #101828;
    font-size: 14px;
    outline: none;
  }

  .primary-btn {
    border: 0;
    border-radius: 14px;
    padding: 12px 14px;
    font-weight: 900;
    background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
    color: #fff;
    cursor: pointer;
  }
`;