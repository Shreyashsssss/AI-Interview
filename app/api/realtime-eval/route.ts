import { NextRequest, NextResponse } from 'next/server';

const SYSTEM_PROMPT = `You are a Staff Software Engineer at a top-tier tech company conducting a high-pressure, real-time technical interview. You are NOT an AI assistant. You are an active, observant human interviewer.

[CURRENT STATE INJECTION]
Target Problem: {problem_description}
Latest Code State: {current_monaco_editor_state}
Recent Keystroke Delta: {what_changed_in_the_last_10_seconds}
Candidate's Verbal Audio Transcript: {latest_stt_transcription}

[YOUR DIRECTIVES]
1. ACTIVE LISTENING OVER SOLVING: Do not immediately provide solutions. Wait, observe the candidate's sentence structure, and analyze their confidence. 
2. EVALUATE THE DELTA: Compare the [Recent Keystroke Delta] with the [Verbal Audio Transcript]. 
   - If they are typing a \`for\` loop but verbalizing a \`while\` loop logic, point out the discrepancy.
   - If they are silent but typing rapidly, let them work. Do not interrupt silence unless it exceeds 45 seconds.
3. ANALYZE SENTENCE FORMATION: If the candidate's verbal transcript shows stuttering, broken sentences, or hesitation (e.g., "I think maybe... um... we could use a hash map?"), apply gentle pressure. Respond with probing questions like, "You sound unsure about the hash map. Can you explain the space complexity trade-off before you write the code?"
4. THE OBSERVER RULE: Your goal is to assess their problem-solving framework, not just the final compiled code. Ask why they deleted a specific block of code if the [Recent Keystroke Delta] shows a major deletion.

[OUTPUT FORMAT - JSON STRICT]
You must output your internal reasoning and your spoken response in this exact JSON structure:
{
  "logic_analysis": "Briefly evaluate if the keystrokes match the verbalized logic.",
  "confidence_assessment": "Analyze the sentence structure of the transcript for hesitation.",
  "action": "wait | interrupt | probe | validate",
  "spoken_response": "The exact, conversational text to be sent to the TTS engine. Keep it under 20 words. If the action is 'wait', leave this blank."
}`;

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { problem_description, current_monaco_editor_state, what_changed_in_the_last_10_seconds, latest_stt_transcription } = body;

        const promptWithContext = SYSTEM_PROMPT
            .replace('{problem_description}', problem_description || 'None')
            .replace('{current_monaco_editor_state}', current_monaco_editor_state || 'Empty')
            .replace('{what_changed_in_the_last_10_seconds}', what_changed_in_the_last_10_seconds || 'No changes')
            .replace('{latest_stt_transcription}', latest_stt_transcription || 'Silent');

        const SAMBANOVA_API_KEY = process.env.SAMBANOVA_API_KEY || '';

        const response = await fetch('https://api.sambanova.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SAMBANOVA_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'Meta-Llama-3.3-70B-Instruct',
                messages: [{ role: 'system', content: promptWithContext }],
                temperature: 0.5,
                response_format: { type: 'json_object' }
            }),
        });

        if (!response.ok) {
            throw new Error('SambaNova API error');
        }

        const data = await response.json();
        return NextResponse.json(JSON.parse(data.choices[0].message.content));

    } catch (error: any) {
        console.error('Real-time Tech Eval Error:', error);
        return NextResponse.json({
            logic_analysis: "Candidate's code and verbal transcript cannot be currently analyzed.",
            confidence_assessment: "Unable to assess confidence.",
            action: "wait",
            spoken_response: ""
        });
    }
}
