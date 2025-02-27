'use client';

import { useState } from 'react';
import { usePhoneNumber } from '../hooks/usePhoneNumber';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import PageBackground from './PageBackground';

const WaitingListPage = () => {
  const [isFirstPage, setIsFirstPage] = useState(true);
  const [isSecondPage, setIsSecondPage] = useState(false);
  const [isThirdPage, setIsThirdPage] = useState(false);
  const [isSubmitPage, setIsSubmitPage] = useState(false);
  const { phoneNumber } = usePhoneNumber();
  const supabase = createClientComponentClient();

  const [answers, setAnswers] = useState({
    isAdmin: false,
    frequency: '',
    groupSize: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleFirstQuestion = (isAdmin: boolean) => {
    setAnswers(prev => ({ ...prev, isAdmin }));
    setIsFirstPage(false);
    setIsSecondPage(true);
  };

  const handleSecondQuestion = (frequency: string) => {
    setAnswers(prev => ({ ...prev, frequency }));
    setIsSecondPage(false);
    setIsThirdPage(true);
  };

  const submitToWaitingList = async (finalAnswers: typeof answers) => {
    setIsSubmitting(true);
    try {
      const waitingListData = {
        phone_number: phoneNumber,
        is_admin: finalAnswers.isAdmin,
        play_frequency: finalAnswers.frequency,
        group_size: finalAnswers.groupSize,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('waiting_list')
        .insert([waitingListData])
        .select();

      if (error) {
        console.error('Error submitting to waiting list:', error);
        // Handle error appropriately
        return;
      }

      console.log('Successfully added to waiting list:', data);
      setSubmitSuccess(true);
      // Handle success (e.g., show success message, redirect, etc.)
    } catch (error) {
      console.error('Error:', error);
      // Handle error appropriately
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleThirdQuestion = async (groupSize: string) => {
    const updatedAnswers = { ...answers, groupSize };
    setAnswers(updatedAnswers);
    setIsThirdPage(false);
    setIsSubmitPage(true);
    await submitToWaitingList(updatedAnswers);
  };

  return (
    <PageBackground>
      {isFirstPage && (
        <div className="flex flex-col items-center justify-center h-full px-4">
          <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6 space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900 text-center">
              Are you an admin of a soccer group?
            </h2>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => handleFirstQuestion(true)}
                className="w-24 py-2 text-sm font-semibold rounded-md bg-blue-600 text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Yes
              </button>
              <button
                onClick={() => handleFirstQuestion(false)}
                className="w-24 py-2 text-sm font-semibold rounded-md bg-blue-600 text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {isSecondPage && (
        <div className="flex flex-col items-center justify-center h-full px-4">
          <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6 space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900 text-center">
              How often do you play?
            </h2>
            <div className="flex flex-col gap-4 w-full">
              <button
                onClick={() => handleSecondQuestion('weekly')}
                className="w-full py-2 text-sm font-semibold rounded-md bg-blue-600 text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Weekly
              </button>
              <button
                onClick={() => handleSecondQuestion('monthly')}
                className="w-full py-2 text-sm font-semibold rounded-md bg-blue-600 text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Monthly
              </button>
              <button
                onClick={() => handleSecondQuestion('occasionally')}
                className="w-full py-2 text-sm font-semibold rounded-md bg-blue-600 text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Once in a while
              </button>
            </div>
          </div>
        </div>
      )}

      {isThirdPage && (
        <div className="flex flex-col items-center justify-center h-full px-4">
          <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6 space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900 text-center">
              What is the size of your group?
            </h2>
            <div className="flex flex-col gap-4 w-full">
              <button
                onClick={() => handleThirdQuestion('more than 12')}
                className="w-full py-2 text-sm font-semibold rounded-md bg-blue-600 text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                More than 12
              </button>
              <button
                onClick={() => handleThirdQuestion('less than 12')}
                className="w-full py-2 text-sm font-semibold rounded-md bg-blue-600 text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Less than 12
              </button>
            </div>
          </div>
        </div>
      )}

      {isSubmitPage && (
        <div className="flex flex-col items-center justify-center h-full px-4">
          <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6 space-y-6">
            {isSubmitting && (
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  Submitting your information...
                </h2>
                <div className="text-blue-600">Please wait...</div>
              </div>
            )}
            {submitSuccess && (
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  Thank you for joining!
                </h2>
                <div className="text-green-600 text-lg">
                  We will text you with next steps
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </PageBackground>
  );
};

export default WaitingListPage;
