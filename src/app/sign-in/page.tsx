
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, TOKEN } from "@/lib/api";
import toast from "react-hot-toast";
import { parseUserData, storeUserData } from "@/utils/userUtils";

const SignInPage = () => {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const[persistToast, setPersistToast]= useState(false);

//   const showPersistentToast = (message: string) => {
//   // Store first, then show
//   localStorage.setItem('persistentToast', message);
//   toast.error(message, { duration: 8000 });
// };

const showPersistentToast = (message: string) => {
  localStorage.setItem("persistentToast", message);
  toast.error(message, { duration: 8000 });
};

useEffect(() => {
  const savedToast = localStorage.getItem("persistentToast");
  if (savedToast) {
    toast.error(savedToast, { duration: 8000 });
    localStorage.removeItem("persistentToast");
  }
}, []);


  // Auth check - runs once on mount
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      router.replace("/admin");
    } else {
      setCheckingAuth(false);
    }
  },
    [router]
  //[]
  );

  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous states
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");

    // Validation
    if (!username.trim() || !password.trim()) {
      toast.error("Please enter both username and password.", {
        duration: 5000,
      });
      return;
    }

    setLoading(true);

    try {
      const response = await api.post(`/Login/${TOKEN}`, { 
        username: username.trim(), 
        password: password.trim() 
      });

      // Check API response status
      if (response.data.message === "Success") {
        const { jwtToken, refreshToken, userId, userName } = response.data;

        // Store tokens
        localStorage.setItem("accessToken", jwtToken);
        localStorage.setItem("refreshToken", refreshToken);

      const userData = parseUserData(response.data);
      storeUserData(userData);
      
      // Also store the raw userId for compatibility
      localStorage.setItem("userId", response.data.userId);
      

        toast.success("Login successful! Redirecting...", {
          duration: 3000,
        });

        // Redirect after short delay
        setTimeout(() => {
          router.replace("/admin");
        }, 1500);

      } else {
        // API returned failure with custom message
        const apiErrorMessage = response.data.message || "Login failed. Please try again.";
        toast.error(apiErrorMessage, {
          duration: 8000,
        });
        setLoading(false); // Reset loading state
      }

    } catch (err: any) {
      // Extract specific error message from API response
      let errorMessage = "Invalid username or password. Please try again.";
      
      if (err.response?.data?.message) {
        // Use API-provided error message
        errorMessage = err.response.data.message;
      } else if (err.code === "NETWORK_ERROR") {
        errorMessage = "Network error. Please check your connection.";
      } else if (err.response?.status >= 500) {
        errorMessage = "Server error. Please try again later.";
      }

 showPersistentToast(errorMessage);
      
      setLoading(false); 
    }
  };

  // Loading state during auth check
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // if(persistToast)
  //     toast.error("Error Logging In", {
  //       duration: 8000, // Long enough to survive re-renders
  //     });

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-semibold mb-2">Sign in to your account</h1>
        <p className="text-sm text-slate-500 mb-6">
          Demo sign-in — use any credentials to continue.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium">Username</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="Enter your username"
              aria-label="username"
              disabled={loading}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="Enter your password"
              aria-label="password"
              disabled={loading}
            />
          </label>

          <div className="flex items-center justify-between">
            <label className="inline-flex items-center text-sm">
              <input type="checkbox" className="mr-2" disabled={loading} />
              Remember me
            </label>
            <Link 
              href="#" 
              className="text-sm text-indigo-600 hover:underline disabled:opacity-50"
              onClick={(e) => loading && e.preventDefault()}
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 rounded-md font-medium disabled:opacity-60 hover:bg-indigo-700 transition-colors"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Signing in...
              </span>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          <span>Don&apos;t have an account? </span>
          <Link 
            href="#" 
            className="text-indigo-600 hover:underline"
            onClick={(e) => loading && e.preventDefault()}
          >
            Sign up
          </Link>
        </div>

        <div className="mt-6 text-xs text-slate-400 text-center">
          <strong>Demo credentials:</strong> Use any username and password
        </div>
      </div>
    </div>
  );
};

export default SignInPage;





