import { supabase } from './supabase';

// Save a revealed song to the user's history
export async function saveSongToHistory(userId, song) {
  try {
    // Early check for null/undefined userId
    if (!userId) {
      return { success: false, error: "No user ID provided" };
    }

    // Format the song data for storage
    const songData = {
      user_id: userId,
      song_id: song.id,
      song_name: song.name,
      artist_name: song.artists.map((artist) => artist.name).join(", "),
      album_name: song.album.name,
      album_image_url: song.album.images[0]?.url || null,
      popularity: song.popularity || null,
      external_url: song.external_urls?.spotify || null,
      // Use current date as revealed_at (will use server timezone)
      revealed_at: new Date().toISOString(),
    };

    // Insert into Supabase
    const { data, error } = await supabase.from("song_history").insert(songData).select();

    if (error) {
      // If we got a unique constraint error, let's update instead
      if (error.code === "23505") {
        const today = new Date().toISOString().split("T")[0];
        const tomorrow = new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split("T")[0];

        const { data: updateData, error: updateError } = await supabase
          .from("song_history")
          .update({
            song_id: song.id,
            song_name: song.name,
            artist_name: songData.artist_name,
            album_name: song.album.name,
            album_image_url: songData.album_image_url,
            popularity: song.popularity,
            external_url: songData.external_url,
          })
          .eq("user_id", userId)
          .gte("revealed_at", today)
          .lt("revealed_at", tomorrow)
          .select();

        if (updateError) {
          throw updateError;
        }

        return { success: true, data: updateData };
      } else {
        throw error;
      }
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error };
  }
}

// Get song history for a user
export async function getSongHistory(userId, month, year) {
  try {
    // Create date range for the given month
    const startDate = new Date(year, month, 1).toISOString();
    const endDate = new Date(year, month + 1, 0).toISOString();
    
    // Query supabase for song history
    const { data, error } = await supabase
      .from('song_history')
      .select('*')
      .eq('user_id', userId)
      .gte('revealed_at', startDate)
      .lte('revealed_at', endDate)
      .order('revealed_at', { ascending: true });

    if (error) {
      throw error;
    }

    // Format the data as an object keyed by date for easier access
    const formattedHistory = {};
    data?.forEach(song => {
      const dateKey = new Date(song.revealed_at).toISOString().split('T')[0];
      formattedHistory[dateKey] = {
        id: song.song_id,
        name: song.song_name,
        artists: [{ name: song.artist_name }],
        album: {
          name: song.album_name,
          images: [{ url: song.album_image_url }],
          id: song.song_id?.split(':').pop() // Extract album ID from song ID if needed
        },
        external_urls: {
          spotify: song.external_url
        },
        popularity: song.popularity
      };
    });

    return formattedHistory;
  } catch (error) {
    return {};
  }
}

// Check if the user already has a song for today
export async function checkTodaySong(userId) {
  try {
    // Get today's date range
    const today = new Date().toISOString().split("T")[0];
    const tomorrow = new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split("T")[0];

    // Query Supabase for today's song
    const { data, error } = await supabase
      .from("song_history")
      .select("*")
      .eq("user_id", userId)
      .gte("revealed_at", today)
      .lt("revealed_at", tomorrow)
      .single();

    if (error) {
      // PGRST116 means no rows returned, which is fine
      if (error.code === "PGRST116") {
        return { exists: false, song: null };
      }

      throw error;
    }

    // Format the song data
    if (data) {
      const formattedSong = {
        id: data.song_id,
        name: data.song_name,
        artists: [{ name: data.artist_name }],
        album: {
          name: data.album_name,
          images: [{ url: data.album_image_url }],
          id: data.song_id?.split(":")[2] || data.song_id, // Extract album ID
        },
        external_urls: {
          spotify: data.external_url,
        },
        popularity: data.popularity,
        duration_ms: 0, // We don't store this, so use a default
      };

      return { exists: true, song: formattedSong };
    }

    return { exists: false, song: null };
  } catch (error) {
    return { exists: false, song: null, error };
  }
}

// Get available months with song counts for the user
export async function getAvailableMonths(userId) {
  try {
    // Get today's date for comparison
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1; // 1-based

    // Get all songs for this user
    const { data, error } = await supabase
      .from("song_history")
      .select("revealed_at, song_name") // Only select necessary columns
      .eq("user_id", userId);

    if (error) {
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Group by year and month
    const monthCounts = data.reduce((acc, song) => {
      // Parse the revealed_at date
      const date = new Date(song.revealed_at);
      const year = date.getFullYear();
      const month = date.getMonth() + 1; // 1-12 (January is 1)

      const key = `${year}-${month}`;

      if (!acc[key]) {
        acc[key] = {
          year,
          month,
          songCount: 0,
        };
      }

      acc[key].songCount++;
      return acc;
    }, {});

    // Convert to array and sort by date (newest first)
    const result = Object.values(monthCounts).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });

    return result;
  } catch (error) {
    return [];
  }
} 