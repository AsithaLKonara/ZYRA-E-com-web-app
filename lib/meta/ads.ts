import { config } from '../config'
import { logger } from '../logger'

// Facebook Marketing API Types
export interface Campaign {
  id: string
  name: string
  objective: 'OUTCOME_TRAFFIC' | 'OUTCOME_ENGAGEMENT' | 'OUTCOME_AWARENESS' | 'OUTCOME_LEADS' | 'OUTCOME_SALES'
  status: 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED'
  created_time: string
  updated_time: string
}

export interface AdSet {
  id: string
  name: string
  campaign_id: string
  status: 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED'
  daily_budget?: number
  lifetime_budget?: number
  billing_event: 'IMPRESSIONS' | 'CLICKS' | 'ACTIONS'
  optimization_goal: 'REACH' | 'IMPRESSIONS' | 'CLICKS' | 'LANDING_PAGE_VIEWS' | 'CONVERSIONS'
  targeting: {
    geo_locations: {
      countries: string[]
    }
    age_min: number
    age_max: number
    genders: number[]
    interests?: Array<{
      id: string
      name: string
    }>
  }
  created_time: string
  updated_time: string
}

export interface Ad {
  id: string
  name: string
  adset_id: string
  status: 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED'
  creative: {
    object_story_id?: string
    object_story_spec?: {
      page_id: string
      link_data: {
        link: string
        message: string
        image_hash: string
      }
    }
  }
  created_time: string
  updated_time: string
}

export interface CampaignRequest {
  name: string
  objective: Campaign['objective']
  status?: Campaign['status']
  special_ad_categories?: string[]
}

export interface AdSetRequest {
  name: string
  campaign_id: string
  status?: AdSet['status']
  daily_budget?: number
  lifetime_budget?: number
  billing_event: AdSet['billing_event']
  optimization_goal: AdSet['optimization_goal']
  targeting: AdSet['targeting']
  promoted_object?: {
    page_id: string
  }
}

export interface AdRequest {
  name: string
  adset_id: string
  status?: Ad['status']
  creative: Ad['creative']
}

// Facebook Marketing API Client
export class FacebookAdsAPI {
  private accessToken: string
  private adAccountId: string
  private baseURL = 'https://graph.facebook.com/v18.0'

  constructor(accessToken: string, adAccountId: string) {
    this.accessToken = accessToken
    this.adAccountId = adAccountId
  }

