import React, { useState } from 'react';
import { Send, X, User, MessageSquareText, ShieldAlert } from 'lucide-react';
import { GOOGLE_DOCS_FEEDBACK_WEBAPP_URL } from '../utils';

interface FeedbackModalProps {
  onClose: () => void;
  showNotification: (message: string, type: 'success' | 'dev' | 'error') => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ onClose, showNotification }) => {
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [name, setName] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!feedback.trim()) {
      showNotification('Pesan masukan dan saran tidak boleh kosong.', 'error');
      return;
    }

    if (!isAnonymous && !name.trim()) {
      showNotification('Silakan isi nama Anda atau pilih opsi Kirim sebagai Anonim.', 'error');
      return;
    }

    if (!GOOGLE_DOCS_FEEDBACK_WEBAPP_URL) {
      // Simulate successful sending if URL is not yet configured, so user can see it works UI-wise.
      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        showNotification('Web App URL belum diisi di utils.ts. (Simulasi Berhasil Terkirim)', 'dev');
        onClose();
      }, 1500);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: isAnonymous ? 'Anonym' : name.trim(),
        feedback: feedback.trim(),
      };

      const response = await fetch(GOOGLE_DOCS_FEEDBACK_WEBAPP_URL, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        showNotification('Masukan dan saran berhasil dikirim! Terima kasih.', 'success');
        onClose();
      } else {
        throw new Error('Gagal merespon dari server');
      }
    } catch (error) {
      console.error(error);
      showNotification('Terjadi kesalahan saat mengirim masukan. Pastikan URL Web App sudah benar.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden max-w-md w-full border border-slate-100 dark:border-slate-800 shadow-2xl font-sans flex flex-col transition-colors">
      <div className="bg-teal-950 p-6 sm:p-8 text-white relative overflow-hidden shrink-0">
        <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center gap-3">
          <MessageSquareText className="w-8 h-8 text-teal-400" />
          <div>
            <h3 className="text-xl font-black tracking-tight font-sans">Masukan &amp; Saran</h3>
            <p className="text-teal-300 text-xs mt-0.5 font-sans">Bantu EZKOAS menjadi lebih baik!</p>
          </div>
        </div>
      </div>

      <div className="p-6 overflow-y-auto flex-1">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">Kirim Sebagai</label>
            <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors">
              <input
                type="checkbox"
                id="anonimCheck"
                checked={isAnonymous}
                onChange={(e) => {
                  setIsAnonymous(e.target.checked);
                  if (e.target.checked) setName('');
                }}
                className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500 border-gray-300"
              />
              <label htmlFor="anonimCheck" className="text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                Kirim sebagai Anonim
              </label>
            </div>
          </div>

          {!isAnonymous && (
            <div className="space-y-1.5 animate-fade-in">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">Nama Anda</label>
              <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus-within:border-teal-500 rounded-xl overflow-hidden px-3.5 py-2.5 transition-colors">
                <User className="w-4 h-4 text-slate-400 shrink-0 mr-2" />
                <input
                  type="text"
                  placeholder="Misal: Andy"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-transparent text-sm font-semibold focus:outline-none placeholder:text-slate-300 dark:placeholder:text-slate-500 text-slate-800 dark:text-white"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">Pesan Saran &amp; Masukan</label>
            <textarea
              placeholder="Tambahkan fitur ini itu..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-teal-500 rounded-xl px-3.5 py-3 text-sm font-medium focus:outline-none resize-none placeholder:text-slate-300 dark:placeholder:text-slate-500 text-slate-800 dark:text-white transition-colors"
              disabled={isSubmitting}
            />
          </div>

          {!GOOGLE_DOCS_FEEDBACK_WEBAPP_URL && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl p-3 flex gap-2.5 text-amber-800 dark:text-amber-200 text-[11px] leading-relaxed transition-colors">
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <p>
                <strong>Belum Diatur:</strong> URL integrasi Google Docs belum dipasang di kode. Pesan saat ini hanya akan disimulasikan.
              </p>
            </div>
          )}

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold transition flex-1"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-3 bg-teal-600 hover:bg-teal-700 active:scale-[0.98] text-white rounded-xl text-sm font-bold transition flex flex-1 items-center justify-center gap-2 shadow-sm shadow-teal-600/20 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="animate-pulse">Mengirim...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Kirim Pesan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
