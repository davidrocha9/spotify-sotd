import { supabase } from "./supabase";
import { v4 as uuidv4 } from "uuid";

/**
 * Creates a user in Supabase or retrieves existing user
 */
export async function createOrGetUser(spotifyUser) {
  if (!spotifyUser?.id) {
    console.error("No Spotify user ID provided");
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
      console.error("Error looking up user:", lookupError);
      throw lookupError;
    }

    // If user exists, return their UUID
    if (existingUser) {
      console.log(`Found existing user with ID ${existingUser.id} for Spotify ID ${spotifyUser.id}`);
      return existingUser;
    }

    // User doesn't exist, create a new one
    console.log(`Creating new user for Spotify ID ${spotifyUser.id}`);
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
      console.error("Error creating user:", createError);
      throw createError;
    }

    console.log(`Created new user with UUID ${newUuid}`);
    return newUser;
  } catch (error) {
    console.error("Error in createOrGetUser:", error);
    return null;
  }
}
