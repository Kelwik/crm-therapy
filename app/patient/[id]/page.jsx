'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LogOut, ArrowLeft, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';

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

export default function PatientDetails({ params }) {
  const [patient, setPatient] = useState(null);
  const [responses, setResponses] = useState([]);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const router = useRouter();
  const { id } = React.use(params);

  useEffect(() => {
    checkUser();
    if (id) {
      fetchPatient();
      fetchResponses();
    }
  }, [id]);

  async function checkUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) router.push('/login');
  }

  async function fetchPatient() {
    const response = await fetch(`/api/patients?id=${id}`);
    const data = await response.json();
    setPatient(data[0]);
  }

  async function fetchResponses() {
    const response = await fetch(`/api/responses?id=${id}`);
    const data = await response.json();
    setResponses(data);
  }

  async function logOut() {
    const { error } = await supabase.auth.signOut();
    router.push('/login');
  }

  // Function to calculate days since last response
  function getDaysSinceResponse(lastResponseDate) {
    if (!lastResponseDate) return 'No response';
    const today = new Date();
    const responseDate = new Date(lastResponseDate);
    const diffInMs = today - responseDate;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    if (diffInDays === 0) return 'Today';
    return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
  }

  if (!patient) {
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
        <div className="flex items-center gap-4">
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button
              variant="outline"
              className="border-blue-500 text-blue-500 hover:bg-blue-50 rounded-full flex items-center gap-2"
              onClick={() => router.push('/')}
              aria-label="Back to dashboard"
            >
              <ArrowLeft size={16} />
              Back
            </Button>
          </motion.div>
          <div className="text-center">
            <h1 className="font-semibold text-2xl text-gray-800">
              {patient.name}&apos;s Details
            </h1>
            <p className="text-sm text-gray-500">Patient Profile</p>
          </div>
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
                      className="border-gray-300 text-gray-700 hover:bg-gray-100 rounded-full px-6"
                      onClick={() => setIsLogoutDialogOpen(false)}
                      aria-label="Cancel logout"
                    >
                      Cancel
                    </Button>
                    <Button
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6"
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Patient Info Card */}
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover="hover"
        >
          <Card className="bg-white border-none shadow-lg rounded-xl overflow-hidden mb-8">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Patient Information
              </h2>
              <div className="grid gap-2">
                <p className="text-gray-600">
                  <span className="font-medium">Email:</span> {patient.email}
                </p>
                <p className="text-gray-600 flex items-center gap-2">
                  <span className="font-medium">Last Response:</span>
                  <Clock size={14} />
                  {getDaysSinceResponse(patient.last_response_date)}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Responses Section */}
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Responses</h2>
        <div className="grid gap-6">
          {responses.length === 0 ? (
            <p className="text-gray-500 text-center">No responses available.</p>
          ) : (
            responses.map((response) => (
              <motion.div
                key={response.id}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
              >
                <Card className="bg-white border-none shadow-lg rounded-xl overflow-hidden">
                  <CardContent className="p-6">
                    <div className="grid gap-4">
                      <p className="text-gray-600">
                        <span className="font-medium">Message:</span>{' '}
                        {response.message}
                      </p>
                      <div className="flex gap-4">
                        <p className="text-gray-600">
                          <span className="font-medium">Mood:</span>{' '}
                          {response.mood}/5
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">Stress:</span>{' '}
                          {response.stress}/5
                        </p>
                      </div>
                      <p className="text-gray-500 text-sm flex items-center gap-2">
                        <Clock size={14} />
                        Submitted:{' '}
                        {new Date(response.submitted_at).toLocaleDateString()}
                      </p>
                    </div>
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
