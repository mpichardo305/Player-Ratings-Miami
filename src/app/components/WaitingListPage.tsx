'use client';

import { useState } from 'react';
import { usePhoneNumber } from '../hooks/usePhoneNumber';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import PageBackground from './PageBackground';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

  const QuestionCard = ({ title, children }: { title: string | React.ReactNode, children: React.ReactNode }) => (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <Card className="w-full max-w-md bg-card">
        <CardHeader>
          <CardTitle className="text-2xl text-center text-card-foreground">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {children}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-4">
      {isFirstPage && (
        <QuestionCard title="Are you an admin of a soccer group?">
          <p className="text-card-foreground text-center mb-6">
            Please answer these questions to join the community
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => handleFirstQuestion(true)}
              variant="default"
              className="w-24"
            >
              Yes
            </Button>
            <Button
              onClick={() => handleFirstQuestion(false)}
              variant="default"
              className="w-24"
            >
              No
            </Button>
          </div>
        </QuestionCard>
      )}

      {isSecondPage && (
        <QuestionCard title="How often do you play?">
          <div className="flex flex-col gap-4 w-full">
            <Button
              onClick={() => handleSecondQuestion('weekly')}
              variant="default"
              className="w-full"
            >
              Weekly
            </Button>
            <Button
              onClick={() => handleSecondQuestion('monthly')}
              variant="default"
              className="w-full"
            >
              Monthly
            </Button>
            <Button
              onClick={() => handleSecondQuestion('occasionally')}
              variant="default"
              className="w-full"
            >
              Once in a while
            </Button>
          </div>
        </QuestionCard>
      )}

      {isThirdPage && (
        <QuestionCard title="What is the size of your group?">
          <div className="flex flex-col gap-4 w-full">
            <Button
              onClick={() => handleThirdQuestion('more than 12')}
              variant="default"
              className="w-full"
            >
              12 or More
            </Button>
            <Button
              onClick={() => handleThirdQuestion('less than 12')}
              variant="default"
              className="w-full"
            >
              Less than 12
            </Button>
          </div>
        </QuestionCard>
      )}

      {isSubmitPage && (
        <QuestionCard title={isSubmitting ? "Submitting your information..." : (
          <div>
            <p>Thank you!</p>
            <p>You are now part of the wait list.</p>
          </div>
        )}>
          {isSubmitting && (
            <p className="text-card-foreground text-center">
              Please wait...
            </p>
          )}
          {submitSuccess && (
            <div className="space-y-2 text-center">
              
              <p className="text-primary">
                If you are a fit, we will text you with next steps
              </p>
              <p className="text-card-foreground">
              You can close this page
              </p>
            </div>
          )}
        </QuestionCard>
      )}
    </div>
  );
};

export default WaitingListPage;
