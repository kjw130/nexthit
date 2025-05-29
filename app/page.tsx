'use client';

import React, { useState, useEffect } from 'react';

interface Song {
  title: string;
  artist: string;
  youtubeEmbedUrl?: string;
}

const logMetric = async (eventType: string, songId = '', details = '') => {
  const now = Date.now();
  let userId = localStorage.getItem('user-id');
  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem('user-id', userId);
  }

  const sessionData = localStorage.getItem('session-data');
  let sessionId: string;
  if (sessionData) {
    const { id, timestamp } = JSON.parse(sessionData);
    sessionId = now - timestamp < 30 * 60 * 1000 ? id : crypto.randomUUID();
  } else {
    sessionId = crypto.randomUUID();
  }
  localStorage.setItem('session-data', JSON.stringify({ id: sessionId, timestamp: now }));

  try {
    const res = await fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType, userId, sessionId, songId, details }),
    });
    const data = await res.json();
    console.log('✅ Metric logged response:', data);
  } catch (err) {
    console.error('❌ Metric logging failed:', err);
  }
};

export default function Home() {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [recommendations, setRecommendations] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profanityBlocked, setProfanityBlocked] = useState(false);
  const [apiCapReached, setApiCapReached] = useState(false);
  const [searchDisabled, setSearchDisabled] = useState(false);

  const [hasVoted, setHasVoted] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [email, setEmail] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [emailSubmitted, setEmailSubmitted] = useState(false);

  const currentSong = recommendations[currentIndex];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchDisabled) return;
    setSearchDisabled(true);
    setHasSubmitted(true);
    setHasVoted(false);
    setCurrentIndex(0);
    setLoading(true);
    setProfanityBlocked(false);
    setApiCapReached(false);

    logMetric('search', '', `title: ${title}, artist: ${artist}`);

    try {
      const res = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, artist }),
      });

      if (res.status === 400) {
        alert('Profanity detected. Please enter a different song or artist.');
        setTitle('');
        setArtist('');
        setRecommendations([]);
        setProfanityBlocked(true);
        return;
      }

      if (res.status === 429) {
        console.warn('🔒 API limit reached.');
        setApiCapReached(true);
        setRecommendations([]);
        return;
      }

      const { results } = await res.json();
      setRecommendations(results || []);

      if (!results || results.length === 0) {
        logMetric('no_results', '', `title: ${title}, artist: ${artist}`);
      }
    } catch (error) {
      console.error('❌ Error fetching recommendations:', error);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = (liked: boolean) => {
    if (!currentSong) return;
    logMetric('vote', currentSong.title, liked ? 'liked' : 'disliked');
    setHasVoted(true);
    setShowFeedbackForm(true);
    setCurrentIndex(-1); // hide embed
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await logMetric('feedback', currentSong?.title || '', JSON.stringify({ email, feedback: feedbackText }));
    setFeedbackSubmitted(true);
    setFeedbackText('');
    setEmail('');
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await logMetric('waitlist_email', '', email);
    setEmailSubmitted(true);
    setEmail('');
  };

  useEffect(() => {
    logMetric('visit');
    const start = Date.now();
    const handleUnload = () => {
      const duration = Math.floor((Date.now() - start) / 1000);
      logMetric('time_on_site', '', `${duration}s`);
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center px-4 py-16">
      <h1 className="text-4xl font-bold text-center mb-4">Find your next favourite song</h1>
      <p className="text-lg text-gray-400 text-center max-w-xl mb-10">
        Give us a song you love and we’ll find your next favourite song
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4 mb-12 w-full max-w-md">
        <input
          type="text"
          placeholder="Song Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-4 rounded-md bg-zinc-900 border border-zinc-700 placeholder-gray-500"
        />
        <input
          type="text"
          placeholder="Artist Name"
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          className="w-full p-4 rounded-md bg-zinc-900 border border-zinc-700 placeholder-gray-500"
        />
        <button
          type="submit"
          disabled={searchDisabled}
          className={`w-full py-3 rounded-md font-semibold transition ${
            searchDisabled
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-green-500 text-black hover:bg-green-600'
          }`}
        >
          Find Similar Songs
        </button>
      </form>

      {loading && <div className="text-gray-400 animate-pulse mb-6">Loading your song...</div>}

      {apiCapReached && (
        <div className="text-center bg-zinc-800 p-6 rounded-xl w-full max-w-xl mt-6">
          <p className="text-red-400 font-semibold text-lg mb-4">We’ve reached our daily API limit.</p>
          <p className="text-gray-300 mb-4">
            Unfortunately we’ve hit our free-tier YouTube API cap for the day. Please try again tomorrow.
            If you'd like to get notified about project updates or expanded availability, leave your email below.
          </p>

          {!emailSubmitted ? (
            <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
              <input
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 rounded-md bg-zinc-900 border border-zinc-700 placeholder-gray-500"
              />
              <button type="submit" className="py-2 px-4 bg-blue-500 hover:bg-blue-600 transition text-white rounded-md">
                Join Waitlist
              </button>
            </form>
          ) : (
            <p className="text-green-400 mt-4 text-sm">Thanks — you're on the list!</p>
          )}
        </div>
      )}

      {hasSubmitted && currentSong && !loading && !apiCapReached && !hasVoted && (
        <div className="w-full max-w-xl bg-zinc-800 rounded-xl p-6 flex flex-col gap-4 items-center">
          <div className="text-center">
            <div className="font-semibold text-xl">{currentSong.title}</div>
            <div className="text-sm text-gray-400">{currentSong.artist}</div>
          </div>

          {currentSong.youtubeEmbedUrl ? (
            <iframe
              width="360"
              height="215"
              src={currentSong.youtubeEmbedUrl}
              title="YouTube video preview"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="rounded-md"
            />
          ) : (
            <div className="w-64 h-64 bg-zinc-700 rounded-md flex items-center justify-center text-gray-400">
              No preview found
            </div>
          )}

          <div className="flex justify-between w-full mt-4">
            <button onClick={() => handleVote(false)} className="text-red-400 hover:text-red-500 font-bold text-lg">
              Dislike 👎
            </button>
            <button onClick={() => handleVote(true)} className="text-green-400 hover:text-green-500 font-bold text-lg">
              Like 👍
            </button>
          </div>
        </div>
      )}

      {hasVoted && showFeedbackForm && !feedbackSubmitted && (
        <div className="w-full max-w-xl bg-zinc-800 rounded-xl p-6 mt-6">
          <form onSubmit={handleFeedbackSubmit} className="flex flex-col gap-4">
            <input
              type="email"
              placeholder="Your email (optional)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-md bg-zinc-900 border border-zinc-700 placeholder-gray-500"
            />
            <textarea
              placeholder="Got feedback or a feature idea?"
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              className="w-full p-3 rounded-md bg-zinc-900 border border-zinc-700 placeholder-gray-500"
            />
            <button type="submit" className="py-2 px-4 bg-blue-500 hover:bg-blue-600 transition text-white rounded-md">
              Submit Feedback
            </button>
          </form>
        </div>
      )}

      {feedbackSubmitted && (
        <p className="text-green-400 text-sm mt-6">🙏 Thank you for your feedback!</p>
      )}

      {hasSubmitted &&
        !loading &&
        !profanityBlocked &&
        !apiCapReached &&
        recommendations.length === 0 &&
        !showFeedbackForm &&
        !feedbackSubmitted && (
          <p className="text-gray-400 mt-8">
            No matching songs found. Try a different input.
          </p>
        )}
    </main>
  );
}
