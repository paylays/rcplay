

interface LockedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDonate: () => void;
  testTitle: string;
}

export default function LockedModal({ isOpen, onClose, onDonate, testTitle }: LockedModalProps) {
  if (!isOpen) return null;

  return (
    <div className="locked-modal-overlay" onClick={onClose}>
      <div className="locked-modal" onClick={(e) => e.stopPropagation()}>
        <div className="locked-modal__icon">🔒</div>
        <h2 className="locked-modal__title">Akses Terbatas</h2>
        <p className="locked-modal__desc">
          Latihan <strong>{testTitle}</strong> adalah bagian dari premium test.
          Dukung pengembangan aplikasi ini dengan donasi minimal <strong>Rp10.000</strong> melalui Trakteer untuk membuka akses ke semua 17 practice test secara permanen.
        </p>
        <div className="locked-modal__actions">
          <button className="btn-gate --secondary" style={{ marginBottom: 0 }} onClick={onClose}>
            Batal
          </button>
          <button className="btn-gate --primary" style={{ marginBottom: 0, flex: 1 }} onClick={onDonate}>
            Dukung Rp10k
          </button>
        </div>
      </div>
    </div>
  );
}
