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
  hover: { scale: 1.03, boxShadow: '0 8px 20px rgba(0,0,0,0.1)' },
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
      setError('No token provided');
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
      setError(err.message);
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
      // Validate mood and stress if provided
      if (mood && (isNaN(mood) || mood < 1 || mood > 5)) {
        throw new Error('Mood must be between 1 and 5');
      }
      if (stress && (isNaN(stress) || stress < 1 || stress > 5)) {
        throw new Error('Stress must be between 1 and 5');
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
        throw new Error(data.error || 'Failed to submit form');
      }

      if (data.warning) {
        setWarning(data.warning);
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
      <div className="flex justify-center items-center h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600"></div>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="max-w-md w-full"
        >
          <Card className="bg-white border-none shadow-lg rounded-xl">
            <CardContent className="p-6 text-center">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Error
              </h2>
              <p className="text-red-600 mb-4">{error}</p>
              <Button
                onClick={() => router.push('/')}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6"
              >
                Return to Home
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="max-w-md w-full"
        >
          <Card className="bg-white border-none shadow-lg rounded-xl">
            <CardContent className="p-6 text-center">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Thank You, {patientName}!
              </h2>
              <p className="text-green-600 mb-4">
                Your response has been submitted successfully.
              </p>
              {warning && <p className="text-yellow-600 mb-4">{warning}</p>}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-gray-50 to-gray-100 font-sans">
      {/* Navbar */}
      <nav className="bg-white p-6 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <h1 className="font-semibold text-2xl text-gray-800">
              Well-Being Form
            </h1>
            <p className="text-sm text-gray-500">For {patientName}</p>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover="hover"
        >
          <Card className="bg-white border-none shadow-lg rounded-xl overflow-hidden">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">
                Well-Being Form for {patientName}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Message */}
                <div className="space-y-2">
                  <Label htmlFor="message" className="text-gray-700">
                    How are you feeling? (Optional)
                  </Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Share your thoughts or updates..."
                    className="w-full min-h-[100px]"
                  />
                </div>

                {/* Mood Level */}
                <div className="space-y-2">
                  <Label className="text-gray-700">
                    Mood (1 = Low, 5 = High, Optional)
                  </Label>
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
                          className={`w-8 h-8 flex items-center justify-center rounded-full border-2 cursor-pointer ${
                            mood === value
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'border-gray-300 text-gray-600 hover:bg-blue-50'
                          }`}
                        >
                          {value}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/* Stress Level */}
                <div className="space-y-2">
                  <Label className="text-gray-700">
                    Stress (1 = Low, 5 = High, Optional)
                  </Label>
                  <RadioGroup
                    name="stress"
                    value={stress}
                    onValueChange={(value) => setStress(parseInt(value))}
                    className="flex gap-4 flex-wrap"
                  >
                    {[1, 2, 3, 4, 5].map((value) => (
                      <div
                        key={`stress-${value}`}
                        className="flex items-center"
                      >
                        <RadioGroupItem
                          value={value.toString()}
                          id={`stress-${value}`}
                          className="sr-only"
                        />
                        <Label
                          htmlFor={`stress-${value}`}
                          className={`w-8 h-8 flex items-center justify-center rounded-full border-2 cursor-pointer ${
                            stress === value
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'border-gray-300 text-gray-600 hover:bg-blue-50'
                          }`}
                        >
                          {value}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/* Offline Session */}
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="offlineSession"
                    checked={offlineSession}
                    onCheckedChange={setOfflineSession}
                  />
                  <Label
                    htmlFor="offlineSession"
                    className="text-gray-700 font-medium"
                  >
                    Request an offline session
                  </Label>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-full py-2 flex items-center justify-center gap-2"
                >
                  {isLoading ? 'Submitting...' : 'Submit Response'}
                  <Send size={16} />
                </Button>
              </form>
              <AnimatePresence>
                {error && (
                  <motion.p
                    className="mt-4 text-red-600 text-center"
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
        </motion.div>
      </div>
    </div>
  );
}
