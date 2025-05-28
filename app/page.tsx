'use client';

import React, { useState, useEffect } from 'react';

interface Song {
  title: string;
  artist: string;
  youtubeEmbedUrl?: string;
}

export default function Home() {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [recommendations, setRecommendations] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasSubmitted(true);
    setCurrentIndex(0);

    try {
      const res = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, artist }),
      });

      const { results } = await res.json();
      console.log('🟢 Received results from API:', results);

      if (!results || results.length === 0) {
        console.warn('⚠️ No recommendations returned from API.');
      }

      setRecommendations(results || []);
    } catch (error) {
      console.error('❌ Error fetching recommendations:', error);
      setRecommendations([]);
    }
  };

  const handleVote = (liked: boolean) => {
    const currentSong = recommendations[currentIndex];
    console.log(`🗳️ Voted ${liked ? 'Hit' : 'Miss'} for ${currentSong.title} by ${currentSong.artist}`);
    setCurrentIndex((prev) => prev + 1);
  };

  const currentSong = recommendations[currentIndex];

  useEffect(() => {
    console.log('📦 Full recommendations array:', recommendations);
    console.log('🎯 Current song:', currentSong);
  }, [recommendations, currentIndex]);

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center px-4 py-16">
      <h1 className="text-4xl font-bold text-center mb-4">
        Find your next favourite song
      </h1>
      <p className="text-lg text-gray-400 text-center max-w-xl mb-10">
        Give us a song you love and we’ll find your next favourite song
      </p>

      {/* Form */}
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
          className="w-full py-3 bg-green-500 text-black rounded-md font-semibold hover:bg-green-600 transition"
        >
          Find Similar Songs
        </button>
      </form>

      {/* Results */}
      {hasSubmitted && currentSong ? (
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
            <button
              onClick={() => handleVote(false)}
              className="text-red-400 hover:text-red-500 font-bold text-lg"
            >
              Miss
            </button>

            <button
              onClick={() => handleVote(true)}
              className="text-green-400 hover:text-green-500 font-bold text-lg"
            >
              Hit
            </button>
          </div>
        </div>
      ) : hasSubmitted && !currentSong ? (
        <p className="text-gray-400 mt-8">No matching songs found. Try a different input.</p>
      ) : null}
    </main>
  );
}
