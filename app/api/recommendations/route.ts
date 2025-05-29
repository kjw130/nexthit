import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { getValidYouTubeVideoId } from '@/lib/getValidYoutubeVideo';

function getOpenAIClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
}

function containsProfanity(text: string): boolean {
  const badWords = [
    'fuck', 'shit', 'bitch', 'ass', 'cunt', 'nigger', 'faggot', 'rape', 'hitler',
    'slut', 'dick', 'cock', 'whore'
  ];
  const lower = text.toLowerCase();
  return badWords.some((word) => lower.includes(word));
}

async function generateSongSuggestions(title: string, artist: string): Promise<{ title: string; artist: string }[]> {
  const prompt = `Suggest 1 songs that are similar to "${title}" by "${artist}". The context is that this song is inputted by the user as one of those emotionally resonant "replay for weeks" tracks. Return ONLY a JSON array of {"title": string, "artist": string}, no other text.`;

  const openai = getOpenAIClient();
  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = completion.choices[0].message.content ?? '';


  let parsed: { title: string; artist: string }[] = [];

  try {
    parsed = JSON.parse(raw);
  } catch (err) {
  
    parsed = raw
      .split('\n')
      .map((line) => line.replace(/^[-*\d.]+\s*/, '').trim())
      .filter(Boolean)
      .map((line) => {
        const [titlePart, ...artistParts] = line.split(' - ');
        return {
          title: titlePart.trim(),
          artist: artistParts.join(' - ').trim(),
        };
      })
      .filter((s) => s.title && s.artist);
  }

  return parsed;
}

export async function POST(req: NextRequest) {
  const { title, artist } = await req.json();


  if (containsProfanity(title) || containsProfanity(artist)) {
    console.warn('🚫 Profanity detected. Rejecting request.');
    return NextResponse.json({ error: 'Inappropriate input' }, { status: 400 });
  }

  const suggestions = await generateSongSuggestions(title, artist);


  const results = [];

  for (const song of suggestions) {
    const query = `${song.title} ${song.artist}`;
    try {
      const embedUrl = await getValidYouTubeVideoId(query);

      if (embedUrl) {
        results.push({
          id: embedUrl,
          title: song.title,
          artist: song.artist,
          youtubeEmbedUrl: embedUrl,
        });
   
      } else {
        console.warn(`❌ No valid YouTube video found for ${song.title} - ${song.artist}`);
      }

      if (results.length >= 1) break;
    } catch (err: any) {
      

      // YouTube quota or key error
      const message = err?.message?.toLowerCase();
      const isQuota = message?.includes('quota') || message?.includes('daily') || err?.response?.status === 403;

      if (isQuota) {
        return NextResponse.json({ error: 'API_LIMIT_REACHED' }, { status: 429 });
      } else {
        return NextResponse.json({ error: 'YOUTUBE_API_ERROR' }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ results });
}
