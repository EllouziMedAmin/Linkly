import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' })

/**
 * Parse a JSON response from Gemini, stripping markdown fences.
 */
function parseGeminiJSON(text) {
  let cleaned = text.trim()
  // Strip markdown code fences
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '')
  }
  return JSON.parse(cleaned)
}

/**
 * Call 1 — After registration: Enrich participant profile
 * Returns: { summary, tags, score, url_valid }
 */
export async function enrichProfile(formAnswers, programmeDescription, files = []) {
  const prompt = `You are a programme coordinator AI. A participant just registered.
Analyse their form answers and return ONLY valid JSON, no markdown, no explanation.

Form answers: ${JSON.stringify(formAnswers)}
Programme goal: ${programmeDescription || 'General programme'}

${files.length > 0 ? "The applicant also provided attached files (e.g. CVs or Pitch Decks). Please analyze them thoroughly." : ""}

Return this exact JSON structure:
{
  "summary": "one sentence describing this participant",
  "tags": ["tag1", "tag2", "tag3"],
  "score": 75,
  "url_valid": true
}

Rules:
- "summary" must be a single concise sentence
- "tags" must be an array of 2-5 relevant tags (lowercase)
- "score" must be an integer 0-100 based on how well they fit the programme
- "url_valid" should be true unless URL fields look fake/broken`

  try {
    const parts = [prompt]
    
    files.forEach(f => {
      parts.push({
        inlineData: {
          data: f.base64,
          mimeType: f.mimeType
        }
      })
    })

    const result = await model.generateContent(parts)
    const text = result.response.text()
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

/**
 * Call 2 — Mentor matching
 * Returns: [{ mentor_id, score, reason }]
 */
export async function generateMatches(participant, mentors, matchCriteria) {
  const mentorList = mentors.map(m => ({
    id: m.id,
    name: m.name,
    bio: m.bio,
    tags: m.expertise_tags
  }))

  const prompt = `You are a matching engine. Match this participant to the best mentors.
Return ONLY valid JSON array, no markdown, no explanation.

Participant summary: ${participant.ai_summary || 'No summary available'}
Participant tags: ${JSON.stringify(participant.ai_tags || [])}
Programme matching criteria: ${JSON.stringify(matchCriteria || {})}

Mentors:
${JSON.stringify(mentorList)}

Return exactly this format:
[{ "mentor_id": "uuid-here", "score": 85, "reason": "one sentence explanation" }]

Rules:
- Return top 3 only, sorted by score descending
- score must be 0-100 integer
- reason must be a single concise sentence
- mentor_id must be an exact ID from the list above`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    return parseGeminiJSON(text)
  } catch (error) {
    console.error('Gemini generateMatches error:', error)
    return []
  }
}

/**
 * Call 3 — Analytics report generation
 * Returns: { insights, top_mentor_profile, recommendation, summary }
 */
export async function generateReport(sessions, matches, participants) {
  const prompt = `You are a programme analyst. Generate insights from this programme data.
Return ONLY valid JSON, no markdown.

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

/**
 * Call 4 — Mentor briefing for a team
 * Returns: { bullets: [string, string, string] }
 */
export async function generateBriefing(participant) {
  const prompt = `You are a mentor preparation assistant. Generate a concise 3-bullet briefing for a mentor about their assigned team/participant.
Return ONLY valid JSON, no markdown.

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
