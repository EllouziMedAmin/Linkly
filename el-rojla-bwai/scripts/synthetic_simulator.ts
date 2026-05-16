import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
import WebSocket from 'ws';

// Polyfill WebSocket for Node 20
(global as any).WebSocket = WebSocket;

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function runSimulator() {
  console.log("🚀 Starting El-Rojla-Bwai Synthetic Simulator...\n");
  
  // 1. Check DB connection
  const { error: connErr } = await supabase.from('profiles').select('id').limit(1);
  if (connErr) {
    console.error("❌ Supabase Connection Failed:", connErr.message);
    console.log("Did you run supabase_schema.sql and disable_rls.sql?");
    return;
  }
  console.log("✅ Supabase Connected.\n");

  // 2. Clear existing data for a clean seed
  console.log("🧹 Clearing existing data for clean seed...");
  await supabase.from('messages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('linkages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('programmes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log("✅ Existing data cleared.\n");

  // 3. Create a default Programme
  console.log("📋 Creating default programme...");
  const { data: programme, error: progErr } = await supabase
    .from('programmes')
    .insert([{ name: 'KL Cleantech Accelerator 2026', status: 'active' }])
    .select()
    .single();

  if (progErr) {
    console.error("❌ Failed to create programme:", progErr.message);
    return;
  }
  console.log(`✅ Programme created: ${programme.name}\n`);

  // 4. Generate profiles via Gemini
  console.log("🧠 Asking Gemini to generate 5 Mentors and 10 Startups...\n");

  const prompt = `
    Generate a JSON array of exactly 15 professional profiles for a Malaysian tech accelerator.
    5 must have the role "mentor", 10 must have the role "company".
    
    For mentors:
    - Use realistic full names
    - Use unique email addresses @mentor.ecosystem.ai
    - Set friction_capacity between 15 and 30 (representing their max mentoring capacity)
    
    For companies:
    - Use realistic startup names (e.g., "DataPulse Analytics", "GreenWave Energy")
    - Use unique email addresses @startup.ecosystem.ai
    - Set friction_capacity between 3 and 8 (representing their chaos/friction score)
    
    Output ONLY a valid JSON array, no markdown, no code fences:
    [{ "role": "mentor", "name": "Dr. Sarah Chen", "email": "sarah.chen@mentor.ecosystem.ai", "friction_capacity": 25 }, ...]
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    let text = response.text || "[]";
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let generatedProfiles;
    try {
      generatedProfiles = JSON.parse(text);
    } catch {
      console.error("❌ Failed to parse Gemini response. Using fallback data.");
      generatedProfiles = getFallbackProfiles();
    }

    console.log(`✅ Generated ${generatedProfiles.length} profiles.\n`);

    // 5. Insert profiles
    console.log("📥 Inserting profiles into Supabase...");
    const { data: insertedProfiles, error: insertErr } = await supabase
      .from('profiles')
      .insert(generatedProfiles)
      .select();

    if (insertErr) {
      console.error("❌ Failed to insert profiles:", insertErr.message);
      
      // Try fallback if Gemini output had issues
      if (insertErr.message.includes('duplicate')) {
        console.log("Trying with fallback data...");
        const { data: fallbackData, error: fallbackErr } = await supabase
          .from('profiles')
          .insert(getFallbackProfiles())
          .select();
        
        if (fallbackErr) {
          console.error("❌ Fallback also failed:", fallbackErr.message);
          return;
        }
        console.log(`✅ Inserted ${fallbackData?.length} profiles (fallback).\n`);
      }
      return;
    }

    console.log(`✅ Inserted ${insertedProfiles?.length} profiles.\n`);
    
    // Print summary
    const mentors = insertedProfiles?.filter(p => p.role === 'mentor') || [];
    const companies = insertedProfiles?.filter(p => p.role === 'company') || [];
    
    console.log("📊 Summary:");
    console.log(`   Mentors: ${mentors.length}`);
    mentors.forEach(m => console.log(`     - ${m.name} (Capacity: ${m.friction_capacity})`));
    console.log(`   Companies: ${companies.length}`);
    companies.forEach(c => console.log(`     - ${c.name} (Friction: ${c.friction_capacity})`));
    
    console.log("\n🎉 Synthetic Simulator complete!");
    console.log("Next: Go to http://localhost:3000/admin/dashboard and click 'Run Bipartite Matching'.");

  } catch (error) {
    console.error("❌ Gemini API Error:", error);
    console.log("Using fallback profile data...");
    
    const { data: fallbackData, error: fallbackErr } = await supabase
      .from('profiles')
      .insert(getFallbackProfiles())
      .select();
    
    if (fallbackErr) {
      console.error("❌ Fallback insert failed:", fallbackErr.message);
    } else {
      console.log(`✅ Inserted ${fallbackData?.length} profiles (fallback).`);
    }
  }
}

function getFallbackProfiles() {
  return [
    { role: 'mentor', name: 'Dr. Sarah Chen', email: 'sarah.chen@mentor.ecosystem.ai', friction_capacity: 25 },
    { role: 'mentor', name: 'James Rodriguez', email: 'james.r@mentor.ecosystem.ai', friction_capacity: 20 },
    { role: 'mentor', name: 'Aisha Patel', email: 'aisha.p@mentor.ecosystem.ai', friction_capacity: 30 },
    { role: 'mentor', name: 'Michael Wong', email: 'michael.w@mentor.ecosystem.ai', friction_capacity: 18 },
    { role: 'mentor', name: 'Dr. Fatima Hassan', email: 'fatima.h@mentor.ecosystem.ai', friction_capacity: 22 },
    { role: 'company', name: 'DataPulse Analytics', email: 'datapulse@startup.ecosystem.ai', friction_capacity: 4 },
    { role: 'company', name: 'GreenWave Energy', email: 'greenwave@startup.ecosystem.ai', friction_capacity: 6 },
    { role: 'company', name: 'QuantumLeap AI', email: 'quantumleap@startup.ecosystem.ai', friction_capacity: 8 },
    { role: 'company', name: 'NexGen Robotics', email: 'nexgen@startup.ecosystem.ai', friction_capacity: 5 },
    { role: 'company', name: 'CloudNine Solutions', email: 'cloudnine@startup.ecosystem.ai', friction_capacity: 3 },
    { role: 'company', name: 'BioSynth Labs', email: 'biosynth@startup.ecosystem.ai', friction_capacity: 7 },
    { role: 'company', name: 'CyberShield Security', email: 'cybershield@startup.ecosystem.ai', friction_capacity: 5 },
    { role: 'company', name: 'AgroTech Ventures', email: 'agrotech@startup.ecosystem.ai', friction_capacity: 4 },
    { role: 'company', name: 'FinFlow Systems', email: 'finflow@startup.ecosystem.ai', friction_capacity: 6 },
    { role: 'company', name: 'EduSpark Platform', email: 'eduspark@startup.ecosystem.ai', friction_capacity: 3 },
  ];
}

runSimulator();
