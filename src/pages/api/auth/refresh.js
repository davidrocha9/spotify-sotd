import { getToken } from "next-auth/jwt"
import { refreshAccessToken } from "../../../utils/auth"

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end()
  }

  try {
    const token = await getToken({ req })
    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const refreshedToken = await refreshAccessToken(token)
    return res.status(200).json({ accessToken: refreshedToken })
  } catch (error) {
    console.error('Error in token refresh API:', error)
    return res.status(500).json({ error: 'Failed to refresh token' })
  }
} 