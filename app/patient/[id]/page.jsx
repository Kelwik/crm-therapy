'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LogOut, ArrowLeft, Clock, Trash2 } from 'lucide-react';
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
  hover: { scale: 1.03, boxShadow: '0 8px 20px rgba(0,0,0,0.1)' },
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
  const [message, setMessage] = useState('');
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
      setMessage(error.message);
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
      setMessage(error.message);
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
      setMessage('Error fetching notes');
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
      setMessage('Error fetching sessions');
      console.error('Fetch sessions error:', error);
    }
  }

  async function logOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push('/login');
    } catch (error) {
      setMessage('Error logging out');
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
      setMessage(error.message);
      console.error('Delete patient error:', error);
    }
  }

  async function handleAddNote() {
    if (!newNote) {
      setMessage('Note cannot be empty');
      return;
    }
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
      setMessage('Note added');
    } catch (error) {
      setMessage('Error adding note');
      console.error('Add note error:', error);
    }
  }

  async function handleUpdateScore() {
    const scoreNum = parseInt(score);
    if (isNaN(scoreNum) || scoreNum < 1 || scoreNum > 10) {
      setMessage('Score must be 1–10');
      return;
    }
    try {
      const { error } = await supabase
        .from('patients')
        .update({ well_being_score: scoreNum })
        .eq('id', id);
      if (error) throw error;
      setPatient({ ...patient, well_being_score: scoreNum });
      setScore('');
      setMessage('Score updated');
    } catch (error) {
      setMessage('Error updating score');
      console.error('Update score error:', error);
    }
  }

  async function handleAssignSession() {
    if (!sessionDate) {
      setMessage('Please select a session date');
      return;
    }
    const sessionDateTime = new Date(sessionDate);
    if (isNaN(sessionDateTime)) {
      setMessage('Invalid date');
      return;
    }

    try {
      const { error: sessionError } = await supabase
        .from('sessions')
        .insert({
          patient_id: id,
          session_date: sessionDateTime.toISOString(),
        });
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

      if (!response.ok) {
        setMessage('Session assigned but email notification failed');
        return;
      }

      setSessions([
        {
          id: crypto.randomUUID(),
          session_date: sessionDateTime,
          created_at: new Date(),
        },
        ...sessions,
      ]);
      setSessionDate('');
      setMessage('Session assigned and patient notified');
    } catch (error) {
      setMessage('Error assigning session');
      console.error('Assign session error:', error);
    }
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
              className="border-blue-500 text-blue-500 hover:bg-blue-50 rounded-full flex items-center gap-2 cursor-pointer"
              onClick={() => router.push('/')}
              aria-label="Back to dashboard"
            >
              <ArrowLeft size={16} />
              Back
            </Button>
          </motion.div>
          <div className="text-center">
            <h1 className="font-semibold text-2xl text-gray-800">
              {patient.name}'s Details
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Patient Info Card */}
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover="hover"
        >
          <Card className="bg-white border-none shadow-lg rounded-xl overflow-hidden mb-8">
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
                        className="cursor-pointer text-gray-600 hover:text-red-600"
                        size={20}
                        aria-label="Open delete patient confirmation"
                        onClick={() => setIsDeleteDialogOpen(true)}
                      />
                    </motion.div>
                  </DialogTrigger>
                  <AnimatePresence>
                    {isDeleteDialogOpen && (
                      <DialogContent className="sm:max-w-md bg-white rounded-2xl shadow-xl">
                        <motion.div
                          variants={dialogVariants}
                          initial="hidden"
                          animate="visible"
                          exit="hidden"
                        >
                          <DialogHeader>
                            <DialogTitle className="text-xl font-semibold text-gray-800">
                              Confirm Delete
                            </DialogTitle>
                            <DialogDescription className="text-gray-500">
                              Are you sure you want to delete {patient.name}?
                              This action cannot be undone.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter className="mt-4">
                            <Button
                              variant="outline"
                              className="border-gray-300 text-gray-700 hover:bg-gray-100 rounded-full px-6 cursor-pointer"
                              onClick={() => setIsDeleteDialogOpen(false)}
                              aria-label="Cancel delete"
                            >
                              Cancel
                            </Button>
                            <Button
                              className="bg-red-600 hover:bg-red-700 text-white rounded-full px-6 cursor-pointer"
                              onClick={(e) => deleteUser(e)}
                              aria-label="Confirm delete"
                            >
                              Confirm
                            </Button>
                          </DialogFooter>
                        </motion.div>
                      </DialogContent>
                    )}
                  </AnimatePresence>
                </Dialog>
              </div>
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
                <p className="text-gray-600">
                  <span className="font-medium">Well-Being Score:</span>{' '}
                  {patient.well_being_score ?? 'Not set'}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Actions Section */}
        <div className="grid gap-6 mb-8">
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
          >
            <Card className="bg-white border-none shadow-lg rounded-xl overflow-hidden">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Add Note
                </h2>
                <Textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Enter note..."
                  className="mb-4"
                />
                <Button
                  onClick={handleAddNote}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6"
                >
                  Add Note
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
            <Card className="bg-white border-none shadow-lg rounded-xl overflow-hidden">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Update Well-Being Score (1–10)
                </h2>
                <Input
                  type="number"
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  min="1"
                  max="10"
                  placeholder="Enter score"
                  className="mb-4"
                />
                <Button
                  onClick={handleUpdateScore}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6"
                >
                  Update Score
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
            <Card className="bg-white border-none shadow-lg rounded-xl overflow-hidden">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Assign Offline Session
                </h2>
                <Input
                  type="datetime-local"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className="mb-4"
                />
                <Button
                  onClick={handleAssignSession}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6"
                >
                  Assign Session
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Form Submissions Section */}
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">
          Form Submissions
        </h2>
        <div className="grid gap-6 mb-8">
          {responses.length === 0 ? (
            <p className="text-gray-500 text-center">
              No submissions available.
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
                <Card className="bg-white border-none shadow-lg rounded-xl overflow-hidden">
                  <CardContent className="p-6">
                    <div className="grid gap-4">
                      <p className="text-gray-600">
                        <span className="font-medium">Message:</span>{' '}
                        {response.response_data.message || 'None'}
                      </p>
                      <div className="flex gap-4">
                        <p className="text-gray-600">
                          <span className="font-medium">Mood:</span>{' '}
                          {response.response_data.mood || 'Not provided'}
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">Stress:</span>{' '}
                          {response.response_data.stress || 'Not provided'}
                        </p>
                      </div>
                      <p className="text-gray-600">
                        <span className="font-medium">
                          Offline Session Requested:
                        </span>{' '}
                        {response.offline_session_requested ? 'Yes' : 'No'}
                      </p>
                      <p className="text-gray-500 text-sm flex items-center gap-2">
                        <Clock size={14} />
                        Submitted:{' '}
                        {new Date(response.submitted_at).toLocaleString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        {/* Sessions Section */}
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Sessions</h2>
        <div className="grid gap-6 mb-8">
          {sessions.length === 0 ? (
            <p className="text-gray-500 text-center">No sessions scheduled.</p>
          ) : (
            sessions.map((session) => (
              <motion.div
                key={session.id}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
              >
                <Card className="bg-white border-none shadow-lg rounded-xl overflow-hidden">
                  <CardContent className="p-6">
                    <p className="text-gray-600 flex items-center gap-2">
                      <Clock size={14} />
                      Session Date:{' '}
                      {new Date(session.session_date).toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        {/* Notes Section */}
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Notes</h2>
        <div className="grid gap-6">
          {notes.length === 0 ? (
            <p className="text-gray-500 text-center">No notes available.</p>
          ) : (
            notes.map((note) => (
              <motion.div
                key={note.id}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
              >
                <Card className="bg-white border-none shadow-lg rounded-xl overflow-hidden">
                  <CardContent className="p-6">
                    <p className="text-gray-600">{note.note}</p>
                    <p className="text-gray-500 text-sm flex items-center gap-2">
                      <Clock size={14} />
                      {new Date(note.created_at).toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        {/* Message Display */}
        {message && (
          <motion.div
            className="mt-4 p-4 bg-blue-50 text-blue-600 rounded-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {message}
          </motion.div>
        )}
      </div>
    </div>
  );
}
