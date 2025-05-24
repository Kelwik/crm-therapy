'use client';
import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Users, Mail, TriangleAlert, Clock, LogOut } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

// Initialize Supabase client
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

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientEmail, setNewPatientEmail] = useState('');
  const [newPatientDate, setNewPatientDate] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [backupMessage, setBackupMessage] = useState('');
  const [unresponseEmail, setUnresponseEmail] = useState(0);
  const [patientNeedAttention, setPatientNeedAttention] = useState(0);
  const [phoneNumber, setPhoneNumber] = useState(0);
  const router = useRouter();

  useEffect(() => {
    checkUser();
    getPatients();
    getUnreads();
    getAttentionPatient();
  }, []);

  async function triggerNodemailerEmails() {
    try {
      const response = await fetch('/api/send-email', { method: 'POST' });
      const data = await response.json();
      setBackupMessage(data.message || data.error);
      console.log(data.message);
    } catch (err) {
      setBackupMessage('Error triggering Nodemailer emails');
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

  async function getUnreads() {
    const { data, error } = await supabase
      .from('tokens')
      .select('*')
      .eq('used', false);
    if (error) console.log(error);
    else {
      console.log(data);
      setUnresponseEmail(data.length);
    }
  }

  async function getAttentionPatient() {
    const { data, error } = await supabase
      .from('patients')
      .select('id,well_being_score')
      .lt('well_being_score', 4);

    setPatientNeedAttention(data.length);
  }

  async function getPatients() {
    try {
      const res = await fetch('/api/patients');
      if (!res.ok) throw new Error('Failed to fetch patients');
      const data = await res.json();
      setPatients(data);
    } catch (error) {
      console.error('Get patients error:', error);
      setPatients([]);
    }
  }

  async function addPatient(e) {
    e.preventDefault();
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      const timestampz = newPatientDate
        ? new Date(newPatientDate).toISOString()
        : null;

      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          newPatientName,
          newPatientEmail,
          date: timestampz,
          phoneNumber,
        }),
      });

      if (response.ok) {
        setNewPatientName('');
        setNewPatientEmail('');
        setNewPatientDate('');
        setPhoneNumber(0);
        getPatients();
        setIsDialogOpen(false);
      } else {
        console.error('Add patient error:', await response.text());
      }
    } catch (error) {
      console.error('Add patient failed:', error);
    }
  }

  async function checkUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect('/login');
    else setIsLoading(false);
  }

  async function logOut() {
    const { error } = await supabase.auth.signOut();
    redirect('/login');
  }

  if (isLoading) {
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
        <div className="absolute left-1/2 transform -translate-x-1/2 text-center">
          <h1 className="font-semibold text-2xl text-white">MindCare</h1>
          <p className="text-xs text-teal-100 font-normal leading-relaxed">
            Dasbor Pasien
          </p>
        </div>
        <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
          <DialogTrigger asChild>
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <LogOut
                className="cursor-pointer text-white hover:text-yellow-300"
                aria-label="Buka konfirmasi keluar"
                onClick={() => setIsLogoutDialogOpen(true)}
              />
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
          {[
            { icon: Users, title: 'Total Pasien', value: patients.length },
            {
              icon: Mail,
              title: 'Email Belum Dibaca',
              value: unresponseEmail ? unresponseEmail : 0,
            },
            {
              icon: TriangleAlert,
              title: 'Pasien Perlu Perhatian',
              value: patientNeedAttention,
            },
          ].map((stat, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
            >
              <Card className="bg-gradient-to-br from-white to-[#E6FFFA] border-none shadow-xl rounded-2xl overflow-hidden">
                <CardContent className="flex items-center gap-4 p-6">
                  <stat.icon className="text-teal-500" size={48} />
                  <div>
                    <p className="text-base text-teal-700 font-medium leading-relaxed">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-semibold text-teal-800">
                      {stat.value}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Patient List Header */}
        <div className="flex flex-row justify-between items-center mb-8">
          <h2 className="text-2xl font-semibold text-teal-800">
            Daftar Pasien
          </h2>
          <div className="flex gap-4">
            <Button
              className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white rounded-full px-8 text-base font-medium cursor-pointer"
              onClick={triggerNodemailerEmails}
            >
              Cek Email
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white rounded-full px-8 text-base font-medium cursor-pointer">
                  Tambah Pasien
                </Button>
              </DialogTrigger>
              <AnimatePresence>
                {isDialogOpen && (
                  <DialogContent className="sm:max-w-md bg-white rounded-2xl shadow-2xl">
                    <motion.div
                      variants={dialogVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                    >
                      <DialogHeader>
                        <DialogTitle className="text-xl font-semibold text-teal-800">
                          Tambah Pasien Baru
                        </DialogTitle>
                        <DialogDescription className="text-gray-600 text-base font-normal leading-relaxed">
                          Masukkan detail pasien di bawah ini. Klik simpan untuk
                          menambahkan.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={addPatient}>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label className="text-teal-700 font-medium text-base">
                              Nama
                            </Label>
                            <Input
                              value={newPatientName}
                              onChange={(e) =>
                                setNewPatientName(e.target.value)
                              }
                              className="border-teal-300 focus:border-teal-500 focus:ring-teal-500 rounded-lg text-base font-normal"
                              placeholder="Masukkan nama pasien"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label className="text-teal-700 font-medium text-base">
                              Email
                            </Label>
                            <Input
                              value={newPatientEmail}
                              onChange={(e) =>
                                setNewPatientEmail(e.target.value)
                              }
                              className="border-teal-300 focus:border-teal-500 focus:ring-teal-500 rounded-lg text-base font-normal"
                              placeholder="Masukkan email pasien"
                              type="email"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label className="text-teal-700 font-medium text-base">
                              Tanggal Respons Terakhir
                            </Label>
                            <Input
                              type="date"
                              value={newPatientDate}
                              onChange={(e) =>
                                setNewPatientDate(e.target.value)
                              }
                              className="border-teal-300 focus:border-teal-500 focus:ring-teal-500 rounded-lg text-base font-normal"
                              placeholder="Pilih tanggal"
                            />
                            <Label className="text-teal-700 font-medium text-base">
                              Nomor Telepon (tanpa "0" di awal)
                            </Label>
                            <Input
                              type="number"
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value)}
                              className="border-teal-300 focus:border-teal-500 focus:ring-teal-500 rounded-lg text-base font-normal"
                              placeholder="Masukkan nomor telepon"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            type="submit"
                            className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white rounded-full px-8 text-base font-medium cursor-pointer"
                          >
                            Simpan Pasien
                          </Button>
                        </DialogFooter>
                      </form>
                    </motion.div>
                  </DialogContent>
                )}
              </AnimatePresence>
            </Dialog>
          </div>
        </div>

        {/* Patient Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {patients.map((patient) => (
            <motion.div
              key={patient.id}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
            >
              <Card className="bg-gradient-to-br from-white to-[#E6FFFA] border-none shadow-xl rounded-2xl overflow-hidden">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-teal-800">
                    {patient.name}
                  </h3>
                  <p className="text-sm text-teal-600 font-normal leading-relaxed">
                    {patient.email}
                  </p>
                  {patient.well_being_score > 7 && (
                    <div className="bg-teal-100 w-fit rounded-full my-3 px-4 py-1">
                      <p className="text-xs text-teal-700 font-normal leading-relaxed">
                        Kesejahteraan: Sangat Baik
                      </p>
                    </div>
                  )}
                  {patient.well_being_score > 3 &&
                    patient.well_being_score < 8 && (
                      <div className="bg-yellow-100 w-fit rounded-full my-3 px-4 py-1">
                        <p className="text-xs text-yellow-700 font-normal leading-relaxed">
                          Kesejahteraan: Sedang
                        </p>
                      </div>
                    )}
                  {patient.well_being_score < 4 && (
                    <div className="bg-red-100 w-fit rounded-full my-3 px-4 py-1">
                      <p className="text-xs text-red-700 font-normal leading-relaxed">
                        Kesejahteraan: Perlu Perhatian
                      </p>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-teal-600 font-normal leading-relaxed">
                    <Clock size={14} />
                    <p>{getDaysSinceResponse(patient.last_response_date)}</p>
                  </div>
                  <p className="text-sm text-teal-600 font-normal leading-relaxed mt-2">
                    {patient.latest_note || 'Tidak ada catatan tersedia'}
                  </p>
                  <div className="flex flex-col gap-3 mt-4">
                    <a
                      href={`https://wa.me/62${patient.phone_number}?text=${encodeURIComponent(`Hai ${patient.name}, bagaimana kabar Anda?`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        variant="outline"
                        className="w-full border-teal-500 text-teal-500 hover:bg-teal-50 rounded-full text-base font-medium cursor-pointer"
                      >
                        Hubungi
                      </Button>
                    </a>
                    <Button
                      className="w-full bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white rounded-full text-base font-medium cursor-pointer"
                      onClick={() => router.push(`/patient/${patient.id}`)}
                      aria-label={`Lihat detail untuk ${patient.name}`}
                    >
                      Lihat Detail
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
