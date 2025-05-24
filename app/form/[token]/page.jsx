'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Send } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Animation variants
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  hover: { scale: 1.05, boxShadow: '0 10px 20px rgba(0,0,0,0.15)' },
};

export default function PatientForm({ params }) {
  const [patientName, setPatientName] = useState('');
  const [message, setMessage] = useState('');
  const [mood, setMood] = useState('');
  const [stress, setStress] = useState('');
  const [offlineSession, setOfflineSession] = useState(false);
  const [isValidToken, setIsValidToken] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { token } = React.use(params);

  useEffect(() => {
    if (token) {
      validateToken();
    } else {
      setError('Tidak ada token yang diberikan');
      setIsLoading(false);
      setIsValidToken(false);
    }
  }, [token]);

  async function validateToken() {
    try {
      const { data, error } = await supabase
        .from('tokens')
        .select('id, patient_id, used')
        .eq('token', token)
        .single();

      if (error || !data) {
        throw new Error('Invalid token');
      }
      if (data.used) {
        throw new Error('Token has already been used');
      }

      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('name')
        .eq('id', data.patient_id)
        .single();

      if (patientError || !patient) {
        throw new Error('Patient not found');
      }

      setPatientName(patient.name);
      setIsValidToken(true);
    } catch (err) {
      setError(
        err.message === 'Invalid token'
          ? 'Token tidak valid'
          : err.message === 'Token has already been used'
            ? 'Token sudah digunakan'
            : 'Pasien tidak ditemukan'
      );
      setIsValidToken(false);
      console.error('Token validation error:', err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setWarning('');
    setIsLoading(true);

    try {
      if (mood && (isNaN(mood) || mood < 1 || mood > 5)) {
        throw new Error('Mood harus antara 1 dan 5');
      }
      if (stress && (isNaN(stress) || stress < 1 || stress > 5)) {
        throw new Error('Stres harus antara 1 dan 5');
      }

      const response = await fetch('/api/submit-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          message,
          mood: mood ? parseInt(mood) : null,
          stress: stress ? parseInt(stress) : null,
          offline_session_requested: offlineSession,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Gagal mengirimkan formulir');
      }

      if (data.warning) {
        setWarning(
          data.warning === 'Patient not found'
            ? 'Pasien tidak ditemukan'
            : data.warning
        );
      }

      setSubmitted(true);
    } catch (err) {
      setError(err.message);
      console.error('Form submission error:', err);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-[#FFE4E1] to-[#FFD1CC]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-teal-500"></div>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFE4E1] to-[#FFD1CC] flex items-center justify-center p-4">
        <Card className="bg-gradient-to-br from-white to-[#E6FFFA] border-none shadow-xl rounded-2xl">
          <CardContent className="p-10 text-center">
            <h2 className="text-2xl font-semibold text-teal-800 mb-4">
              Kesalahan
            </h2>
            <p className="text-red-600 text-base font-normal leading-relaxed mb-4">
              {error}
            </p>
            <Button
              onClick={() => router.push('/')}
              className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white rounded-full px-8 text-base font-medium"
            >
              Kembali ke Beranda
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFE4E1] to-[#FFD1CC] flex items-center justify-center p-4">
        <Card className="bg-gradient-to-br from-white to-[#E6FFFA] border-none shadow-xl rounded-2xl">
          <CardContent className="p-10 text-center">
            <h2 className="text-2xl font-semibold text-teal-800 mb-4">
              Terima Kasih, {patientName}!
            </h2>
            <p className="text-teal-600 text-base font-normal leading-relaxed mb-4">
              Respons Anda telah berhasil dikirim.
            </p>
            {warning && (
              <p className="text-yellow-600 text-base font-normal leading-relaxed mb-4">
                {warning}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#FFE4E1] to-[#FFD1CC] font-poppins">
      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Card className="bg-gradient-to-br from-white to-[#E6FFFA] border-none shadow-xl rounded-2xl overflow-hidden">
          <CardContent className="p-10">
            <h2 className="text-2xl font-semibold text-teal-800 mb-6">
              Formulir Kesejahteraan untuk {patientName}
            </h2>
            <p className="text-teal-600 mb-8 text-base font-normal leading-relaxed">
              Silakan isi formulir ini untuk berbagi bagaimana perasaan Anda
              saat ini. Semua kolom bersifat opsional kecuali tombol kirim. Isi
              sesuai kenyamanan Anda, dan informasi ini akan membantu terapis
              Anda memberikan dukungan yang lebih baik.
            </p>
            <form onSubmit={handleSubmit} className="space-y-10">
              {/* Message */}
              <div className="space-y-4">
                <Label
                  htmlFor="message"
                  className="text-teal-700 font-medium text-base"
                >
                  Bagaimana perasaan Anda? (Opsional)
                </Label>
                <p className="text-sm text-teal-600 font-normal leading-relaxed">
                  Tulis apa saja yang ingin Anda bagikan, seperti suasana hati
                  atau pengalaman terkini.
                </p>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Bagikan pikiran atau pembaruan Anda..."
                  className="w-full min-h-[150px] border-teal-300 focus:border-teal-500 focus:ring-teal-500 rounded-lg text-base font-normal"
                />
              </div>

              {/* Mood Level */}
              <div className="space-y-4">
                <Label className="text-teal-700 font-medium text-base">
                  Suasana Hati (1 = Rendah, 5 = Tinggi, Opsional)
                </Label>
                <p className="text-sm text-teal-600 font-normal leading-relaxed">
                  Pilih angka yang mencerminkan suasana hati Anda saat ini, dari
                  1 (sangat buruk) hingga 5 (sangat baik).
                </p>
                <RadioGroup
                  name="mood"
                  value={mood}
                  onValueChange={(value) => setMood(parseInt(value))}
                  className="flex gap-4 flex-wrap"
                >
                  {[1, 2, 3, 4, 5].map((value) => (
                    <div key={`mood-${value}`} className="flex items-center">
                      <RadioGroupItem
                        value={value.toString()}
                        id={`mood-${value}`}
                        className="sr-only"
                      />
                      <Label
                        htmlFor={`mood-${value}`}
                        className={`w-12 h-12 flex items-center justify-center rounded-full border-2 cursor-pointer text-base font-medium ${
                          mood === value
                            ? 'bg-teal-500 border-teal-500 text-white'
                            : 'border-teal-300 text-teal-600 hover:bg-teal-50'
                        }`}
                      >
                        {value}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Stress Level */}
              <div className="space-y-4">
                <Label className="text-teal-700 font-medium text-base">
                  Stres (1 = Rendah, 5 = Tinggi, Opsional)
                </Label>
                <p className="text-sm text-teal-600 font-normal leading-relaxed">
                  Pilih angka yang mencerminkan tingkat stres Anda, dari 1
                  (sangat rendah) hingga 5 (sangat tinggi).
                </p>
                <RadioGroup
                  name="stress"
                  value={stress}
                  onValueChange={(value) => setStress(parseInt(value))}
                  className="flex gap-4 flex-wrap"
                >
                  {[1, 2, 3, 4, 5].map((value) => (
                    <div key={`stress-${value}`} className="flex items-center">
                      <RadioGroupItem
                        value={value.toString()}
                        id={`stress-${value}`}
                        className="sr-only"
                      />
                      <Label
                        htmlFor={`stress-${value}`}
                        className={`w-12 h-12 flex items-center justify-center rounded-full border-2 cursor-pointer text-base font-medium ${
                          stress === value
                            ? 'bg-teal-500 border-teal-500 text-white'
                            : 'border-teal-300 text-teal-600 hover:bg-teal-50'
                        }`}
                      >
                        {value}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Offline Session */}
              <div className="flex items-center gap-3">
                <Checkbox
                  id="offlineSession"
                  checked={offlineSession}
                  onCheckedChange={setOfflineSession}
                />
                <div>
                  <Label
                    htmlFor="offlineSession"
                    className="text-teal-700 font-medium text-base"
                  >
                    Minta Sesi Tatap Muka
                  </Label>
                  <p className="text-sm text-teal-600 font-normal leading-relaxed">
                    Centang jika Anda ingin menjadwalkan sesi langsung dengan
                    terapis.
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white rounded-full py-3 flex items-center justify-center gap-3 text-base font-medium"
              >
                {isLoading ? 'Mengirim...' : 'Kirim Respons'}
                <Send size={16} />
              </Button>
            </form>
            <AnimatePresence>
              {error && (
                <motion.p
                  className="mt-6 text-red-600 text-center text-base font-normal leading-relaxed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
