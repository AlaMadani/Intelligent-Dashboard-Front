export const ROUTE_NAMES = {
  LOGIN: 'LoginPage',
  SIGN_UP: 'SignUpPage',
  VERIFY_EMAIL: 'VerifyEmailPage',
  FORGOT_PASSWORD: 'ForgotPasswordPage',
  RESET_PASSWORD_CODE: 'ResetPasswordCodePage',
  RESET_PASSWORD: 'ResetPasswordPage',
  SECURITY_OVERVIEW: 'SecurityOverviewPage',
  ALERTS: 'AlertsPage',
  ALERT_INVESTIGATION: 'AlertInvestigationPage',
  USER_360: 'User360Page',
  USER_360_DETAIL: 'User360DetailPage',
  CHURN: 'ChurnPage',
  FORECAST: 'ForecastPage',
  RUNTIME_HEALTH: 'RuntimeHealthPage',
  ACCOUNT: 'AccountPage',
} as const;

export type RouteName = (typeof ROUTE_NAMES)[keyof typeof ROUTE_NAMES];
