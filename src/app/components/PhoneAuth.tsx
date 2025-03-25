"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import PhoneInput from "react-phone-number-input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
    <div className="relative min-h-screen flex flex-col items-center justify-center -mt-12">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/no-slogan.jpg"
          alt="Soccer field"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-background/90" /> {/* Dark overlay */}
      </div>

      {/* Content */}
      <div className="relative z-10 w-full px-4 space-y-4 max-w-lg text-center">
        {/* Marketing Section */}
        <div className="space-y-2 mb-4">
          <h1 className="text-4xl font-bold tracking-tight text-white">
            Rate Players in Miami's Soccer Games!
          </h1>
          <p className="text-xl text-muted-foreground">
            Join your group and rate your friends. Play hard. Rate harder!
          </p>
        </div>

        {/* Auth Card */}
        <Card className="bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/75">
        <CardHeader className="space-y-2"> {/* Added space-y-2 */}
          <CardTitle className="text-2xl"> {/* Changed from default to text-2xl */}
            Welcome to Player Ratings
          </CardTitle>
          <CardDescription className="text-lg"> {/* Changed from default to text-lg */}
            Enter your phone number to get started
          </CardDescription>
        </CardHeader>
          <CardContent>
            {error && (
              <p className="text-destructive text-sm mb-4">{error}</p>
            )}

            {!verification ? (
              <div className="space-y-4">
                <PhoneInput
                  defaultCountry="US"
                  value={phone}
                  onChange={(value) => setPhone(value || "")}
                  className="w-full"
                />
                <Button
                  onClick={handleLogin}
                  disabled={loading}
                  className="w-full bg-green-500"
                >
                  {loading ? "Sending..." : "Send OTP"}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <input
                  type="number"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter OTP"
                  className="w-full p-3 rounded-lg bg-secondary text-secondary-foreground"
                />
                <Button
                  onClick={verifyOTP}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? "Verifying..." : "Verify"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Additional Info */}
        {/* <p className="text-sm text-muted-foreground">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p> */}
      </div>
    </div>
  );
};

export default PhoneAuth;
