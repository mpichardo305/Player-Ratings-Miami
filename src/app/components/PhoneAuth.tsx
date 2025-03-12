"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { supabase } from "@/app/utils/supabaseClient";

interface PhoneAuthProps {
  onVerificationSuccess?: () => void;
  refreshPhoneNumber?: () => void;
}

const PhoneAuth: React.FC<PhoneAuthProps> = ({ onVerificationSuccess, refreshPhoneNumber }) => {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [verification, setVerification] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!phone) return setError("Please enter a valid phone number.");

    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithOtp({ phone });

    if (error) {
      setError(error.message);
    } else {
      setVerification(true);
    }
    setLoading(false);
  };

  const verifyOTP = async () => {
    if (!code) return setError("Enter the OTP sent to your phone.");

    setLoading(true);
    setError("");

    try {
      const { error, data } = await supabase.auth.verifyOtp({ 
        phone, 
        token: code, 
        type: "sms" 
      });

      if (error) {
        setError(error.message);
      } else {
        // Update user metadata with phone number
        const { error: updateError } = await supabase.auth.updateUser({
          data: { phone_number: phone, phone_verified: true }
        });

        if (updateError) {
          console.error('Failed to update user metadata:', updateError);
        }

        // Explicitly refresh the phone number if the function is provided
        if (refreshPhoneNumber) {
          refreshPhoneNumber();
        }

        if (onVerificationSuccess) {
          onVerificationSuccess();
        } else {
          router.push("/");
        }
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError('Failed to verify OTP');
    }
    
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white px-6">
      <div className="w-full max-w-md bg-gray-800 p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-semibold text-center">Welcome to Player Ratings</h2>
        <p className="text-gray-400 text-center mt-2">Enter your phone number to get started</p>

        {error && <p className="text-red-500 text-center mt-3">{error}</p>}

        <div className="mt-5">
          {!verification ? (
            <>
              <PhoneInput
                defaultCountry="US"
                value={phone}
                onChange={(value) => setPhone(value || "")}
                className="w-full p-3 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition"
              >
                {loading ? "Sending..." : "Send OTP"}
              </button>
            </>
          ) : (
            <>
              <input
                type="number"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter OTP"
                className="w-full p-3 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={verifyOTP}
                disabled={loading}
                className="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition"
              >
                {loading ? "Verifying..." : "Verify"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PhoneAuth;
