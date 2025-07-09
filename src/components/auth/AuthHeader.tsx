
import { Sparkles } from "lucide-react";

export function AuthHeader() {
  return (
    <div className="text-center space-y-6 mb-8">
      <div className="flex justify-center">
        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-black" />
        </div>
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Welcome to TrackCareer
        </h1>
        <p className="text-gray-400 text-sm">
          Sign in to access your professional dashboard
        </p>
      </div>
    </div>
  );
}
