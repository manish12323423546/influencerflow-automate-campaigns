interface InstagramPost {
  id: string;
  shortCode: string;
  caption: string;
  ownerUsername: string;
  ownerFullName: string;
  likesCount: number;
  commentsCount: number;
  timestamp: string;
  displayUrl: string;
  hashtags: string[];
}

interface InstagramProfile {
  username: string;
  fullName: string;
  biography: string;
  followersCount: number;
  followingCount: number;
  isVerified: boolean;
  profilePicUrl: string;
  postsCount: number;
  engagementRate: number;
  recentPosts: InstagramPost[];
}

class InstagramService {
  private readonly hashtagScraperEndpoint: string;
  private readonly profileScraperEndpoint: string;
  private readonly apiToken: string;

  constructor() {
    // Use environment variable or fallback to provided Apify API key
    this.apiToken = process.env.APIFY_API_TOKEN || 'apify_api_i4tc92BQVjawsjqDLRgsfdk7jLfAq12F6BR3';
    // Use synchronous endpoints with token in query string
    this.hashtagScraperEndpoint = `https://api.apify.com/v2/acts/apify~instagram-hashtag-scraper/run-sync-get-dataset-items?token=${this.apiToken}`;
    this.profileScraperEndpoint = `https://api.apify.com/v2/acts/apify~instagram-profile-scraper/run-sync-get-dataset-items?token=${this.apiToken}`;
  }

  private async waitForActorRun(runId: string): Promise<any> {
    const maxAttempts = 30;
    const delayMs = 2000;
    let attempts = 0;

    while (attempts < maxAttempts) {
      console.log(`InstagramService.waitForActorRun: checking run ${runId}, attempt ${attempts + 1}`);
      const response = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${this.apiToken}`);
      const data = await response.json();
      console.log(`InstagramService.waitForActorRun: status for run ${runId}:`, data.status);

      if (data.status === 'SUCCEEDED') {
        console.log(`InstagramService.waitForActorRun: run ${runId} succeeded, fetching dataset items`);
        // Get the dataset items
        const itemsResponse = await fetch(`https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${this.apiToken}`);
        return await itemsResponse.json();
      }

      if (data.status === 'FAILED' || data.status === 'ABORTED') {
        throw new Error(`Actor run failed with status: ${data.status}`);
      }

      await new Promise(resolve => setTimeout(resolve, delayMs));
      attempts++;
    }

    throw new Error('Timeout waiting for actor run to complete');
  }

  async searchHashtags(hashtags: string[]): Promise<InstagramPost[]> {
    // Prepare actor input
    const input = {
      hashtags: hashtags.map(tag => tag.replace('#', '')),
      resultsLimit: 50,
      searchType: 'hashtag',
      searchLimit: 1,
    };

    // First try synchronous endpoint
    try {
      console.log('InstagramService.searchHashtags: calling sync endpoint');
      const syncResponse = await fetch(this.hashtagScraperEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!syncResponse.ok) {
        const errorBody = await syncResponse.text();
        throw new Error(`Sync endpoint error ${syncResponse.status}: ${errorBody}`);
      }
      const syncData = await syncResponse.json();
      console.log('InstagramService.searchHashtags: sync response', syncData);
      if (Array.isArray(syncData)) {
        return syncData.map((post: any) => ({
          id: post.id,
          shortCode: post.shortCode,
          caption: post.caption,
          ownerUsername: post.ownerUsername,
          ownerFullName: post.ownerFullName,
          likesCount: post.likesCount,
          commentsCount: post.commentsCount,
          timestamp: post.timestamp,
          displayUrl: post.displayUrl,
          hashtags: post.hashtags,
        }));
      }
      throw new Error('Sync endpoint returned non-array data');
    } catch (syncErr) {
      console.warn('Sync hashtag scraper failed, falling back to async:', syncErr);
      // Fallback to async run & poll
      const response = await fetch(`https://api.apify.com/v2/acts/apify~instagram-hashtag-scraper/runs?token=${this.apiToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const { data: runData } = await response.json();
      const posts = await this.waitForActorRun(runData.id);
      return posts.map((post: any) => ({
        id: post.id,
        shortCode: post.shortCode,
        caption: post.caption,
        ownerUsername: post.ownerUsername,
        ownerFullName: post.ownerFullName,
        likesCount: post.likesCount,
        commentsCount: post.commentsCount,
        timestamp: post.timestamp,
        displayUrl: post.displayUrl,
        hashtags: post.hashtags,
      }));
    }
  }

  async getProfile(username: string): Promise<InstagramProfile> {
    // Prepare actor input
    const input = { usernames: [username], resultsLimit: 1 };

    // First try synchronous endpoint
    try {
      console.log('InstagramService.getProfile: calling sync endpoint');
      const syncResponse = await fetch(this.profileScraperEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!syncResponse.ok) {
        const errorBody = await syncResponse.text();
        throw new Error(`Sync endpoint error ${syncResponse.status}: ${errorBody}`);
      }
      const syncData = await syncResponse.json();
      console.log('InstagramService.getProfile: sync response', syncData);
      if (Array.isArray(syncData) && syncData.length > 0) {
        const profile = syncData[0];
        const engagementRate = profile.latestPosts.reduce((sum: number, post: any) => {
          const engagement = (post.likesCount + post.commentsCount) / profile.followersCount * 100;
          return sum + engagement;
        }, 0) / profile.latestPosts.length;
        return {
          username: profile.username,
          fullName: profile.fullName,
          biography: profile.biography,
          followersCount: profile.followersCount,
          followingCount: profile.followingCount,
          isVerified: profile.isVerified,
          profilePicUrl: profile.profilePicUrl,
          postsCount: profile.postsCount,
          engagementRate,
          recentPosts: profile.latestPosts.map((post: any) => ({
            id: post.id,
            shortCode: post.shortCode,
            caption: post.caption,
            ownerUsername: post.ownerUsername,
            ownerFullName: post.ownerFullName,
            likesCount: post.likesCount,
            commentsCount: post.commentsCount,
            timestamp: post.timestamp,
            displayUrl: post.displayUrl,
            hashtags: post.hashtags,
          })),
        };
      }
      throw new Error('Sync endpoint returned no profile');
    } catch (syncErr) {
      console.warn('Sync profile scraper failed, falling back to async:', syncErr);
      // Fallback to async run & poll
      const response = await fetch(`https://api.apify.com/v2/acts/apify~instagram-profile-scraper/runs?token=${this.apiToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const { data: runData } = await response.json();
      const [profile] = await this.waitForActorRun(runData.id);
      const engagementRate = profile.latestPosts.reduce((sum: number, post: any) => {
        const engagement = (post.likesCount + post.commentsCount) / profile.followersCount * 100;
        return sum + engagement;
      }, 0) / profile.latestPosts.length;
      return {
        username: profile.username,
        fullName: profile.fullName,
        biography: profile.biography,
        followersCount: profile.followersCount,
        followingCount: profile.followingCount,
        isVerified: profile.isVerified,
        profilePicUrl: profile.profilePicUrl,
        postsCount: profile.postsCount,
        engagementRate,
        recentPosts: profile.latestPosts.map((post: any) => ({
          id: post.id,
          shortCode: post.shortCode,
          caption: post.caption,
          ownerUsername: post.ownerUsername,
          ownerFullName: post.ownerFullName,
          likesCount: post.likesCount,
          commentsCount: post.commentsCount,
          timestamp: post.timestamp,
          displayUrl: post.displayUrl,
          hashtags: post.hashtags,
        })),
      };
    }
  }
}

export const instagramService = new InstagramService(); 