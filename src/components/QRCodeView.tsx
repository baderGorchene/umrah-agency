import React, { useState, useEffect } from 'react';
import { generateQRCodeDataUrl, QRPayload } from '../lib/qrCode';
import { QrCode as QrIcon } from 'lucide-react';

interface QRCodeViewProps {
  payload: string | QRPayload;
  size?: number;
  className?: string;
  darkColor?: string;
  lightColor?: string;
  simple?: boolean;
}

export const QRCodeView: React.FC<QRCodeViewProps> = ({
  payload,
  size = 120,
  className = '',
  darkColor = '#000000',
  lightColor = '#FFFFFF',
  simple = true,
}) => {
  const [qrUrl, setQrUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    generateQRCodeDataUrl(payload, {
      width: size * 2,
      darkColor,
      lightColor,
      simple,
    })
      .then((url) => {
        if (isMounted) {
          setQrUrl(url);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [payload, size, darkColor, lightColor, simple]);

  if (loading) {
    return (
      <div
        className={`flex items-center justify-center bg-slate-100 animate-pulse rounded-lg ${className}`}
        style={{ width: size, height: size }}
      >
        <QrIcon className="w-6 h-6 text-slate-400 animate-spin" />
      </div>
    );
  }

  if (!qrUrl) {
    return (
      <div
        className={`flex items-center justify-center bg-red-50 text-red-500 text-[10px] rounded-lg p-2 ${className}`}
        style={{ width: size, height: size }}
      >
        Erreur QR
      </div>
    );
  }

  return (
    <img
      src={qrUrl}
      alt="Code QR dynamique"
      className={`object-contain ${className}`}
      style={{ width: size, height: size }}
    />
  );
};
