import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY)

// Use Gemini 3.1 Flash-Lite as requested
const model = genAI.getGenerativeModel({ 
  model: 'gemini-3.1-flash-lite'
})

/**
 * Robust JSON parser
 */
function parseGeminiJSON(text) {
  try {
    const firstBrace = text.indexOf('{');
    const firstBracket = text.indexOf('[');
    const lastBrace = text.lastIndexOf('}');
    const lastBracket = text.lastIndexOf(']');
    
    let start = -1;
    let end = -1;
    
    if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
        start = firstBracket;
        end = lastBracket;
    } else if (firstBrace !== -1) {
        start = firstBrace;
        end = lastBrace;
    }

    if (start !== -1 && end !== -1) {
        const jsonStr = text.substring(start, end + 1);
        return JSON.parse(jsonStr);
    }
    
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse JSON:", text);
    throw e;
  }
}

export async function enrichProfile(formAnswers, programmeDescription, files = [], formFields = []) {
  const prompt = `You are a programme coordinator AI. A participant just registered.
Analyse their form answers and return ONLY valid JSON.

Form answers: ${JSON.stringify(formAnswers)}
Programme goal: ${programmeDescription || 'General programme'}
Programme rules and fields: ${JSON.stringify(formFields)}

${files.length > 0 ? "The applicant also provided attached files. Analyze them thoroughly." : ""}

Return this exact JSON structure:
{
  "summary": "one sentence describing this participant",
  "reason": "one sentence explaining why they got this score based on the programme rules",
  "tags": ["tag1", "tag2", "tag3"],
  "score": 75,
  "url_valid": true
}

Rules:
- "summary" must be a single concise sentence
- "reason" must be a concise sentence explaining the score
- "tags" must be an array of 2-5 relevant tags (lowercase)
- "score" must be an integer 0-100 based on how well they fit the programme
- "url_valid" should be true unless URL fields look fake/broken`

  try {
    const parts = [{ text: prompt }]
    
    files.forEach(f => {
      // Ensure mimetype is valid for Gemini (e.g. application/pdf, image/jpeg)
      parts.push({
        inlineData: {
          data: f.base64,
          mimeType: f.mimeType || 'application/pdf'
        }
      })
    })

    const result = await model.generateContent(parts)
    const text = result.response.text()
    console.log("Enrich Profile API Response:", text)
    return parseGeminiJSON(text)
  } catch (error) {
    console.error('Gemini enrichProfile error:', error)
    return {
      summary: 'Profile pending AI analysis',
      tags: ['pending-review'],
      score: 50,
      url_valid: true
    }
  }
}

export async function generateMatches(participant, mentors, matchCriteria, historicalData = null) {
  const mentorList = mentors.map(m => ({
    id: m.id,
    name: m.name,
    bio: m.bio,
    tags: m.expertise_tags
  }))

  const prompt = `You are an expert AI matching engine for the Lyncly ecosystem. Match this participant to the best mentors.
Return ONLY a valid JSON array.

=== 1st Degree Data (Current Application) ===
Participant summary: ${participant.ai_summary || 'No summary available'}
Participant tags: ${JSON.stringify(participant.ai_tags || [])}
Form answers: ${JSON.stringify(participant.form_answers || {})}

=== Ecosystem Historical Data ===
${historicalData ? JSON.stringify(historicalData) : 'No historical data available. This is a first-time user.'}

=== Programme Context ===
Matching criteria: ${JSON.stringify(matchCriteria || {})}

=== Available Mentors ===
${JSON.stringify(mentorList)}

Return exactly this format:
[
  { "mentor_id": "uuid-here", "score": 85, "reason": "one sentence explanation" }
]

Rules:
- Return top 3 matches only, sorted by score descending.
- score must be an integer 0-100.
- reason must be a single concise sentence. If historical data was used, mention it (e.g. "Aligns with their current goals and builds on their past session with Mentor X").
- mentor_id must be an exact ID from the list provided.`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    return parseGeminiJSON(text)
  } catch (error) {
    console.error('Gemini generateMatches error:', error)
    return []
  }
}

export async function generateReport(sessions, matches, participants) {
  const prompt = `You are a programme analyst. Generate insights from this programme data.
Return ONLY valid JSON.

Sessions: ${JSON.stringify(sessions || [])}
Matches: ${JSON.stringify(matches || [])}
Participants: ${JSON.stringify(participants || [])}

Return exactly this format:
{
  "insights": ["insight 1", "insight 2", "insight 3"],
  "top_mentor_profile": "description of what made top mentors successful",
  "recommendation": "what to do differently next cohort",
  "summary": "2-3 sentence programme summary"
}`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    return parseGeminiJSON(text)
  } catch (error) {
    console.error('Gemini generateReport error:', error)
    return {
      insights: ['Unable to generate insights at this time'],
      top_mentor_profile: 'N/A',
      recommendation: 'Collect more data for better insights',
      summary: 'Report generation failed'
    }
  }
}

export async function generateBriefing(participant) {
  const prompt = `You are a mentor preparation assistant. Generate a concise 3-bullet briefing for a mentor about their assigned team/participant.
Return ONLY valid JSON.

Participant: ${participant.name || 'Unknown'}
Summary: ${participant.ai_summary || 'No summary'}
Tags: ${JSON.stringify(participant.ai_tags || [])}
Form answers: ${JSON.stringify(participant.form_answers || {})}

Return:
{ "bullets": ["bullet 1", "bullet 2", "bullet 3"] }

Each bullet should be actionable and concise (max 15 words).`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    return parseGeminiJSON(text)
  } catch (error) {
    console.error('Gemini generateBriefing error:', error)
    return { bullets: ['Review participant profile', 'Discuss their goals', 'Plan next steps'] }
  }
}
