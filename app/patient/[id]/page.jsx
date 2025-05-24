'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Clock, Trash2, LogOut } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Animation variants for cards and dialog
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  hover: { scale: 1.05, boxShadow: '0 10px 20px rgba(0,0,0,0.15)' },
};

const dialogVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
};

export default function PatientDetails({ params }) {
  const [patient, setPatient] = useState(null);
  const [responses, setResponses] = useState([]);
  const [notes, setNotes] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [score, setScore] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isUpdatingScore, setIsUpdatingScore] = useState(false);
  const [isAssigningSession, setIsAssigningSession] = useState(false);
  const router = useRouter();
  const { id } = React.use(params);

  useEffect(() => {
    checkUser();
    if (id) {
      fetchPatient();
      fetchResponses();
      fetchNotes();
      fetchSessions();
    }
  }, [id]);

  async function checkUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) router.push('/login');
  }

  async function fetchPatient() {
    try {
      const response = await fetch(`/api/patients?id=${id}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error fetching patient');
      }
      const data = await response.json();
      if (!data[0]) {
        throw new Error('Patient not found');
      }
      setPatient(data[0]);
    } catch (error) {
      setSuccessMessage(
        error.message === 'Patient not found'
          ? 'Pasien tidak ditemukan'
          : 'Kesalahan saat mengambil data pasien'
      );
      setIsSuccessDialogOpen(true);
      console.error('Fetch patient error:', error);
    }
  }

  async function fetchResponses() {
    try {
      const response = await fetch(`/api/responses?id=${id}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error fetching submissions');
      }
      const data = await response.json();
      setResponses(data);
    } catch (error) {
      setSuccessMessage('Kesalahan saat mengambil pengajuan');
      setIsSuccessDialogOpen(true);
      console.error('Fetch responses error:', error);
    }
  }

  async function fetchNotes() {
    try {
      const { data, error } = await supabase
        .from('patient_notes')
        .select('id, note, created_at')
        .eq('patient_id', id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setNotes(data);
    } catch (error) {
      setSuccessMessage('Kesalahan saat mengambil catatan');
      setIsSuccessDialogOpen(true);
      console.error('Fetch notes error:', error);
    }
  }

  async function fetchSessions() {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('id, session_date, created_at')
        .eq('patient_id', id)
        .order('session_date', { ascending: false });
      if (error) throw error;
      setSessions(data);
    } catch (error) {
      setSuccessMessage('Kesalahan saat mengambil sesi');
      setIsSuccessDialogOpen(true);
      console.error('Fetch sessions error:', error);
    }
  }

  async function logOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push('/login');
    } catch (error) {
      setSuccessMessage('Kesalahan saat keluar');
      setIsSuccessDialogOpen(true);
      console.error('Logout error:', error);
    }
  }

  async function deleteUser(e) {
    e.preventDefault();
    try {
      const response = await fetch(`/api/patients?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error deleting patient');
      }

      setIsDeleteDialogOpen(false);
      router.push('/');
    } catch (error) {
      setSuccessMessage(
        error.message === 'Error deleting patient'
          ? 'Kesalahan saat menghapus pasien'
          : error.message
      );
      setIsSuccessDialogOpen(true);
      console.error('Delete patient error:', error);
    }
  }

  async function handleAddNote() {
    if (!newNote) {
      setSuccessMessage('Catatan tidak boleh kosong');
      setIsSuccessDialogOpen(true);
      return;
    }
    setIsAddingNote(true);
    try {
      const { error } = await supabase
        .from('patient_notes')
        .insert({ patient_id: id, note: newNote });
      if (error) throw error;
      setNotes([
        { id: crypto.randomUUID(), note: newNote, created_at: new Date() },
        ...notes,
      ]);
      setNewNote('');
      setSuccessMessage('Catatan berhasil ditambahkan');
      setIsSuccessDialogOpen(true);
    } catch (error) {
      setSuccessMessage('Kesalahan saat menambahkan catatan');
      setIsSuccessDialogOpen(true);
      console.error('Add note error:', error);
    } finally {
      setIsAddingNote(false);
    }
  }

  async function handleUpdateScore() {
    const scoreNum = parseInt(score);
    if (isNaN(scoreNum) || scoreNum < 1 || scoreNum > 10) {
      setSuccessMessage('Skor harus antara 1–10');
      setIsSuccessDialogOpen(true);
      return;
    }
    setIsUpdatingScore(true);
    try {
      const { error } = await supabase
        .from('patients')
        .update({ well_being_score: scoreNum })
        .eq('id', id);
      if (error) throw error;
      setPatient({ ...patient, well_being_score: scoreNum });
      setScore('');
      setSuccessMessage('Skor berhasil diperbarui');
      setIsSuccessDialogOpen(true);
    } catch (error) {
      setSuccessMessage('Kesalahan saat memperbarui skor');
      setIsSuccessDialogOpen(true);
      console.error('Update score error:', error);
    } finally {
      setIsUpdatingScore(false);
    }
  }

  async function handleAssignSession() {
    if (!sessionDate) {
      setSuccessMessage('Silakan pilih tanggal sesi');
      setIsSuccessDialogOpen(true);
      return;
    }
    const sessionDateTime = new Date(sessionDate);
    if (isNaN(sessionDateTime)) {
      setSuccessMessage('Tanggal tidak valid');
      setIsSuccessDialogOpen(true);
      return;
    }
    setIsAssigningSession(true);
    try {
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          patient_id: id,
          session_date: sessionDateTime.toISOString(),
        })
        .select('id')
        .single();
      if (sessionError) throw sessionError;

      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('name, email')
        .eq('id', id)
        .single();
      if (patientError) throw patientError;

      const response = await fetch('/api/notify-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: id,
          patient_name: patientData.name,
          patient_email: patientData.email,
          session_date: sessionDateTime.toISOString(),
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        setSuccessMessage(
          result.error || 'Sesi ditetapkan tetapi notifikasi email gagal'
        );
        setIsSuccessDialogOpen(true);
        return;
      }

      setSessions([
        {
          id: sessionData.id,
          session_date: sessionDateTime,
          created_at: new Date(),
        },
        ...sessions,
      ]);
      setSessionDate('');
      setSuccessMessage(
        result.message || 'Sesi berhasil ditetapkan dan pasien diberitahu'
      );
      setIsSuccessDialogOpen(true);
    } catch (error) {
      setSuccessMessage('Kesalahan saat menetapkan sesi: ' + error.message);
      setIsSuccessDialogOpen(true);
      console.error('Assign session error:', error);
    } finally {
      setIsAssigningSession(false);
    }
  }

  function getDaysSinceResponse(lastResponseDate) {
    if (!lastResponseDate) return 'Belum ada respons';
    const today = new Date();
    const responseDate = new Date(lastResponseDate);
    const diffInMs = today - responseDate;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    if (diffInDays === 0) return 'Hari ini';
    return `${diffInDays} hari lalu`;
  }

  if (!patient && successMessage) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-[#FFE4E1] to-[#FFD1CC]">
        <p className="text-red-600 text-base font-normal leading-relaxed mb-4">
          {successMessage}
        </p>
        <Button
          variant="outline"
          className="border-teal-500 text-teal-500 hover:bg-teal-50 rounded-full flex items-center gap-2 text-base font-medium cursor-pointer"
          onClick={() => router.push('/')}
        >
          <ArrowLeft size={16} />
          Kembali ke Dasbor
        </Button>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-[#FFE4E1] to-[#FFD1CC]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#FFE4E1] to-[#FFD1CC] font-poppins">
      {/* Navbar */}
      <nav className="bg-teal-600 p-6 flex items-center justify-between shadow-lg sticky top-0 z-10 rounded-b-2xl">
        <div className="flex items-center gap-4">
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button
              variant="outline"
              className="bg-white text-teal-600 border-teal-600 hover:bg-teal-100 hover:text-teal-700 rounded-full px-6 py-2 text-base font-medium cursor-pointer shadow-md"
              onClick={() => router.push('/')}
              aria-label="Kembali ke dasbor"
            >
              <ArrowLeft size={18} className="mr-2" />
              Kembali
            </Button>
          </motion.div>
          <div className="text-center">
            <h1 className="font-semibold text-2xl text-white">
              Detail {patient.name}
            </h1>
            <p className="text-xs text-teal-100 font-normal leading-relaxed">
              Profil Pasien
            </p>
          </div>
        </div>
        <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
          <DialogTrigger asChild>
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                className="text-white hover:text-yellow-300"
                aria-label="Buka konfirmasi keluar"
              >
                <LogOut size={20} />
              </Button>
            </motion.div>
          </DialogTrigger>
          <AnimatePresence>
            {isLogoutDialogOpen && (
              <DialogContent className="sm:max-w-md bg-white rounded-2xl shadow-2xl">
                <motion.div
                  variants={dialogVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                >
                  <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-teal-800">
                      Konfirmasi Keluar
                    </DialogTitle>
                    <DialogDescription className="text-gray-600 text-base font-normal leading-relaxed">
                      Apakah Anda yakin ingin keluar? Anda perlu masuk kembali
                      untuk mengakses dasbor.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="mt-4">
                    <Button
                      variant="outline"
                      className="border-teal-300 text-teal-700 hover:bg-teal-50 rounded-full px-6 text-base font-medium cursor-pointer"
                      onClick={() => setIsLogoutDialogOpen(false)}
                      aria-label="Batalkan keluar"
                    >
                      Batal
                    </Button>
                    <Button
                      className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white rounded-full px-6 text-base font-medium cursor-pointer"
                      onClick={() => {
                        setIsLogoutDialogOpen(false);
                        logOut();
                      }}
                      aria-label="Konfirmasi keluar"
                    >
                      Konfirmasi
                    </Button>
                  </DialogFooter>
                </motion.div>
              </DialogContent>
            )}
          </AnimatePresence>
        </Dialog>
      </nav>

      {/* Success Dialog */}
      <Dialog
        open={isSuccessDialogOpen}
        onOpenChange={(open) => {
          setIsSuccessDialogOpen(open);
          if (!open) setSuccessMessage(''); // Clear message when closing
        }}
      >
        <DialogContent className="sm:max-w-md bg-white rounded-2xl shadow-2xl">
          <motion.div
            variants={dialogVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-teal-800">
                {successMessage.includes('Kesalahan')
                  ? 'Kesalahan'
                  : 'Berhasil'}
              </DialogTitle>
              <DialogDescription className="text-gray-600 text-base font-normal leading-relaxed">
                {successMessage}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
              <Button
                className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white rounded-full px-6 text-base font-medium cursor-pointer"
                onClick={() => {
                  setIsSuccessDialogOpen(false);
                  setSuccessMessage(''); // Clear message when closing
                }}
                aria-label="Tutup notifikasi"
              >
                Tutup
              </Button>
            </DialogFooter>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Patient Info Card */}
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover="hover"
        >
          <Card className="bg-gradient-to-br from-white to-[#E6FFFA] border-none shadow-xl rounded-2xl overflow-hidden mb-8">
            <CardContent className="p-6 relative">
              <div className="absolute top-6 right-6">
                <Dialog
                  open={isDeleteDialogOpen}
                  onOpenChange={setIsDeleteDialogOpen}
                >
                  <DialogTrigger asChild>
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Trash2
                        className="cursor-pointer text-teal-600 hover:text-red-600"
                        size={20}
                        aria-label="Buka konfirmasi hapus pasien"
                        onClick={() => setIsDeleteDialogOpen(true)}
                      />
                    </motion.div>
                  </DialogTrigger>
                  <AnimatePresence>
                    {isDeleteDialogOpen && (
                      <DialogContent className="sm:max-w-md bg-white rounded-2xl shadow-2xl">
                        <motion.div
                          variants={dialogVariants}
                          initial="hidden"
                          animate="visible"
                          exit="hidden"
                        >
                          <DialogHeader>
                            <DialogTitle className="text-xl font-semibold text-teal-800">
                              Konfirmasi Hapus
                            </DialogTitle>
                            <DialogDescription className="text-gray-600 text-base font-normal leading-relaxed">
                              Apakah Anda yakin ingin menghapus {patient.name}?
                              Tindakan ini tidak dapat dibatalkan.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter className="mt-4">
                            <Button
                              variant="outline"
                              className="border-teal-300 text-teal-700 hover:bg-teal-50 rounded-full px-6 text-base font-medium cursor-pointer"
                              onClick={() => setIsDeleteDialogOpen(false)}
                              aria-label="Batalkan hapus"
                            >
                              Batal
                            </Button>
                            <Button
                              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-full px-6 text-base font-medium cursor-pointer"
                              onClick={(e) => deleteUser(e)}
                              aria-label="Konfirmasi hapus"
                            >
                              Konfirmasi
                            </Button>
                          </DialogFooter>
                        </motion.div>
                      </DialogContent>
                    )}
                  </AnimatePresence>
                </Dialog>
              </div>
              <h2 className="text-xl font-semibold text-teal-800 mb-4">
                Informasi Pasien
              </h2>
              <div className="grid gap-3">
                <p className="text-teal-600 text-base font-normal leading-relaxed">
                  <span className="font-medium">Email:</span> {patient.email}
                </p>
                <p className="text-teal-600 text-base font-normal leading-relaxed flex items-center gap-2">
                  <span className="font-medium">Respons Terakhir:</span>
                  <Clock size={14} />
                  {getDaysSinceResponse(patient.last_response_date)}
                </p>
                <p className="text-teal-600 text-base font-normal leading-relaxed">
                  <span className="font-medium">Skor Kesejahteraan:</span>{' '}
                  {patient.well_being_score ?? 'Belum ditetapkan'}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Actions Section */}
        <div className="grid gap-8 mb-10">
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
          >
            <Card className="bg-gradient-to-br from-white to-[#E6FFFA] border-none shadow-xl rounded-2xl overflow-hidden">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-teal-800 mb-4">
                  Tambah Catatan
                </h2>
                <Textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Masukkan catatan..."
                  className="mb-4 border-teal-300 focus:border-teal-500 focus:ring-teal-500 rounded-lg text-base font-normal"
                  disabled={isAddingNote}
                />
                <Button
                  onClick={handleAddNote}
                  className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white rounded-full px-8 text-base font-medium"
                  disabled={isAddingNote}
                >
                  {isAddingNote ? 'Memproses...' : 'Tambah Catatan'}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
          <div className="grid grid-cols-2 gap-4">
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
            >
              <Card className="bg-gradient-to-br from-white to-[#E6FFFA] border-none shadow-xl rounded-2xl overflow-hidden">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-teal-800 mb-4">
                    Perbarui Skor Kesejahteraan (1–10)
                  </h2>
                  <Input
                    type="number"
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    min="1"
                    max="10"
                    placeholder="Masukkan skor"
                    className="mb-4 border-teal-300 focus:border-teal-500 focus:ring-teal-500 rounded-lg text-base font-normal"
                    disabled={isUpdatingScore}
                  />
                  <Button
                    onClick={handleUpdateScore}
                    className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white rounded-full px-8 text-base font-medium"
                    disabled={isUpdatingScore}
                  >
                    {isUpdatingScore ? 'Memproses...' : 'Perbarui Skor'}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
            >
              <Card className="bg-gradient-to-br from-white to-[#E6FFFA] border-none shadow-xl rounded-2xl overflow-hidden">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-teal-800 mb-4">
                    Tetapkan Sesi Tatap Muka
                  </h2>
                  <Input
                    type="datetime-local"
                    value={sessionDate}
                    onChange={(e) => setSessionDate(e.target.value)}
                    className="mb-4 border-teal-300 focus:border-teal-500 focus:ring-teal-500 rounded-lg text-base font-normal"
                    disabled={isAssigningSession}
                  />
                  <Button
                    onClick={handleAssignSession}
                    className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white rounded-full px-8 text-base font-medium"
                    disabled={isAssigningSession}
                  >
                    {isAssigningSession ? 'Memproses...' : 'Tetapkan Sesi'}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Form Submissions Section */}
        <h2 className="text-xl font-semibold text-teal-800 mb-6">
          Pengajuan Formulir
        </h2>
        <div className="grid gap-8 mb-10">
          {responses.length === 0 ? (
            <p className="text-teal-600 text-base font-normal leading-relaxed text-center">
              Tidak ada pengajuan tersedia.
            </p>
          ) : (
            responses.map((response) => (
              <motion.div
                key={response.id}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
              >
                <Card className="bg-gradient-to-br from-white to-[#E6FFFA] border-none shadow-xl rounded-2xl overflow-hidden">
                  <CardContent className="p-6">
                    <div className="grid gap-4">
                      <p className="text-teal-600 text-base font-normal leading-relaxed">
                        <span className="font-medium">Pesan:</span>{' '}
                        {response.response_data.message || 'Tidak ada'}
                      </p>
                      <div className="flex gap-4">
                        <p className="text-teal-600 text-base font-normal leading-relaxed">
                          <span className="font-medium">Suasana Hati:</span>{' '}
                          {response.response_data.mood || 'Tidak diberikan'}
                        </p>
                        <p className="text-teal-600 text-base font-normal leading-relaxed">
                          <span className="font-medium">Stres:</span>{' '}
                          {response.response_data.stress || 'Tidak diberikan'}
                        </p>
                      </div>
                      <p className="text-teal-600 text-base font-normal leading-relaxed">
                        <span className="font-medium">
                          Permintaan Sesi Tatap Muka:
                        </span>{' '}
                        {response.offline_session_requested ? 'Ya' : 'Tidak'}
                      </p>
                      <p className="text-teal-500 text-sm font-normal leading-relaxed flex items-center gap-2">
                        <Clock size={14} />
                        Dikirim:{' '}
                        {new Date(response.submitted_at).toLocaleString(
                          'id-ID'
                        )}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        {/* Sessions Section */}
        <h2 className="text-xl font-semibold text-teal-800 mb-6">Sesi</h2>
        <div className="grid gap-8 mb-10">
          {sessions.length === 0 ? (
            <p className="text-teal-600 text-base font-normal leading-relaxed text-center">
              Tidak ada sesi yang dijadwalkan.
            </p>
          ) : (
            sessions.map((session) => (
              <motion.div
                key={session.id}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
              >
                <Card className="bg-gradient-to-br from-white to-[#E6FFFA] border-none shadow-xl rounded-2xl overflow-hidden">
                  <CardContent className="p-6">
                    <p className="text-teal-600 text-base font-normal leading-relaxed flex items-center gap-2">
                      <Clock size={14} />
                      Tanggal Sesi:{' '}
                      {new Date(session.session_date).toLocaleString('id-ID')}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        {/* Notes Section */}
        <h2 className="text-xl font-semibold text-teal-800 mb-6">Catatan</h2>
        <div className="grid gap-8">
          {notes.length === 0 ? (
            <p className="text-teal-600 text-base font-normal leading-relaxed text-center">
              Tidak ada catatan tersedia.
            </p>
          ) : (
            notes.map((note) => (
              <motion.div
                key={note.id}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
              >
                <Card className="bg-gradient-to-br from-white to-[#E6FFFA] border-none shadow-xl rounded-2xl overflow-hidden">
                  <CardContent className="p-6">
                    <p className="text-teal-600 text-base font-normal leading-relaxed">
                      {note.note}
                    </p>
                    <p className="text-teal-500 text-sm font-normal leading-relaxed flex items-center gap-2">
                      <Clock size={14} />
                      {new Date(note.created_at).toLocaleString('id-ID')}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
