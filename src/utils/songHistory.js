import { supabase } from './supabase';

// Save a revealed song to the user's history
export async function saveSongToHistory(userId, song) {
  try {
    console.log('Saving song to history for user:', userId);
    console.log('Song data:', { id: song.id, name: song.name });
    
    // Format the song data for storage
    const songData = {
      user_id: userId,
      song_id: song.id,
      song_name: song.name,
      artist_name: song.artists.map(artist => artist.name).join(', '),
      album_name: song.album.name,
      album_image_url: song.album.images[0]?.url || null,
      popularity: song.popularity || null,
      external_url: song.external_urls?.spotify || null,
      // Use current date as revealed_at (will use server timezone)
      revealed_at: new Date().toISOString(),
    };

    console.log('Formatted song data to save:', songData);

    // Insert into Supabase
    const { data, error } = await supabase
      .from('song_history')
      .insert(songData)
      .select();

    if (error) {
      console.error('Error inserting song history:', error);
      
      // If we got a unique constraint error, let's update instead
      if (error.code === '23505') {
        console.log('Song already exists for today, updating instead');
        
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0];
        
        console.log(`Updating song for date range: ${today} to ${tomorrow}`);
        
        const { data: updateData, error: updateError } = await supabase
          .from('song_history')
          .update({
            song_id: song.id,
            song_name: song.name,
            artist_name: songData.artist_name,
            album_name: song.album.name,
            album_image_url: songData.album_image_url,
            popularity: song.popularity,
            external_url: songData.external_url,
          })
          .eq('user_id', userId)
          .gte('revealed_at', today)
          .lt('revealed_at', tomorrow)
          .select();
        
        if (updateError) {
          console.error('Error updating song history:', updateError);
          throw updateError;
        }
        
        console.log('Successfully updated song:', updateData);
        return { success: true, data: updateData };
      } else {
        throw error;
      }
    }
    
    console.log('Successfully saved song to history:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error saving song to history:', error);
    return { success: false, error };
  }
}

// Get song history for a user
export async function getSongHistory(userId, month, year) {
  try {
    console.log(`Fetching song history for user ${userId}, month ${month}, year ${year}`);
    
    // Create date range for the given month
    const startDate = new Date(year, month, 1).toISOString();
    const endDate = new Date(year, month + 1, 0).toISOString();
    
    console.log(`Date range: ${startDate} to ${endDate}`);

    // Query supabase for song history
    const { data, error } = await supabase
      .from('song_history')
      .select('*')
      .eq('user_id', userId)
      .gte('revealed_at', startDate)
      .lte('revealed_at', endDate)
      .order('revealed_at', { ascending: true });

    if (error) {
      console.error('Error fetching song history:', error);
      throw error;
    }

    console.log(`Found ${data?.length || 0} songs in history for this month`);

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
          id: song.song_id.split(':').pop() // Extract album ID from song ID if needed
        },
        external_urls: {
          spotify: song.external_url
        },
        popularity: song.popularity
      };
    });

    return formattedHistory;
  } catch (error) {
    console.error('Error fetching song history:', error);
    return {};
  }
}

// Check if the user already has a song for today
export async function checkTodaySong(userId) {
  try {
    console.log("Checking if user has a song for today, userId:", userId);

    // Get today's date range
    const today = new Date().toISOString().split("T")[0];
    const tomorrow = new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split("T")[0];

    console.log(`Checking date range: ${today} to ${tomorrow}`);

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
        console.log("No song found for today");
        return { exists: false, song: null };
      }

      console.error("Error checking today's song:", error);
      throw error;
    }

    // Format the song data
    if (data) {
      console.log("Found today's song:", data);

      const formattedSong = {
        id: data.song_id,
        name: data.song_name,
        artists: [{ name: data.artist_name }],
        album: {
          name: data.album_name,
          images: [{ url: data.album_image_url }],
          id: data.song_id.split(":")[2] || data.song_id, // Extract album ID
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
    console.error("Error in checkTodaySong:", error);
    return { exists: false, song: null, error };
  }
}

// Get available months with song counts for the user
export async function getAvailableMonths(userId) {
  try {
    console.log("Fetching available months for user:", userId);

    // Get today's date for comparison
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1; // 1-based

    // Get all songs for this user
    const { data, error } = await supabase
      .from("song_history")
      .select("*") // Select all columns to ensure we get complete date info
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching song dates:", error);
      return [];
    }

    console.log(`Found ${data?.length || 0} total songs in history`);

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

      // Debug each song's date
      console.log(`Song "${song.song_name}" revealed at ${song.revealed_at}, parsed as Year: ${year}, Month: ${month}`);

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

    console.log("Month counts:", monthCounts);

    // Convert to array and sort by date (newest first)
    const result = Object.values(monthCounts).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });

    console.log("Processed month data:", result);

    return result;
  } catch (error) {
    console.error("Error in getAvailableMonths:", error);
    return [];
  }
} 