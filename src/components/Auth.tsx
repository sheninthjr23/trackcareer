
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
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <AuthHeader />

        <Card className="bg-white/5 border-white/10 backdrop-blur-sm shadow-2xl">
          <CardContent className="p-8">
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-white/10 border-white/20 mb-8">
                <TabsTrigger 
                  value="signin" 
                  className="data-[state=active]:bg-white data-[state=active]:text-black text-white"
                >
                  Sign In
                </TabsTrigger>
                <TabsTrigger 
                  value="signup"
                  className="data-[state=active]:bg-white data-[state=active]:text-black text-white"
                >
                  Sign Up
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin" className="w-full mt-0">
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
