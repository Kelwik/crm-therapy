'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import * as React from 'react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
function PatientPage({ params }) {
  const [patient, setPatient] = useState([]);
  const [responses, setResponses] = useState([]);
  const { id } = React.use(params);

  useEffect(() => {
    checkUser();
    fetchPatient();
    fetchResponse();
  }, []);

  async function fetchPatient() {
    const res = await fetch(`/api/patients?id=${id}`);
    const data = await res.json();
    console.log(data);
    setPatient(data[0]);
  }

  async function fetchResponse() {
    const res = await fetch(`/api/responses?id=${id}`);
    const data = await res.json();
    console.log(data);
    setResponses(data);
  }

  async function checkUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect('/login');
  }

  return (
    <div>
      <p>{patient.id}</p>
      <p>{patient.name}</p>
      <p>{patient.email}</p>
      {responses.map((response) => {
        return (
          <div key={response.id}>
            <p>{response.message}</p>
            <p>{response.mood}</p>
            <p>{response.stress}</p>
          </div>
        );
      })}
    </div>
  );
}

export default PatientPage;
