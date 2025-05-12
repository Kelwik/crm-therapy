'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Send } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import * as React from 'react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Animation variants for cards
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  hover: { scale: 1.03, boxShadow: '0 8px 20px rgba(0,0,0,0.1)' },
};

export default function PatientForm({ params }) {
  const [patientName, setPatientName] = useState('');
  const [message, setMessage] = useState('');
  const [mood, setMood] = useState(3);
  const [stress, setStress] = useState(3);
  const [isValidToken, setIsValidToken] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { token } = React.use(params);

  useEffect(() => {
    if (token) {
      validateToken();
    } else {
      setIsLoading(false);
      setError('No token provided');
    }
  }, [token]);

  async function validateToken() {
    try {
      const { data, error } = await supabase
        .from('tokens')
        .select('patient_id, used')
        .eq('token', token)
        .single();

      if (error || !data || data.used) {
        setError('Invalid or used token');
        setIsLoading(false);
        return;
      }

      const { data: patient } = await supabase
        .from('patients')
        .select('name')
        .eq('id', data.patient_id)
        .single();

      if (patient) {
        setPatientName(patient.name);
        setIsValidToken(true);
      } else {
        setError('Patient not found');
      }
    } catch (err) {
      setError('An error occurred while validating the token');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setIsLoading(true);
      const response = await fetch('/api/submit-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, message, mood, stress }),
      });
      if (response.ok) {
        setSubmitted(true);
      } else {
        setError('Failed to submit form');
      }
    } catch (err) {
      setError('An error occurred while submitting the form');
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

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 font-sans">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="bg-white border-none shadow-lg rounded-xl">
            <CardContent className="p-6">
              <p className="text-red-600 text-center">{error}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 font-sans">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="bg-white border-none shadow-lg rounded-xl">
            <CardContent className="p-6">
              <p className="text-green-600 text-center text-lg">
                Thank you for your response!
              </p>
            </CardContent>
          </Card>
        </div>
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
              aria-label="Back to home"
            >
              <ArrowLeft size={16} />
              Back
            </Button>
          </motion.div>
          <div className="text-center">
            <h1 className="font-semibold text-2xl text-gray-800">
              Well-Being Form
            </h1>
            <p className="text-sm text-gray-500">For {patientName}</p>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              <form onSubmit={handleSubmit} className="grid gap-6">
                {/* Message */}
                <div className="grid gap-2">
                  <Label htmlFor="message" className="text-gray-700">
                    Message
                  </Label>
                  <textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg p-3 min-h-[150px] w-full resize-y"
                    placeholder="Share your thoughts or updates..."
                    required
                  />
                </div>

                {/* Mood Level */}
                <div className="grid gap-2">
                  <Label className="text-gray-700">
                    How is your mood? (1 = Low, 5 = High)
                  </Label>
                  <div className="flex gap-4 flex-wrap">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <label
                        key={`mood-${value}`}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="mood"
                          value={value}
                          checked={mood === value}
                          onChange={() => setMood(value)}
                          className="hidden"
                          required
                        />
                        <span
                          className={`w-8 h-8 flex items-center justify-center rounded-full border-2 ${
                            mood === value
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'border-gray-300 text-gray-600 hover:bg-blue-50'
                          }`}
                        >
                          {value}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Stress Level */}
                <div className="grid gap-2">
                  <Label className="text-gray-700">
                    How stressed are you? (1 = Low, 5 = High)
                  </Label>
                  <div className="flex gap-4 flex-wrap">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <label
                        key={`stress-${value}`}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="stress"
                          value={value}
                          checked={stress === value}
                          onChange={() => setStress(value)}
                          className="hidden"
                          required
                        />
                        <span
                          className={`w-8 h-8 flex items-center justify-center rounded-full border-2 ${
                            stress === value
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'border-gray-300 text-gray-600 hover:bg-blue-50'
                          }`}
                        >
                          {value}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 cursor-pointer flex items-center gap-2"
                  disabled={isLoading}
                >
                  <Send size={16} />
                  Submit Response
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
