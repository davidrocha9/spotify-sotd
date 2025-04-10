import { supabase } from "./supabase";
import { v4 as uuidv4 } from "uuid";

/**
 * Creates a user in Supabase or retrieves existing user
 */
export async function createOrGetUser(spotifyUser) {
  if (!spotifyUser?.id) {
    return null;
  }

  try {
    // Check if user already exists in Supabase
    const { data: existingUser, error: lookupError } = await supabase
      .from("users")
      .select("*")
      .eq("spotify_id", spotifyUser.id)
      .single();

    if (lookupError && lookupError.code !== "PGRST116") {
      throw lookupError;
    }

    // If user exists, return their UUID
    if (existingUser) {
      return existingUser;
    }

    // User doesn't exist, create a new one
    const newUuid = uuidv4();

    const { data: newUser, error: createError } = await supabase
      .from("users")
      .insert({
        id: newUuid,
        spotify_id: spotifyUser.id,
        email: spotifyUser.email,
        display_name: spotifyUser.name,
        avatar_url: spotifyUser.image,
      })
      .select()
      .single();

    if (createError) {
      throw createError;
    }

    return newUser;
  } catch (error) {
    return null;
  }
}
