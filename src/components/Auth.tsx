
import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AuthHeader } from "./auth/AuthHeader";
import { SignInForm } from "./auth/SignInForm";
import { SignUpForm } from "./auth/SignUpForm";
import { MagicLinkSection } from "./auth/MagicLinkSection";

export function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md mx-auto">
        <AuthHeader />

        <Card className="bg-white/5 border-white/10 backdrop-blur-sm shadow-2xl w-full">
          <CardContent className="p-6 w-full">
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-white/10 border-white/20 mb-6">
                <TabsTrigger 
                  value="signin" 
                  className="data-[state=active]:bg-white data-[state=active]:text-black text-white w-full"
                >
                  Sign In
                </TabsTrigger>
                <TabsTrigger 
                  value="signup"
                  className="data-[state=active]:bg-white data-[state=active]:text-black text-white w-full"
                >
                  Sign Up
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin" className="w-full mt-0 space-y-0">
                <div className="w-full">
                  <SignInForm 
                    loading={loading}
                    setLoading={setLoading}
                    email={email}
                    setEmail={setEmail}
                    password={password}
                    setPassword={setPassword}
                  />
                  
                  <MagicLinkSection 
                    loading={loading}
                    setLoading={setLoading}
                    email={email}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="signup" className="w-full mt-0">
                <SignUpForm 
                  loading={loading}
                  setLoading={setLoading}
                  email={email}
                  setEmail={setEmail}
                  password={password}
                  setPassword={setPassword}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
