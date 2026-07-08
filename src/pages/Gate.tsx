import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAccessStore } from "../store/useAccess";
import { sha256, VALID_CODE_HASHES } from "../utils/crypto";

export default function Gate() {
  const navigate = useNavigate();
  const { setFullAccess, setFreeAccess, deviceId } = useAccessStore();
  const [showVoucherInput, setShowVoucherInput] = useState(false);
  const [voucherCode, setVoucherCode] = useState("");
  const [userName, setUserName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const handleDonate = () => {
    // Open Trakteer in a new window/tab
    window.open("https://teer.id/paylays", "_blank");
    setShowVoucherInput(true);
  };

  const handleClaimAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    const inputCode = voucherCode.trim().toUpperCase();

    if (!inputCode) {
      setErrorMessage("Silakan masukkan kode voucher.");
      return;
    }

    setIsVerifying(true);
    try {
      const inputHash = await sha256(inputCode);
      const appsScriptUrl = import.meta.env.VITE_APPS_SCRIPT_URL;
      let apiSuccess = false;
      let apiMessage = "";
      let apiFailed = false;

      if (appsScriptUrl) {
        try {
          // Verification using Google Sheets API
          const response = await fetch(appsScriptUrl, {
            method: "POST",
            body: JSON.stringify({
              codeHash: inputHash,
              deviceId: deviceId,
            }),
          });

          const result = await response.json();
          if (result && typeof result === "object") {
            apiSuccess = result.success;
            apiMessage = result.message;
          } else {
            apiFailed = true;
          }
        } catch (apiErr) {
          console.warn(
            "Google Sheets API verification failed, falling back to local validation:",
            apiErr,
          );
          apiFailed = true;
        }
      }

      // If API succeeded, use its result. If API failed or is not configured, fall back to local validation
      if (appsScriptUrl && !apiFailed) {
        if (apiSuccess) {
          setFullAccess(userName.trim() || "Teman Baik");
          navigate("/");
        } else {
          setErrorMessage(
            apiMessage ||
              "Kode voucher tidak valid atau sudah melebihi batas perangkat.",
          );
        }
      } else {
        // Fallback to local validation
        const isValid = VALID_CODE_HASHES.includes(inputHash);
        if (isValid) {
          setFullAccess(userName.trim() || "Teman Baik");
          navigate("/");
        } else {
          setErrorMessage(
            "Kode voucher tidak valid. Silakan periksa kembali pesan terima kasih di Trakteer.",
          );
        }
      }
    } catch (err) {
      console.error("Unexpected error during verification:", err);
      setErrorMessage(
        "Terjadi kesalahan koneksi saat verifikasi. Silakan coba lagi.",
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSkip = () => {
    setFreeAccess();
    navigate("/");
  };

  return (
    <div className="gate page-enter">
      <div className="gate__left">
        <div className="gate__eyebrow">Aplikasi Persiapan TOEFL PBT</div>
        <h1 className="gate__title">
          RC<span className="gate__title-accent">Play</span>
        </h1>
        <div className="gate__underline" />
        <p className="gate__desc">
          Platform latihan ujian Reading Comprehension TOEFL PBT interaktif
          terlengkap. Asah kemampuan membaca bahasa Inggrismu dengan format
          ujian nyata, analisis instan, dan estimasi skor TOEFL PBT secara
          langsung.
        </p>

        <div className="gate__features">
          <div className="gate__feature">
            <span className="gate__feature-icon">✦</span>
            <span>17 Full Practice Test Autentik (PT30–PT46)</span>
          </div>
          <div className="gate__feature">
            <span className="gate__feature-icon">✦</span>
            <span>525 Soal Reading Comprehension Terkurasi</span>
          </div>
          <div className="gate__feature">
            <span className="gate__feature-icon">✦</span>
            <span>Analisis Hasil Lengkap dengan Estimasi Skor TOEFL</span>
          </div>
        </div>

        <div className="gate__ornament" aria-hidden>
          RC
        </div>
      </div>

      <div className="gate__right">
        {!showVoucherInput ? (
          <>
            <div className="gate__card gate__card--featured">
              <div className="gate__card-label">Rekomendasi</div>
              <h2 className="gate__card-price">Full Access</h2>
              <p className="gate__card-period">
                Donasi Min. Rp 10.000 (Sekali bayar)
              </p>
              <div className="gate__card-features">
                <div className="gate__card-feature">
                  Akses penuh ke semua 17 Practice Test
                </div>
                <div className="gate__card-feature">Total 525 Soal Lengkap</div>
                <div className="gate__card-feature">
                  Halaman Statistik & Grafik Kemajuan
                </div>
                <div className="gate__card-feature">
                  Bantu biaya server & pengembangan
                </div>
              </div>
              <button
                className="btn-gate btn-gate--primary"
                onClick={handleDonate}
              >
                Dukung Rp10k & Buka Semua
              </button>
            </div>

            <div className="gate__card">
              <h2 className="gate__card-price">Free Access</h2>
              <p className="gate__card-period">Gratis selamanya</p>
              <div className="gate__card-features">
                <div className="gate__card-feature">
                  Akses ke 3 Practice Test pertama (PT30–PT32)
                </div>
                <div className="gate__card-feature">
                  Total 112 Soal Pilihan Ganda
                </div>
                <div className="gate__card-feature">
                  Analisis hasil instan & Timer MVP
                </div>
              </div>
              <button
                className="btn-gate btn-gate--secondary"
                onClick={handleSkip}
              >
                Coba Gratis (3 Test)
              </button>
            </div>

            <button
              className="btn-gate--text"
              onClick={() => setShowVoucherInput(true)}
            >
              Sudah Donasi? Masukkan Kode Voucher
            </button>
          </>
        ) : (
          <div className="gate__donor-input">
            <h3>Aktifkan Full Access</h3>
            <p style={{ marginBottom: "16px" }}>
              Masukkan kode voucher yang Anda dapatkan dari **Pesan Terima
              Kasih** Trakteer setelah donasi berhasil.
            </p>
            <form onSubmit={handleClaimAccess}>
              <div style={{ marginBottom: "12px" }}>
                <label
                  className="gate__card-label"
                  style={{ display: "block", marginBottom: "6px" }}
                >
                  Nama Kamu (Opsional)
                </label>
                <input
                  type="text"
                  className="gate__input"
                  placeholder="Contoh: Budi"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  maxLength={20}
                  style={{ marginBottom: 0 }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label
                  className="gate__card-label"
                  style={{ display: "block", marginBottom: "6px" }}
                >
                  Kode Voucher Akses
                </label>
                <input
                  type="text"
                  className="gate__input"
                  placeholder="Masukkan kode voucher"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value)}
                  style={{ marginBottom: 0 }}
                  required
                />
              </div>

              {errorMessage && (
                <div
                  style={{
                    color: "var(--error)",
                    fontSize: "12px",
                    marginBottom: "16px",
                    lineHeight: "1.4",
                  }}
                >
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                className="btn-gate btn-gate--primary"
                disabled={isVerifying}
              >
                {isVerifying ? "Memverifikasi..." : "Aktifkan Akses Penuh"}
              </button>

              <button
                type="button"
                className="btn-gate btn-gate--secondary"
                onClick={() => {
                  setShowVoucherInput(false);
                  setErrorMessage("");
                }}
              >
                Kembali
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
