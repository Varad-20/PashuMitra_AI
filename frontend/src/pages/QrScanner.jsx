import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Camera, CameraOff, Upload, QrCode, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { useApp } from '../context/AppContext.jsx';
import { PageHeader, Badge } from '../components/ui.jsx';
import { speciesEmoji } from '../lib/helpers.js';

export default function QrScanner() {
  const { t } = useTranslation();
  const { animals, toast } = useApp();
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [camError, setCamError] = useState('');
  const [scannedInfo, setScannedInfo] = useState(null);
  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);

  const resolveAndOpen = (rawText) => {
    let parsed = null;
    try {
      parsed = JSON.parse(rawText);
    } catch { /* plain text or URL */ }

    let found = null;
    if (parsed && (parsed.id || parsed.animalId)) {
      found = animals.find(
        (a) => a._id === parsed.id || a.animalId.toLowerCase() === String(parsed.animalId || '').toLowerCase()
      );
    }
    if (!found) {
      const clean = String(rawText).trim();
      found = animals.find(
        (a) =>
          a._id === clean ||
          a.animalId.toLowerCase() === clean.toLowerCase() ||
          clean.endsWith(`/animals/${a._id}`)
      );
    }

    if (found) {
      setScannedInfo(found);
      toast(t('qrScanner.matchedMsg', { name: found.name, id: found.animalId }));
      setTimeout(() => navigate(`/animals/${found._id}`), 500);
    } else {
      toast(t('qrScanner.noMatchError'), 'error');
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch { /* ignore */ }
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const startCamera = async () => {
    setCamError('');
    setScannedInfo(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCamError(t('qrScanner.cameraNotSupported'));
      return;
    }
    try {
      const html5Qr = new Html5Qrcode('pashu-qr-reader');
      scannerRef.current = html5Qr;
      setScanning(true);
      await html5Qr.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        async (decodedText) => {
          await stopCamera();
          resolveAndOpen(decodedText);
        },
        () => {}
      );
    } catch (err) {
      setScanning(false);
      setCamError(err?.message || t('qrScanner.cameraNotSupported'));
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCamError('');
    await stopCamera();
    try {
      const qr = new Html5Qrcode('pashu-qr-file-reader');
      const decodedText = await qr.scanFile(file, true);
      await qr.clear();
      resolveAndOpen(decodedText);
    } catch {
      toast(t('qrScanner.invalidImageError'), 'error');
    } finally {
      e.target.value = '';
    }
  };

  useEffect(() => {
    return () => { stopCamera(); };
  }, []);

  return (
    <>
      <PageHeader title={t('qrScanner.title')} subtitle={t('qrScanner.subtitle')} />

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Camera & Image Upload Card */}
        <div className="card p-6 lg:col-span-3 animate-fadeUp">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="flex items-center gap-2 font-bold text-slate-900">
                <QrCode size={19} className="text-brand-600" /> {t('qrScanner.liveScannerTitle')}
              </h2>
              <p className="text-xs text-slate-500">{t('qrScanner.liveScannerSub')}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {!scanning ? (
                <button className="btn-primary" onClick={startCamera}>
                  <Camera size={16} /> {t('qrScanner.startCamera')}
                </button>
              ) : (
                <button className="btn-danger" onClick={stopCamera}>
                  <CameraOff size={16} /> {t('qrScanner.stopCamera')}
                </button>
              )}
              <button className="btn-ghost" onClick={() => fileInputRef.current?.click()}>
                <Upload size={16} /> {t('qrScanner.scanQrImage')}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            </div>
          </div>

          {camError && (
            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900">
              <AlertCircle size={17} className="mt-0.5 shrink-0 text-amber-600" />
              <span>{camError}</span>
            </div>
          )}

          {scannedInfo && (
            <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              <span className="flex items-center gap-2 font-semibold">
                <CheckCircle2 size={18} className="text-emerald-600" />
                {t('qrScanner.matchedMsg', { name: scannedInfo.name, id: scannedInfo.animalId })}
              </span>
            </div>
          )}

          <div className="mt-5 flex min-h-[290px] flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/70 p-4">
            <div id="pashu-qr-reader" className="w-full max-w-sm overflow-hidden rounded-xl" />
            <div id="pashu-qr-file-reader" className="hidden" />
            {!scanning && (
              <div className="py-10 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
                  <Camera size={26} />
                </div>
                <p className="font-semibold text-slate-800">{t('qrScanner.cameraOffTitle')}</p>
                <p className="mx-auto mt-1 max-w-xs text-xs text-slate-500">
                  {t('qrScanner.cameraOffSub')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Demo / Simulate Scan Card */}
        <div className="card p-6 lg:col-span-2 animate-fadeUp">
          <h2 className="font-bold text-slate-900">{t('qrScanner.quickDemoTitle')}</h2>
          <p className="mt-1 text-xs text-slate-500">{t('qrScanner.quickDemoSub')}</p>

          <div className="mt-4 max-h-[380px] space-y-2.5 overflow-y-auto pr-1">
            {animals.map((a) => (
              <button
                key={a._id}
                onClick={() =>
                  resolveAndOpen(
                    JSON.stringify({ app: 'PashuMitraAI', id: a._id, animalId: a.animalId, name: a.name })
                  )
                }
                className="flex w-full items-center justify-between rounded-xl border border-slate-200/80 bg-white p-3 text-left transition hover:border-brand-400 hover:bg-brand-50/50"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-xl">
                    {speciesEmoji[a.species]}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{a.name}</p>
                    <p className="text-xs text-slate-500">{a.animalId} · {t(`enums.species.${a.species}`)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge>{a.healthStatus}</Badge>
                  <ArrowRight size={15} className="text-brand-600" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
