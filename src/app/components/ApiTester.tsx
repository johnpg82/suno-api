'use client';

import { useState, useEffect } from 'react';

interface SongResult {
  id: string;
  title: string;
  lyric: string;
  audio_url: string;
  video_url: string;
  created_at: string;
  model_name: string;
  status: string;
  gpt_description_prompt?: string;
  prompt?: string;
  type: string;
  tags?: string;
}

interface LyricsResult {
  text: string;
  title: string;
  status: string;
  error_message: string;
  tags: string[];
}

interface LimitResult {
  success: boolean;
  credits_left: number;
  period: string;
  monthly_limit: number;
  monthly_usage: number;
}

export default function ApiTester() {
  const [activeTab, setActiveTab] = useState('song_generator');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [generatedSongIds, setGeneratedSongIds] = useState<string[]>([]);
  const [songProgress, setSongProgress] = useState<{[key: string]: any}>({});
  const [progressInterval, setProgressInterval] = useState<NodeJS.Timeout | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  // Form states for different endpoints
  const [generateForm, setGenerateForm] = useState({
    prompt: 'A cheerful acoustic song about coding and building amazing applications',
    make_instrumental: false
  });

  const [customGenerateForm, setCustomGenerateForm] = useState({
    prompt: 'An uplifting electronic track about technological innovation',
    tags: 'electronic, uplifting, inspiring',
    title: 'Digital Dreams',
    make_instrumental: false,
    duration: '30'
  });

  const [lyricsForm, setLyricsForm] = useState({
    prompt: 'A song about the joy of programming and creating software'
  });

  const [songIds, setSongIds] = useState('');
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [statusInterval, setStatusInterval] = useState<NodeJS.Timeout | null>(null);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (statusInterval) {
        clearInterval(statusInterval);
      }
      if (progressInterval) {
        clearInterval(progressInterval);
      }
    };
  }, [statusInterval, progressInterval]);

  const makeApiCall = async (endpoint: string, data?: any) => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch(`http://localhost:3000/api/${endpoint}`, {
        method: data ? 'POST' : 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        body: data ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setResults(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('http://localhost:3000/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(generateForm),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setResults(result);

      // If songs were generated, store their IDs for status checking
      if (result && result.songs && Array.isArray(result.songs)) {
        const songIdsToCheck = result.songs.map((song: any) => song.id);
        setGeneratedSongIds(songIdsToCheck);

        // Auto-start status checking for newly generated songs
        if (songIdsToCheck.length > 0) {
          startStatusChecking(songIdsToCheck);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomGenerate = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('http://localhost:3000/api/custom_generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customGenerateForm),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setResults(result);

      // If songs were generated, store their IDs for status checking
      if (result && result.songs && Array.isArray(result.songs)) {
        const songIdsToCheck = result.songs.map((song: any) => song.id);
        setGeneratedSongIds(songIdsToCheck);

        // Auto-start status checking for newly generated songs
        if (songIdsToCheck.length > 0) {
          startStatusChecking(songIdsToCheck);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateLyrics = () => {
    makeApiCall('generate_lyrics', lyricsForm);
  };

  const handleGetLimit = () => {
    makeApiCall('get_limit');
  };

  const handleGetSongs = () => {
    const params = songIds ? `?ids=${songIds}` : '';
    makeApiCall(`get${params}`);
  };

  const checkSongStatus = async (ids: string[]) => {
    try {
      const response = await fetch(`http://localhost:3000/api/get?ids=${ids.join(',')}`);
      if (response.ok) {
        const songs = await response.json();
        setResults(songs);

        // Check if all songs are complete
        const allComplete = songs.every((song: SongResult) => song.status === 'complete');
        if (allComplete && statusInterval) {
          clearInterval(statusInterval);
          setStatusInterval(null);
          setCheckingStatus(false);
        }

        return songs;
      }
    } catch (err) {
      console.error('Error checking status:', err);
    }
    return null;
  };

  const startStatusChecking = (songIdsToCheck: string[]) => {
    if (statusInterval) {
      clearInterval(statusInterval);
    }

    setCheckingStatus(true);

    const interval = setInterval(() => {
      checkSongStatus(songIdsToCheck);
    }, 5000); // Check every 5 seconds

    setStatusInterval(interval);

    // Initial check
    checkSongStatus(songIdsToCheck);
  };

  const stopStatusChecking = () => {
    if (statusInterval) {
      clearInterval(statusInterval);
      setStatusInterval(null);
    }
    setCheckingStatus(false);
  };

  // Song generation workflow functions
  const startSongGeneration = async (prompt: string, tags: string, title: string, duration: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('http://localhost:3000/api/custom_generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          tags,
          title,
          make_instrumental: false,
          duration
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.songs && result.songs.length > 0) {
        const songIds = result.songs.map((song: any) => song.id);

        // Initialize progress tracking
        const initialProgress = result.songs.reduce((acc: any, song: any) => {
          acc[song.id] = {
            ...song,
            progress: 0,
            status: 'queued'
          };
          return acc;
        }, {});

        setSongProgress(initialProgress);

        // Start polling for progress
        startProgressPolling(songIds);

        setResults({
          message: 'Song generation started! Monitoring progress...',
          songs: result.songs
        });
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Song generation failed');
    } finally {
      setLoading(false);
    }
  };

  const startProgressPolling = (songIds: string[]) => {
    if (progressInterval) {
      clearInterval(progressInterval);
    }

    setIsPolling(true);

    const poll = async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/get?ids=${songIds.join(',')}`);
        if (response.ok) {
          const songs = await response.json();

          // Update progress for each song
          const updatedProgress = { ...songProgress };
          let allComplete = true;

          songs.forEach((song: any) => {
            updatedProgress[song.id] = {
              ...song,
              progress: song.status === 'complete' ? 100 :
                       song.status === 'streaming' ? 75 :
                       song.status === 'queued' ? 25 : 0
            };
            if (song.status !== 'complete') {
              allComplete = false;
            }
          });

          setSongProgress(updatedProgress);

          // Stop polling if all songs are complete
          if (allComplete) {
            if (progressInterval) {
              clearInterval(progressInterval);
              setProgressInterval(null);
            }
            setIsPolling(false);
            setResults({
              message: '🎉 All songs completed! Ready to download.',
              songs: songs
            });
          }
        }
      } catch (err) {
        console.error('Progress polling error:', err);
      }
    };

    // Poll immediately, then every 5 seconds
    poll();
    const interval = setInterval(poll, 5000);
    setProgressInterval(interval);
  };

  const stopProgressPolling = () => {
    if (progressInterval) {
      clearInterval(progressInterval);
      setProgressInterval(null);
    }
    setIsPolling(false);
  };

  const renderResults = () => {
    if (!results) return null;

    return (
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
        <h3 className="text-lg font-semibold mb-3">Results:</h3>
        <pre className="text-sm bg-white p-3 rounded border overflow-x-auto">
          {JSON.stringify(results, null, 2)}
        </pre>
      </div>
    );
  };

  const renderSongResults = () => {
    // Handle both old format (direct array) and new format (songs property)
    const songs = results?.songs || (Array.isArray(results) ? results : null);
    if (!songs || !Array.isArray(songs)) return null;

    const songIdsToCheck = songs.map((song: SongResult) => song.id);
    const hasIncompleteSongs = songs.some((song: SongResult) => song.status !== 'complete');

    return (
      <div className="mt-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Generated Songs:</h3>
        </div>

        {results?.message && (
          <div className="bg-green-50 border border-green-200 rounded p-3 mb-4">
            <div className="flex items-center text-green-800 text-sm">
              <span className="mr-2">✅</span>
              <span>{results.message}</span>
            </div>
          </div>
        )}

        {hasIncompleteSongs && (
          <div className="flex gap-2">
            {checkingStatus ? (
              <button
                onClick={stopStatusChecking}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
              >
                ⏹️ Stop Monitoring
              </button>
            ) : (
              <button
                onClick={() => startStatusChecking(songIdsToCheck)}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
              >
                🔄 Monitor Status
              </button>
            )}

            <button
              onClick={() => checkSongStatus(songIdsToCheck)}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
            >
              🔍 Check Now
            </button>
          </div>
        )}

        {checkingStatus && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded p-3 mb-4">
            <div className="flex items-center text-blue-800 text-sm">
              <div className="status-indicator animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              🎵 Monitoring song generation status... (updates every 5 seconds)
            </div>
          </div>
        )}

        {songs.map((song: SongResult, index: number) => (
          <div key={song.id} className="song-result-card p-4 bg-white rounded-lg border shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-medium text-lg">{song.title || `Song ${index + 1}`}</h4>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                song.status === 'complete' ? 'bg-green-100 text-green-800' :
                song.status === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {song.status}
              </span>
            </div>

            {song.lyric && (
              <div className="mb-3">
                <p className="text-sm text-gray-600 mb-1">Lyrics:</p>
                <p className="text-sm whitespace-pre-line bg-gray-50 p-2 rounded">
                  {song.lyric.length > 200 ? `${song.lyric.substring(0, 200)}...` : song.lyric}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">ID:</span> {song.id}
              </div>
              <div>
                <span className="font-medium">Model:</span> {song.model_name}
              </div>
              <div>
                <span className="font-medium">Created:</span> {new Date(song.created_at).toLocaleString()}
              </div>
              {song.tags && (
                <div>
                  <span className="font-medium">Tags:</span> {song.tags}
                </div>
              )}
            </div>

            {song.audio_url && (
              <div className="mt-4">
                <audio controls className="audio-player w-full">
                  <source src={song.audio_url} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}

            {song.video_url && (
              <div className="mt-2">
                <a href={song.video_url} target="_blank" rel="noopener noreferrer"
                   className="text-blue-600 hover:text-blue-800 text-sm underline">
                  🎵 Listen to full song
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderLyricsResults = () => {
    if (!results || !results.text) return null;

    const lyricsResult = results as LyricsResult;
    return (
      <div className="mt-6 p-4 song-result-card bg-white rounded-lg border shadow-sm">
        <h3 className="text-lg font-semibold mb-3">{lyricsResult.title}</h3>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Generated Lyrics:</p>
          <div className="bg-gray-50 p-4 rounded whitespace-pre-line font-mono text-sm">
            {lyricsResult.text}
          </div>
        </div>

        {lyricsResult.tags && lyricsResult.tags.length > 0 && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Suggested Music Style:</p>
            <div className="flex flex-wrap gap-2">
              {lyricsResult.tags.map((tag, index) => (
                <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="text-sm text-gray-600">
          <span className="font-medium">Status:</span> {lyricsResult.status}
        </div>
      </div>
    );
  };

  const renderLimitResults = () => {
    if (!results || !results.credits_left) return null;

    const limitResult = results as LimitResult;
    return (
      <div className="mt-6 p-4 song-result-card bg-white rounded-lg border shadow-sm">
        <h3 className="text-lg font-semibold mb-3">Account Limits</h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{limitResult.credits_left}</div>
            <div className="text-sm text-green-800">Credits Left</div>
          </div>

          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{limitResult.monthly_limit}</div>
            <div className="text-sm text-blue-800">Monthly Limit</div>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          <div><span className="font-medium">Period:</span> {limitResult.period}</div>
          <div><span className="font-medium">Monthly Usage:</span> {limitResult.monthly_usage}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="api-tester-card rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6 text-center">🎵 Suno API Tester</h2>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-6 border-b">
          {[
            { id: 'song_generator', label: 'Song Generator', icon: '🎵' },
            { id: 'generate', label: 'Generate Music', icon: '🎼' },
            { id: 'custom_generate', label: 'Custom Generate', icon: '🎼' },
            { id: 'lyrics', label: 'Generate Lyrics', icon: '📝' },
            { id: 'limits', label: 'Account Limits', icon: '💰' },
            { id: 'get_songs', label: 'Get Songs', icon: '📋' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-button px-4 py-2 rounded-t-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-b-2 border-purple-600 shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gradient-to-r hover:from-gray-200 hover:to-gray-300'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Form Content */}
        <div className="mb-6">
          {/* Song Generator Tab */}
          {activeTab === 'song_generator' && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">🎵 AI Song Generator</h3>
                <p className="text-gray-600">Create custom songs with automatic progress monitoring</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Song Prompt
                  </label>
                  <textarea
                    value={customGenerateForm.prompt}
                    onChange={(e) => setCustomGenerateForm({...customGenerateForm, prompt: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={4}
                    placeholder="Describe the song you want to create..."
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Music Style/Tags
                    </label>
                    <input
                      type="text"
                      value={customGenerateForm.tags}
                      onChange={(e) => setCustomGenerateForm({...customGenerateForm, tags: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Rock, Metal, Electronic..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Song Title
                    </label>
                    <input
                      type="text"
                      value={customGenerateForm.title}
                      onChange={(e) => setCustomGenerateForm({...customGenerateForm, title: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter song title..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Song Duration (seconds)
                    </label>
                    <select
                      value={customGenerateForm.duration}
                      onChange={(e) => setCustomGenerateForm({...customGenerateForm, duration: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="15">15 seconds (Short)</option>
                      <option value="30">30 seconds (Medium)</option>
                      <option value="60">60 seconds (Long)</option>
                      <option value="90">90 seconds (Extra Long)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <button
                  onClick={() => startSongGeneration(
                    customGenerateForm.prompt,
                    customGenerateForm.tags,
                    customGenerateForm.title,
                    customGenerateForm.duration
                  )}
                  disabled={loading}
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Generating Song...
                    </div>
                  ) : (
                    '🎵 Generate Song'
                  )}
                </button>

                {isPolling && (
                  <div className="mt-4">
                    <button
                      onClick={stopProgressPolling}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    >
                      ⏹️ Stop Monitoring
                    </button>
                  </div>
                )}
              </div>

              {/* Progress Display */}
              {Object.keys(songProgress).length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-center">📊 Generation Progress</h4>
                  {Object.entries(songProgress).map(([songId, progress]: [string, any]) => (
                    <div key={songId} className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border">
                      <div className="flex justify-between items-center mb-2">
                        <h5 className="font-medium">{progress.title || `Song ${songId.slice(-8)}`}</h5>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          progress.status === 'complete' ? 'bg-green-100 text-green-800' :
                          progress.status === 'streaming' ? 'bg-blue-100 text-blue-800' :
                          progress.status === 'queued' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {progress.status}
                        </span>
                      </div>

                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div
                          className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress.progress || 0}%` }}
                        ></div>
                      </div>

                      <div className="text-sm text-gray-600">
                        Progress: {progress.progress || 0}%
                      </div>

                      {progress.audio_url && progress.audio_url !== 'https://audiopipe.suno.ai/?item_id=' + songId && (
                        <div className="mt-4">
                          <p className="text-sm font-medium mb-2">🎧 Preview Available:</p>
                          <audio controls className="w-full audio-player">
                            <source src={progress.audio_url} type="audio/mpeg" />
                            Your browser does not support the audio element.
                          </audio>
                        </div>
                      )}

                      {progress.status === 'complete' && progress.audio_url && (
                        <div className="mt-4">
                          <a
                            href={progress.audio_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                          >
                            📥 Download Song
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Generate Music Tab */}
          {activeTab === 'generate' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prompt
                </label>
                <textarea
                  value={generateForm.prompt}
                  onChange={(e) => setGenerateForm({...generateForm, prompt: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Describe the song you want to generate..."
                />
              </div>

              <div className="flex items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={generateForm.make_instrumental}
                    onChange={(e) => setGenerateForm({...generateForm, make_instrumental: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-sm">Instrumental only</span>
                </label>
              </div>

              <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
                <strong>Note:</strong> Song IDs are returned immediately. Use the "Monitor Status" button to track generation progress.
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? '🎵 Generating...' : '🎵 Generate Music'}
              </button>
            </div>
          )}

          {/* Custom Generate Tab */}
          {activeTab === 'custom_generate' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prompt
                </label>
                <textarea
                  value={customGenerateForm.prompt}
                  onChange={(e) => setCustomGenerateForm({...customGenerateForm, prompt: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Describe the song you want to generate..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={customGenerateForm.title}
                    onChange={(e) => setCustomGenerateForm({...customGenerateForm, title: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Song title..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags
                  </label>
                  <input
                    type="text"
                    value={customGenerateForm.tags}
                    onChange={(e) => setCustomGenerateForm({...customGenerateForm, tags: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="electronic, upbeat, inspiring..."
                  />
                </div>
              </div>

              <div className="flex items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={customGenerateForm.make_instrumental}
                    onChange={(e) => setCustomGenerateForm({...customGenerateForm, make_instrumental: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-sm">Instrumental only</span>
                </label>
              </div>

              <div className="text-sm text-gray-600 bg-purple-50 p-3 rounded">
                <strong>Note:</strong> Song IDs are returned immediately. Use the "Monitor Status" button to track generation progress.
              </div>

              <button
                onClick={handleCustomGenerate}
                disabled={loading}
                className="w-full bg-purple-600 text-white py-3 px-6 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? '🎼 Generating...' : '🎼 Custom Generate'}
              </button>
            </div>
          )}

          {/* Generate Lyrics Tab */}
          {activeTab === 'lyrics' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prompt
                </label>
                <textarea
                  value={lyricsForm.prompt}
                  onChange={(e) => setLyricsForm({...lyricsForm, prompt: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Describe the lyrics you want to generate..."
                />
              </div>

              <button
                onClick={handleGenerateLyrics}
                disabled={loading}
                className="w-full bg-green-600 text-white py-3 px-6 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? '📝 Generating...' : '📝 Generate Lyrics'}
              </button>
            </div>
          )}

          {/* Account Limits Tab */}
          {activeTab === 'limits' && (
            <div className="text-center">
              <button
                onClick={handleGetLimit}
                disabled={loading}
                className="bg-yellow-600 text-white py-3 px-6 rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? '💰 Checking...' : '💰 Check Account Limits'}
              </button>
            </div>
          )}

          {/* Get Songs Tab */}
          {activeTab === 'get_songs' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Song IDs (optional - comma separated)
                </label>
                <input
                  type="text"
                  value={songIds}
                  onChange={(e) => setSongIds(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Leave empty to get all songs, or enter IDs like: id1,id2,id3"
                />
              </div>

              <button
                onClick={handleGetSongs}
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-3 px-6 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? '📋 Fetching...' : '📋 Get Songs'}
              </button>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center">
              <span className="text-red-600 mr-2">❌</span>
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Results Display */}
        {activeTab === 'generate' || activeTab === 'custom_generate' ? renderSongResults() :
         activeTab === 'lyrics' ? renderLyricsResults() :
         activeTab === 'limits' ? renderLimitResults() :
         renderResults()}
      </div>
    </div>
  );
}
