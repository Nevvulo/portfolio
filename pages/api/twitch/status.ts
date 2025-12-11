import type { NextApiRequest, NextApiResponse } from 'next';
import { checkTwitchLiveStatus } from '../../../utils/twitch';

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const isLive = await checkTwitchLiveStatus();

    res.status(200).json({
      isLive,
      timestamp: new Date().toISOString(),
      username: 'Nevvulo',
    });
  } catch (error) {
    console.error('Error in Twitch status endpoint:', error);
    res.status(500).json({
      error: 'Failed to check Twitch status',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
