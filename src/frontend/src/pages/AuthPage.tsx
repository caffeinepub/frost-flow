import { Shield, Snowflake } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function AuthPage() {
  const { identity, login, isLoggingIn } = useInternetIdentity();
  const navigate = useNavigate();

  useEffect(() => {
    if (identity) navigate("/orders");
  }, [identity, navigate]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-[#E5EAF0] shadow-sm p-10 max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-[#0B5EA8] text-white rounded-full p-4">
            <Snowflake className="h-8 w-8" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-[#0F2A3A] mb-2">
          Welcome to Frost Flow
        </h1>
        <p className="text-[#6B7280] mb-8">
          Sign in with Internet Identity to access your account, track orders,
          and checkout.
        </p>

        <Button
          onClick={login}
          disabled={isLoggingIn}
          className="w-full bg-[#0B5EA8] hover:bg-[#0951a0] h-12 rounded-xl text-base"
        >
          <Shield className="mr-2 h-5 w-5" />
          {isLoggingIn ? "Connecting..." : "Login with Internet Identity"}
        </Button>

        <p className="text-xs text-[#6B7280] mt-6">
          Internet Identity provides secure, privacy-preserving authentication
          on the Internet Computer.
        </p>
      </div>
    </div>
  );
}