  // Create a campaign
  async createCampaign(request: CampaignRequest): Promise<Campaign> {
    try {
      const params = new URLSearchParams({
        access_token: this.accessToken,
        name: request.name,
        objective: request.objective,
        ...(request.status && { status: request.status }),
        ...(request.special_ad_categories && {
          special_ad_categories: JSON.stringify(request.special_ad_categories)
        })
      })

      const response = await fetch(`${this.baseURL}/act_${this.adAccountId}/campaigns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Facebook Ads API Error: ${error.error?.message || 'Unknown error'}`)
      }

      const data = await response.json()
      logger.info('Facebook campaign created', { campaignId: data.id })
      
      return data
    } catch (error) {
      logger.error('Failed to create Facebook campaign:', {}, error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  // Create an ad set
  async createAdSet(request: AdSetRequest): Promise<AdSet> {
    try {
      const params = new URLSearchParams({
        access_token: this.accessToken,
        name: request.name,
        campaign_id: request.campaign_id,
        billing_event: request.billing_event,
        optimization_goal: request.optimization_goal,
        targeting: JSON.stringify(request.targeting),
        ...(request.status && { status: request.status }),
        ...(request.daily_budget && { daily_budget: request.daily_budget.toString() }),
        ...(request.lifetime_budget && { lifetime_budget: request.lifetime_budget.toString() }),
        ...(request.promoted_object && { promoted_object: JSON.stringify(request.promoted_object) })
      })

      const response = await fetch(`${this.baseURL}/act_${this.adAccountId}/adsets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Facebook Ads API Error: ${error.error?.message || 'Unknown error'}`)
      }

      const data = await response.json()
      logger.info('Facebook ad set created', { adSetId: data.id })
      
      return data
    } catch (error) {
      logger.error('Failed to create Facebook ad set:', {}, error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  // Create an ad
  async createAd(request: AdRequest): Promise<Ad> {
    try {
      const params = new URLSearchParams({
        access_token: this.accessToken,
        name: request.name,
        adset_id: request.adset_id,
        creative: JSON.stringify(request.creative),
        ...(request.status && { status: request.status })
      })

      const response = await fetch(`${this.baseURL}/act_${this.adAccountId}/ads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Facebook Ads API Error: ${error.error?.message || 'Unknown error'}`)
      }

      const data = await response.json()
      logger.info('Facebook ad created', { adId: data.id })
      
      return data
    } catch (error) {
      logger.error('Failed to create Facebook ad:', {}, error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  // Get campaign details
  async getCampaign(campaignId: string): Promise<Campaign> {
    try {
      const response = await fetch(
        `${this.baseURL}/${campaignId}?fields=id,name,objective,status,created_time,updated_time&access_token=${this.accessToken}`
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Facebook Ads API Error: ${error.error?.message || 'Unknown error'}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      logger.error('Failed to get Facebook campaign:', {}, error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  // Get ad set details
  async getAdSet(adSetId: string): Promise<AdSet> {
    try {
      const response = await fetch(
        `${this.baseURL}/${adSetId}?fields=id,name,campaign_id,status,daily_budget,lifetime_budget,billing_event,optimization_goal,targeting,created_time,updated_time&access_token=${this.accessToken}`
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Facebook Ads API Error: ${error.error?.message || 'Unknown error'}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      logger.error('Failed to get Facebook ad set:', {}, error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  // Get ad details
  async getAd(adId: string): Promise<Ad> {
    try {
      const response = await fetch(
        `${this.baseURL}/${adId}?fields=id,name,adset_id,status,creative,created_time,updated_time&access_token=${this.accessToken}`
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Facebook Ads API Error: ${error.error?.message || 'Unknown error'}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      logger.error('Failed to get Facebook ad:', {}, error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  // Complete boost flow: Campaign -> AdSet -> Ad
  async boostPost(
    postId: string,
    budget: number,
    duration: number,
    targeting: AdSet['targeting']
  ): Promise<{ campaign: Campaign; adSet: AdSet; ad: Ad }> {
    try {
      logger.info('Starting Facebook boost flow', { postId, budget, duration })

      // Step 1: Create campaign
      const campaign = await this.createCampaign({
        name: `Boost Post ${postId}`,
        objective: 'OUTCOME_ENGAGEMENT',
        status: 'ACTIVE'
      })

      // Step 2: Create ad set
      const adSet = await this.createAdSet({
        name: `AdSet for ${postId}`,
        campaign_id: campaign.id,
        status: 'ACTIVE',
        daily_budget: budget,
        billing_event: 'IMPRESSIONS',
        optimization_goal: 'REACH',
        targeting,
        promoted_object: {
          page_id: process.env.FACEBOOK_PAGE_ID || 'placeholder_page_id'
        }
      })

      // Step 3: Create ad
      const ad = await this.createAd({
        name: `Ad for ${postId}`,
        adset_id: adSet.id,
        status: 'ACTIVE',
        creative: {
          object_story_id: postId
        }
      })

      logger.info('Facebook boost completed successfully', {
        campaignId: campaign.id,
        adSetId: adSet.id,
        adId: ad.id
      })

      return { campaign, adSet, ad }

    } catch (error) {
      logger.error('Facebook boost failed:', {}, error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  // Get ad insights
  async getAdInsights(adId: string, dateRange: { since: string; until: string }) {
    try {
      const params = new URLSearchParams({
        access_token: this.accessToken,
        fields: 'impressions,clicks,spend,reach,frequency,cpc,cpm,cpp',
        time_range: JSON.stringify(dateRange)
      })

      const response = await fetch(
        `${this.baseURL}/${adId}/insights?${params}`
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Facebook Ads API Error: ${error.error?.message || 'Unknown error'}`)
      }

      const data = await response.json()
      return data.data?.[0] || {}
    } catch (error) {
      logger.error('Failed to get Facebook ad insights:', {}, error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }
}

// Factory function to create Facebook Ads API instance
export function createFacebookAdsAPI(accessToken: string, adAccountId: string): FacebookAdsAPI {
  return new FacebookAdsAPI(accessToken, adAccountId)
}

// Default instance using config
export const facebookAdsAPI = createFacebookAdsAPI(
  process.env.FACEBOOK_ACCESS_TOKEN || '',
  process.env.FACEBOOK_AD_ACCOUNT_ID || ''
)


