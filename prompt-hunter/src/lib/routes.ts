export const ROUTES = {
  ROOT: '/',
  PLAY: (roleId = ':roleId') => `/play/${roleId}`,
  PACK: '/pack',
} as const;


