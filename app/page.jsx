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
  hover: { scale: 1.03, boxShadow: '0 8px 20px rgba(0,0,0,0.1)' },
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
  const router = useRouter();

  useEffect(() => {
    checkUser();
    getPatients();
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
    if (!lastResponseDate) return 'No response';
    const today = new Date();
    const responseDate = new Date(lastResponseDate);
    const diffInMs = today - responseDate;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    if (diffInDays === 0) return 'Today';
    return `${diffInDays} days ago`;
  }

  async function getPatients() {
    const res = await fetch('/api/patients');
    const data = await res.json();
    setPatients(data);
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
        }),
      });

      if (response.ok) {
        setNewPatientName('');
        setNewPatientEmail('');
        setNewPatientDate('');
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
      <div className="flex justify-center items-center h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-gray-50 to-gray-100 font-sans">
      {/* Navbar */}
      <nav className="bg-white p-6 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <div className="absolute left-1/2 transform -translate-x-1/2 text-center">
          <h1 className="font-semibold text-2xl text-gray-800">Therapy CRM</h1>
          <p className="text-sm text-gray-500">Patient Dashboard</p>
        </div>
        <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
          <DialogTrigger asChild>
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <LogOut
                className="cursor-pointer text-gray-600 hover:text-blue-600"
                aria-label="Open logout confirmation"
                onClick={() => setIsLogoutDialogOpen(true)}
              />
            </motion.div>
          </DialogTrigger>
          <AnimatePresence>
            {isLogoutDialogOpen && (
              <DialogContent className="sm:max-w-md bg-white rounded-2xl shadow-xl">
                <motion.div
                  variants={dialogVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                >
                  <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-gray-800">
                      Confirm Logout
                    </DialogTitle>
                    <DialogDescription className="text-gray-500">
                      Are you sure you want to log out? You will need to log in
                      again to access the dashboard.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="mt-4">
                    <Button
                      variant="outline"
                      className="border-gray-300 text-gray-700 hover:bg-gray-100 rounded-full px-6 cursor-pointer"
                      onClick={() => setIsLogoutDialogOpen(false)}
                      aria-label="Cancel logout"
                    >
                      Cancel
                    </Button>
                    <Button
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 cursor-pointer"
                      onClick={() => {
                        setIsLogoutDialogOpen(false);
                        logOut();
                      }}
                      aria-label="Confirm logout"
                    >
                      Confirm
                    </Button>
                  </DialogFooter>
                </motion.div>
              </DialogContent>
            )}
          </AnimatePresence>
        </Dialog>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {[
            { icon: Users, title: 'Total Patients', value: patients.length },
            { icon: Mail, title: 'Unread Emails', value: 42 },
            {
              icon: TriangleAlert,
              title: 'Patients Needing Follow-Up',
              value: 42,
            },
          ].map((stat, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
            >
              <Card className="bg-white border-none shadow-lg rounded-xl overflow-hidden">
                <CardContent className="flex items-center gap-4 p-6">
                  <stat.icon className="text-blue-500" size={40} />
                  <div>
                    <p className="text-lg text-gray-600">{stat.title}</p>
                    <p className="text-3xl font-semibold text-gray-800">
                      {stat.value}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Patient List Header */}
        <div className="flex flex-row justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Patient List</h2>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 cursor-pointer"
            onClick={triggerNodemailerEmails}
          >
            Check Email
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 cursor-pointer">
                Add Patient
              </Button>
            </DialogTrigger>
            <AnimatePresence>
              {isDialogOpen && (
                <DialogContent className="sm:max-w-md bg-white rounded-2xl shadow-xl">
                  <motion.div
                    variants={dialogVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                  >
                    <DialogHeader>
                      <DialogTitle className="text-xl font-semibold text-gray-800">
                        Add New Patient
                      </DialogTitle>
                      <DialogDescription className="text-gray-500">
                        Enter patient details below. Click save to add.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={addPatient}>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label className="text-gray-700">Name</Label>
                          <Input
                            value={newPatientName}
                            onChange={(e) => setNewPatientName(e.target.value)}
                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                            placeholder="Enter patient name"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label className="text-gray-700">Email</Label>
                          <Input
                            value={newPatientEmail}
                            onChange={(e) => setNewPatientEmail(e.target.value)}
                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                            placeholder="Enter patient email"
                            type="email"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label className="text-gray-700">Last Response</Label>
                          <Input
                            type="date"
                            value={newPatientDate}
                            onChange={(e) => setNewPatientDate(e.target.value)}
                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                            placeholder="Select date"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          type="submit"
                          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 cursor-pointer"
                        >
                          Save Patient
                        </Button>
                      </DialogFooter>
                    </form>
                  </motion.div>
                </DialogContent>
              )}
            </AnimatePresence>
          </Dialog>
        </div>

        {/* Patient Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {patients.map((patient) => (
            <motion.div
              key={patient.id}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
            >
              <Card className="bg-white border-none shadow-lg rounded-xl overflow-hidden">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-gray-800">
                    {patient.name}
                  </h3>
                  <p className="text-sm text-gray-500">{patient.email}</p>
                  <div className="bg-green-100 w-fit rounded-full my-3 px-3 py-1">
                    <p className="text-sm text-green-700">
                      Well-being: Excellent
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock size={14} />
                    <p>{getDaysSinceResponse(patient.last_response_date)}</p>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Making excellent progress with anxiety management.
                  </p>
                  <div className="flex flex-col gap-2 mt-4">
                    <Button
                      variant="outline"
                      className="w-full border-blue-500 text-blue-500 hover:bg-blue-50 rounded-full cursor-pointer"
                    >
                      Contact
                    </Button>
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-full cursor-pointer"
                      onClick={() => router.push(`/patient/${patient.id}`)}
                      aria-label={`View details for ${patient.name}`}
                    >
                      View Details
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
