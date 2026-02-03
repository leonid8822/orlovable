import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function Diagnostic() {
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    const tests: any = {};

    // Test 1: API URL
    tests.apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

    // Test 2: Settings endpoint
    try {
      const { data, error } = await api.getSettings();
      tests.settings = error ? `ERROR: ${error}` : "✓ OK";
      tests.settingsData = data;
    } catch (e: any) {
      tests.settings = `ERROR: ${e.message}`;
    }

    // Test 3: Examples endpoint
    try {
      const { data, error } = await api.getExamples();
      tests.examples = error ? `ERROR: ${error}` : `✓ OK (${data?.length || 0} items)`;
    } catch (e: any) {
      tests.examples = `ERROR: ${e.message}`;
    }

    // Test 4: Gems endpoint
    try {
      const response = await fetch(`${tests.apiUrl.replace('/api', '')}/api/gems`);
      const data = await response.json();
      tests.gems = `✓ OK (${data.gems?.length || 0} gems)`;
    } catch (e: any) {
      tests.gems = `ERROR: ${e.message}`;
    }

    // Test 5: Supabase client
    tests.supabaseConfigured = "Check imports";

    setResults(tests);
    setLoading(false);
  };

  if (loading) {
    return <div className="p-8">Loading diagnostics...</div>;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">System Diagnostics</h1>

        <div className="space-y-4">
          {Object.entries(results).map(([key, value]) => (
            <div key={key} className="p-4 border rounded-lg bg-card">
              <div className="font-mono text-sm">
                <div className="font-bold text-lg mb-2">{key}</div>
                <pre className="text-xs overflow-auto">
                  {typeof value === 'object'
                    ? JSON.stringify(value, null, 2)
                    : String(value)
                  }
                </pre>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 border rounded-lg bg-yellow-500/10 border-yellow-500">
          <h2 className="font-bold mb-2">Quick Actions</h2>
          <button
            onClick={runDiagnostics}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Re-run Tests
          </button>
        </div>
      </div>
    </div>
  );
}
