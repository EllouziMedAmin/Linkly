"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface VerificationResult {
  friction_score: number;
  industry: string;
  core_needs: string[];
  analysis_summary: string;
}

export default function OnboardPage() {
  const [companyName, setCompanyName] = useState("");
  const [pitchText, setPitchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !pitchText.trim()) return;

    setLoading(true);
    setResult(null);
    setSuccess(false);
    setError(null);

    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: companyName.trim(),
          pitchDeckText: pitchText.trim(),
        }),
      });

      const data = await res.json();

      if (data.success) {
        setResult(data.ai_verification);
        setSuccess(true);
      } else {
        setResult(data.ai_verification || null);
        setError(data.error || "Verification failed.");
      }
    } catch {
      setError("Network error. Please try again.");
    }

    setLoading(false);
  };

  const resetForm = () => {
    setCompanyName("");
    setPitchText("");
    setResult(null);
    setSuccess(false);
    setError(null);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground mb-1">
          AI-Powered Company Onboarding
        </h1>
        <p className="text-neutral-400 text-sm">
          Gemini 3.1 Flash-Lite will autonomously verify the pitch deck and
          assign a Friction Score.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <Card className="glass border-neutral-800 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg text-foreground flex items-center gap-2">
              <Brain className="w-5 h-5 text-violet-400" />
              Submit Application
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-neutral-800/50 border border-neutral-700 rounded-xl px-4 py-3 text-foreground placeholder:text-neutral-500 focus:outline-none focus:border-sky-600/50 focus:ring-1 focus:ring-sky-600/20 transition-all"
                  placeholder="e.g., TechWave Solutions"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Pitch Deck Text
                </label>
                <textarea
                  value={pitchText}
                  onChange={(e) => setPitchText(e.target.value)}
                  rows={8}
                  className="w-full bg-neutral-800/50 border border-neutral-700 rounded-xl px-4 py-3 text-foreground placeholder:text-neutral-500 focus:outline-none focus:border-sky-600/50 focus:ring-1 focus:ring-sky-600/20 transition-all resize-none"
                  placeholder="Paste the pitch deck text or a summary of the business model, milestones, and goals..."
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={loading || !companyName.trim() || !pitchText.trim()}
                className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 text-foreground font-bold py-6 rounded-xl shadow-lg shadow-violet-500/20 transition-all gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Gemini is analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4" />
                    Verify with AI
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Result */}
        <Card className="glass border-neutral-800 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">
              AI Verification Result
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!result && !loading && !error && (
              <div className="py-16 text-center">
                <Brain className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                <p className="text-neutral-500">
                  Submit a company application to see the AI analysis.
                </p>
              </div>
            )}

            {loading && (
              <div className="py-16 text-center">
                <Loader2 className="w-12 h-12 text-violet-400 animate-spin mx-auto mb-4" />
                <p className="text-neutral-400">
                  Gemini is parsing the pitch deck...
                </p>
                <p className="text-sm text-neutral-500 mt-1">
                  Extracting skills, assessing clarity, computing Friction
                  Score...
                </p>
              </div>
            )}

            {error && (
              <div className="py-8">
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-2 text-rose-400 font-medium mb-1">
                    <AlertCircle className="w-4 h-4" />
                    Error
                  </div>
                  <p className="text-sm text-rose-300">{error}</p>
                </div>
                {result && <ResultDisplay result={result} />}
              </div>
            )}

            {success && result && (
              <div className="space-y-6">
                <div className="bg-sky-600/10 border border-sky-600/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-sky-500 font-medium">
                    <CheckCircle className="w-4 h-4" />
                    Company onboarded successfully!
                  </div>
                </div>
                <ResultDisplay result={result} />
                <Button
                  onClick={resetForm}
                  variant="outline"
                  className="w-full border-neutral-700 text-neutral-400 hover:text-foreground"
                >
                  Onboard Another Company
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ResultDisplay({ result }: { result: VerificationResult }) {
  const frictionColor =
    result.friction_score <= 3
      ? "text-sky-500 border-sky-600/20 bg-sky-600/10"
      : result.friction_score <= 6
      ? "text-amber-400 border-amber-500/20 bg-amber-500/10"
      : "text-rose-400 border-rose-500/20 bg-rose-500/10";

  return (
    <div className="space-y-4">
      {/* Friction Score */}
      <div className="text-center p-6 glass rounded-xl">
        <p className="text-xs uppercase tracking-wider text-neutral-500 mb-2">
          Friction Score
        </p>
        <div className={`text-5xl font-bold ${frictionColor.split(" ")[0]}`}>
          {result.friction_score}
          <span className="text-lg text-neutral-500">/10</span>
        </div>
      </div>

      {/* Industry */}
      {result.industry && (
        <div>
          <p className="text-xs uppercase tracking-wider text-neutral-500 mb-2">
            Industry
          </p>
          <Badge
            variant="outline"
            className="text-cyan-400 border-cyan-500/20 bg-cyan-500/10"
          >
            {result.industry}
          </Badge>
        </div>
      )}

      {/* Core Needs */}
      {result.core_needs && result.core_needs.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-wider text-neutral-500 mb-2">
            Core Needs
          </p>
          <div className="flex flex-wrap gap-1.5">
            {result.core_needs.map((need, i) => (
              <Badge
                key={i}
                variant="outline"
                className="text-neutral-300 border-neutral-600"
              >
                {need}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Analysis */}
      <div>
        <p className="text-xs uppercase tracking-wider text-neutral-500 mb-2">
          AI Analysis
        </p>
        <p className="text-sm text-neutral-300 leading-relaxed">
          {result.analysis_summary}
        </p>
      </div>
    </div>
  );
}
