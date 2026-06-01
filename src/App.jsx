import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { Copy, Check, Lock, SmartphoneNfc } from 'lucide-react';

// Backend sunucumuzun adresi (Şimdilik lokal, canlıya alınca değişecek)
const SOCKET_URL = 'https://nfcsharebackend.onrender.com/';

function App() {
  // Basit Router Mantığı: URL '/p/' ile başlıyorsa Paylaşım ekranı, yoksa Ana Sayfa
  const path = window.location.pathname;
  const isSharePage = path.startsWith('/p/');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {isSharePage ? <ShareBridge /> : <LandingPage />}
    </div>
  );
}

// ==========================================
// 1. ANA SAYFA (LANDING PAGE)
// ==========================================
const LandingPage = () => (
  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '20px' }}>
    <SmartphoneNfc size={80} color="#1D1D1F" style={{ marginBottom: 24 }} />
    <h1 style={{ fontSize: '48px', fontWeight: '700', letterSpacing: '-1px', marginBottom: '16px' }}>NFC Share</h1>
    <p style={{ fontSize: '20px', color: '#8E8E93', maxWidth: '400px', marginBottom: '40px', lineHeight: '1.4' }}>
      Dokun, paylaş ve kaybolsun. Hassas verilerinizi saniyeler içinde aktarın, arkanızda iz bırakmayın.
    </p>
    <div style={{ width: '100%', maxWidth: '300px' }}>
      <button className="primary-btn">Google Play'den İndir</button>
    </div>
    
    <footer style={{ position: 'absolute', bottom: '30px', color: '#8E8E93', fontSize: '14px', fontWeight: '500' }}>
      Arif Büyükköse • arifbuyukkose02@gmail.com
    </footer>
  </div>
);

// ==========================================
// 2. UÇUCU KÖPRÜ (SHARE BRIDGE)
// ==========================================
const ShareBridge = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  // URL'den 'a1b2c' gibi olan ID'yi çekiyoruz
  const shortId = window.location.pathname.split('/p/')[1];

  useEffect(() => {
    // Sunucuya bağlan
    const socket = io(SOCKET_URL);

    // Bağlanınca ID'yi gönderip veriyi talep et
    socket.on('connect', () => {
      socket.emit('join-share', shortId);
    });

    // Veri başarıyla gelirse
    socket.on('share-data', (incomingData) => {
      setData(incomingData);
    });

    // Hata veya veri yoksa (Süresi dolmuş/başka biri bakmış)
    socket.on('share-error', (errMsg) => {
      setError(errMsg);
    });

    // Sayfa kapanırken veya bileşen ölürken bağlantıyı kopar
    return () => socket.disconnect();
  }, [shortId]);

  const handleCopy = async () => {
    if (data?.content) {
      await navigator.clipboard.writeText(data.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // 2 saniye sonra tike dön
    }
  };

  // DURUM 1: HATA veya İMHA EDİLMİŞ
  if (error) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <Lock size={48} color="#FF3B30" style={{ margin: '0 auto 20px' }} />
          <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '12px' }}>Bağlantı Koptu</h2>
          <p style={{ color: '#8E8E93', lineHeight: '1.5' }}>{error}</p>
        </div>
      </div>
    );
  }

  // DURUM 2: YÜKLENİYOR
  if (!data) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#8E8E93', fontSize: '17px', fontWeight: '500' }}>Güvenli bağlantı kuruluyor...</p>
      </div>
    );
  }

  // DURUM 3: VERİ EKRANDA
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', color: '#8E8E93' }}>
          <Lock size={18} />
          <span style={{ fontSize: '13px', fontWeight: '600', letterSpacing: '1px' }}>UÇUCU VERİ EKRANI</span>
        </div>
        
        <div style={{ backgroundColor: '#F2F2F7', borderRadius: '16px', padding: '24px', marginBottom: '32px' }}>
          
          {/* YENİ: URL VE METİN İÇİN KOŞULLU YAPI */}
          {data.type === 'url' ? (
            <a 
              // EĞER LİNK http İLE BAŞLAMIYORSA ARKA PLANDA OTOMATİK OLARAK https:// EKLER
              href={data.content.startsWith('http') ? data.content : `https://${data.content}`} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ 
                fontSize: '20px', 
                color: '#007AFF', 
                wordBreak: 'break-all', 
                lineHeight: '1.4', 
                fontWeight: '500',
                textDecoration: 'underline',
                display: 'block'
              }}
            >
              {data.content} {/* Ekranda kullanıcının yazdığı o sade ve temiz hali görünür */}
            </a>
          ) : (
            <p style={{ fontSize: '20px', color: '#1D1D1F', wordBreak: 'break-all', lineHeight: '1.4', fontWeight: '500' }}>
              {data.content}
            </p>
          )}

        </div>

        <button 
          onClick={handleCopy} 
          className={`primary-btn ${copied ? 'success' : ''}`}
        >
          {copied ? <Check size={20} /> : <Copy size={20} />}
          {copied ? 'Kopyalandı' : 'Tek Tıkla Kopyala'}
        </button>

        <p style={{ textAlign: 'center', color: '#8E8E93', fontSize: '13px', marginTop: '24px' }}>
          Bu pencereyi kapattığınız an veri kalıcı olarak imha edilecektir.
        </p>
      </div>
    </div>
  );
}
export default App;