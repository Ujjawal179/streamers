const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';

export const API_ROUTES = {
  AUTH: {
    LOGIN: `${BASE_URL}/login`,
    REGISTER: `${BASE_URL}/register`,
  },
  YOUTUBER: {
    UPDATE: (id: string) => `${BASE_URL}/youtubers/${id}`,
    GET_USERNAME: (id: string) => `${BASE_URL}/youtubers/${id}/username`,
    GET_DETAILS: (id: string) => `${BASE_URL}/youtubers/${id}`,
    UPDATE_SETTINGS: (id: string) => `${BASE_URL}/youtubers/${id}/settings`,
    GET_CAMPAIGNS: (id: string) => `${BASE_URL}/youtubers/${id}/campaigns`,
  },
  COMPANY: {
    CREATE_CAMPAIGN: `${BASE_URL}/companies/campaigns`,
    GET_CAMPAIGNS: (id: string) => `${BASE_URL}/companies/${id}/campaigns`,
    UPDATE_CAMPAIGN: (id: string) => `${BASE_URL}/companies/campaigns/${id}`,
  },
  MEDIA: {
    UPLOAD_CAMPAIGN: (companyId: string) => `${BASE_URL}/media/campaign/${companyId}`,
    UPLOAD_DIRECT: (youtuberId: string) => `${BASE_URL}/media/direct/${youtuberId}`,
    GET_NEXT_VIDEO: (youtuberId: string) => `${BASE_URL}/media/queue/${youtuberId}/next`,
    GET_VIDEO: (youtuberId: string) => `${BASE_URL}/media/video/${youtuberId}`,
    GET_SIGNATURE: `${BASE_URL}/media/get-signature`,
  },
  CAMPAIGN: {
    GET_ALL: `${BASE_URL}/campaigns`,
    GET_ONE: (id: string) => `${BASE_URL}/campaigns/${id}`,
    UPDATE: (id: string) => `${BASE_URL}/campaigns/${id}`,
    DELETE: (id: string) => `${BASE_URL}/campaigns/${id}`,
  },
  PAYMENT: {
    CREATE: `${BASE_URL}/payments/create`,
    VERIFY: `${BASE_URL}/payments/verify`,
    GET_YOUTUBER_PAYMENTS: (id: string) => `${BASE_URL}/payments/youtuber/${id}`,
    GET_COMPANY_PAYMENTS: (id: string) => `${BASE_URL}/payments/company/${id}`,
  },
  DONATION: {
    CREATE: `${BASE_URL}/donations`,
    GET_ALL: (youtuberId: string) => `${BASE_URL}/donations/youtuber/${youtuberId}`,
    UPDATE_STATUS: (id: string) => `${BASE_URL}/donations/${id}/status`,
  },
};
