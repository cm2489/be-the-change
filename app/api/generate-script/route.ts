import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

// Initialize OpenAI with error handling
let openai: OpenAI | null = null
try {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || ''
  })
} catch (error) {
  console.error('Failed to initialize OpenAI:', error)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: Request) {
  try {
    // Check if OpenAI is initialized
    if (!openai) {
      return NextResponse.json(
        { error: 'OpenAI is not configured properly' },
        { status: 500 }
      )
    }

    // Check if API key exists
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key is missing')
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { 
      userId,
      representativeName,
      representativeTitle,
      issueTitle,
      issueDescription,
      scriptType,
      tone,
      personalStory,
      userName
    } = body

    console.log('Generating script for:', { issueTitle, scriptType })

    // Create the prompt
    let prompt = ''

    if (scriptType === 'phone') {
      prompt = `
        Create a phone script for calling ${representativeTitle} ${representativeName}'s office about ${issueTitle}.

        Caller: ${userName || 'A constituent'}
        Issue: ${issueTitle}
        Tone: ${tone || 'professional'}

        Keep it under 60 seconds. Include:
        1. Polite greeting and self-introduction
        2. State the issue clearly
        3. Make a specific ask
        4. Thank them

        Write in a natural, conversational tone.
      `
    } else if (scriptType === 'email') {
      prompt = `
        Write a brief email to ${representativeTitle} ${representativeName} about ${issueTitle}.
        Keep it under 200 words. Include a clear subject line.
        Tone: ${tone || 'professional'}
      `
    } else {
      prompt = `
        Create a brief town hall question about ${issueTitle}.
        Keep it under 30 seconds when spoken.
      `
    }

    console.log('Calling OpenAI API...')

    // Call OpenAI with error handling
    let generatedContent = ''

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an expert at helping citizens communicate with elected officials. Create clear, respectful, and impactful scripts."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 400
      })

      generatedContent = completion.choices[0]?.message?.content || 'Failed to generate content'
      console.log('Script generated successfully')

    } catch (openAIError: any) {
      console.error('OpenAI API error:', openAIError)

      // Specific error handling
      if (openAIError.status === 401) {
        return NextResponse.json(
          { error: 'Invalid API key. Please check your OpenAI API key.' },
          { status: 500 }
        )
      }

      if (openAIError.status === 429) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again in a moment.' },
          { status: 500 }
        )
      }

      if (openAIError.error?.code === 'insufficient_quota') {
        return NextResponse.json(
          { error: 'OpenAI quota exceeded. Please check your OpenAI account for credits.' },
          { status: 500 }
        )
      }

      // For now, use a fallback script if OpenAI fails
      generatedContent = `
Hello ${representativeTitle} ${representativeName}'s office,

My name is ${userName || '[Your Name]'}, and I'm a constituent calling about ${issueTitle}.

${issueDescription ? `This issue is important because: ${issueDescription}` : 'This issue is important to our community.'}

I urge the ${representativeTitle} to take action on this matter.

Thank you for your time and for passing along my message.

[Note: This is a template script. OpenAI integration is being configured.]
      `
    }

    const wordCount = generatedContent.split(' ').length

    // Try to save to database (but don't fail if it doesn't work)
    try {
      if (userId) {
        await supabase
          .from('scripts')
          .insert({
            user_id: userId,
            script_type: scriptType,
            issue_title: issueTitle,
            generated_content: generatedContent,
            word_count: wordCount
          })
      }
    } catch (dbError) {
      console.error('Database save error:', dbError)
      // Continue anyway - script was generated
    }

    // Return success response
    return NextResponse.json({
      success: true,
      script: generatedContent,
      wordCount: wordCount,
      scriptId: null
    })

  } catch (error: any) {
    console.error('Unexpected error in generate-script:', error)

    return NextResponse.json(
      { 
        error: 'An unexpected error occurred',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
