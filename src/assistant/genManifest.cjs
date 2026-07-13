/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
/* eslint-enable @typescript-eslint/no-require-imports */

// This is a generated file from dashboardAssistantManifest.ts
// Run: node genManifest.cjs to refresh dashboardAssistantManifest.json

const ROUTE_NAMES = {
  SECURITY_OVERVIEW: 'SecurityOverviewPage',
  ALERTS: 'AlertsPage',
  ALERT_INVESTIGATION: 'AlertInvestigationPage',
  USER_360: 'User360Page',
  USER_360_DETAIL: 'User360DetailPage',
  CHURN: 'ChurnPage',
  FORECAST: 'ForecastPage',
  RUNTIME_HEALTH: 'RuntimeHealthPage',
  ACCOUNT: 'AccountPage',
};

const manifest = {
  version: '1.0.0',
  updatedAt: '2026-07-03',
  routes: [
    {
      id: 'security-overview', routeName: ROUTE_NAMES.SECURITY_OVERVIEW, path: '/security-overview', label: 'Security Overview',
      description: 'Global security dashboard showing anomaly activity, alert activity, pipeline metrics, risk cards, top anomaly types, top triggered rules, and overview summaries.',
      synonyms: ['overview', 'security overview', 'main dashboard', 'home dashboard', 'overview page', 'main page'],
      requiresParams: [], actionsSupported: ['NAVIGATE'],
    },
    {
      id: 'alerts', routeName: ROUTE_NAMES.ALERTS, path: '/alerts', label: 'Alerts',
      description: 'Live alerts list with filters, pagination, risk levels, and anomaly type breakdown.',
      synonyms: ['alerts', 'anomalies', 'alert list', 'anomaly list', 'all alerts', 'alert page'],
      requiresParams: [], actionsSupported: ['NAVIGATE'],
    },
    {
      id: 'alert-investigation', routeName: ROUTE_NAMES.ALERT_INVESTIGATION, path: '/alerts/:eventId', label: 'Alert Investigation',
      description: 'Deep alert investigation view with event metadata, model scores, sequence evidence, anomaly attribution, session lifecycle, next event prediction, and user business context.',
      synonyms: ['alert investigation', 'investigation', 'investigate', 'alert detail', 'event detail'],
      requiresParams: ['eventId'], actionsSupported: ['NAVIGATE'],
    },
    {
      id: 'user360', routeName: ROUTE_NAMES.USER_360, path: '/users', label: 'User 360 Search',
      description: 'User 360 search page where you can look up users by insured ID and view their profiles.',
      synonyms: ['user 360', 'user360', 'user search', 'users list', 'user lookup'],
      requiresParams: [], actionsSupported: ['NAVIGATE'],
    },
    {
      id: 'user-360', routeName: ROUTE_NAMES.USER_360_DETAIL, path: '/users/:insuredId/360', label: 'User 360 Detail',
      description: 'User 360 detail view showing churn probability, risk scores, persona, baseline, next event prediction, recent sessions, risk timeline, and user alerts.',
      synonyms: ['user 360 detail', 'user profile', 'user detail', 'user 360 view'],
      requiresParams: ['insuredId'], actionsSupported: ['NAVIGATE'],
    },
    {
      id: 'churn', routeName: ROUTE_NAMES.CHURN, path: '/churn', label: 'Churn',
      description: 'Churn risk dashboard showing churn probability distribution, high-risk users table, and risk filtering.',
      synonyms: ['churn', 'churn page', 'user churn', 'abandon', 'users leaving'],
      requiresParams: [], actionsSupported: ['NAVIGATE'],
    },
    {
      id: 'forecast', routeName: ROUTE_NAMES.FORECAST, path: '/forecast', label: 'Forecast',
      description: 'Forecast dashboard with predicted total events, anomaly rate, expected alert volume, and historical charts.',
      synonyms: ['forecast', 'forecast page', 'prediction', 'predictions', 'future events'],
      requiresParams: [], actionsSupported: ['NAVIGATE'],
    },
    {
      id: 'runtime-health', routeName: ROUTE_NAMES.RUNTIME_HEALTH, path: '/runtime', label: 'Runtime Health',
      description: 'Runtime health monitoring page showing overall status, model health, Kafka health, diagnostics, performance metrics, and feature flags.',
      synonyms: ['runtime health', 'runtime', 'health', 'system health', 'health section', 'monitoring'],
      requiresParams: [], actionsSupported: ['NAVIGATE'],
    },
    {
      id: 'account', routeName: ROUTE_NAMES.ACCOUNT, path: '/account', label: 'Account Settings',
      description: 'User account settings page for profile summary and password change.',
      synonyms: ['account', 'account settings', 'my account', 'settings', 'profile'],
      requiresParams: [], actionsSupported: ['NAVIGATE'],
    },
  ],

  elements: [
    // Navigation sidebar
    { id: 'nav-security-overview', routeId: 'security-overview', routeName: ROUTE_NAMES.SECURITY_OVERVIEW, type: 'navigation-item', label: 'Security Overview Nav', description: 'Sidebar navigation item that opens the Security Overview page.', synonyms: ['overview button', 'overview link', 'dashboard nav', 'security overview nav'], exampleUserQuestions: ['where to click to go to overview', 'show me where to click for overview', 'highlight overview navigation'], actionsSupported: ['HIGHLIGHT_ELEMENT'] },
    { id: 'nav-alerts', routeId: 'alerts', routeName: ROUTE_NAMES.ALERTS, type: 'navigation-item', label: 'Alerts Nav', description: 'Sidebar navigation item that opens the Alerts page.', synonyms: ['alerts button', 'alerts link', 'anomalies nav', 'alerts navigation'], exampleUserQuestions: ['where to click to see alerts', 'highlight alerts navigation'], actionsSupported: ['HIGHLIGHT_ELEMENT'] },
    { id: 'nav-user360', routeId: 'user360', routeName: ROUTE_NAMES.USER_360, type: 'navigation-item', label: 'User 360 Nav', description: 'Sidebar navigation item that opens the User 360 search page.', synonyms: ['user 360 button', 'user 360 link', 'user 360 nav', 'users nav'], exampleUserQuestions: ['where to click for user 360', 'highlight user 360 navigation'], actionsSupported: ['HIGHLIGHT_ELEMENT'] },
    { id: 'nav-churn', routeId: 'churn', routeName: ROUTE_NAMES.CHURN, type: 'navigation-item', label: 'Churn Nav', description: 'Sidebar navigation item that opens the Churn page.', synonyms: ['churn button', 'churn link', 'churn nav'], exampleUserQuestions: ['where to click for churn', 'highlight churn navigation'], actionsSupported: ['HIGHLIGHT_ELEMENT'] },
    { id: 'nav-forecast', routeId: 'forecast', routeName: ROUTE_NAMES.FORECAST, type: 'navigation-item', label: 'Forecast Nav', description: 'Sidebar navigation item that opens the Forecast page.', synonyms: ['forecast button', 'forecast link', 'forecast nav'], exampleUserQuestions: ['where to click for forecast', 'highlight forecast navigation'], actionsSupported: ['HIGHLIGHT_ELEMENT'] },
    { id: 'nav-runtime', routeId: 'runtime-health', routeName: ROUTE_NAMES.RUNTIME_HEALTH, type: 'navigation-item', label: 'Runtime Health Nav', description: 'Sidebar navigation item that opens the Runtime Health page.', synonyms: ['runtime button', 'runtime link', 'runtime nav', 'health nav'], exampleUserQuestions: ['where to click for runtime health', 'highlight runtime navigation'], actionsSupported: ['HIGHLIGHT_ELEMENT'] },
    // Header
    { id: 'btn-user-avatar', routeId: null, routeName: null, type: 'button', label: 'User Avatar', description: 'Avatar button in the top-right header that opens the user dropdown menu with Account Settings and Sign Out options.', synonyms: ['avatar', 'user avatar', 'profile button', 'user menu', 'account button'], exampleUserQuestions: ['where to click for account settings', 'highlight user avatar', 'show me where to access my profile'], actionsSupported: ['HIGHLIGHT_ELEMENT'] },
    { id: 'nav-account-settings', routeId: 'account', routeName: ROUTE_NAMES.ACCOUNT, type: 'navigation-item', label: 'Account Settings Menu Item', description: 'Menu item in the user avatar dropdown that navigates to the Account Settings page.', synonyms: ['account settings menu', 'account settings link'], exampleUserQuestions: ['where is account settings in the menu'], actionsSupported: ['HIGHLIGHT_ELEMENT'] },
    // Security Overview
    { id: 'overview-refresh-button', routeId: 'security-overview', routeName: ROUTE_NAMES.SECURITY_OVERVIEW, type: 'button', label: 'Refresh Overview', description: 'Button that refreshes all overview metrics and page data.', synonyms: ['refresh overview', 'overview refresh', 'reload overview', 'update overview data', 'refresh data', 'refresh the data', 'refresh button', 'the refresh button'], exampleUserQuestions: ['where to click here to refresh overview data', 'show me the refresh button on overview', 'highlight the refresh button on overview'], actionsSupported: ['HIGHLIGHT_ELEMENT', 'CLICK_ELEMENT'] },
    { id: 'overview-kpi-total-events', routeId: 'security-overview', routeName: ROUTE_NAMES.SECURITY_OVERVIEW, type: 'card', label: 'Total Events KPI', description: 'Shows the total number of events processed.', synonyms: ['total events', 'events total', 'total events today'], exampleUserQuestions: ['where should i look here to see the total events processed today', 'highlight total events today card'], actionsSupported: ['HIGHLIGHT_ELEMENT'] },
    { id: 'overview-kpi-active-users', routeId: 'security-overview', routeName: ROUTE_NAMES.SECURITY_OVERVIEW, type: 'card', label: 'Active Users KPI', description: 'Shows the number of active users.', synonyms: ['active users', 'users active'], exampleUserQuestions: ['highlight active users card', 'show me active users'], actionsSupported: ['HIGHLIGHT_ELEMENT'] },
    { id: 'overview-kpi-anomaly-rate', routeId: 'security-overview', routeName: ROUTE_NAMES.SECURITY_OVERVIEW, type: 'card', label: 'Anomaly Rate KPI', description: 'Shows the current anomaly detection rate.', synonyms: ['anomaly rate', 'anomaly percentage'], exampleUserQuestions: ['highlight anomaly rate card', 'show anomaly rate'], actionsSupported: ['HIGHLIGHT_ELEMENT'] },
    { id: 'overview-kpi-critical-alerts', routeId: 'security-overview', routeName: ROUTE_NAMES.SECURITY_OVERVIEW, type: 'card', label: 'Critical Alerts KPI', description: 'Shows the count of critical alerts.', synonyms: ['critical alerts', 'critical alerts count', 'critical alert card'], exampleUserQuestions: ['highlight critical alerts card', 'where should i look to see critical alerts'], actionsSupported: ['HIGHLIGHT_ELEMENT'] },
    { id: 'overview-kpi-high-risk-alerts', routeId: 'security-overview', routeName: ROUTE_NAMES.SECURITY_OVERVIEW, type: 'card', label: 'High Risk Alerts KPI', description: 'Shows the count of high risk alerts.', synonyms: ['high risk alerts', 'high risk alert count'], exampleUserQuestions: ['highlight high risk alerts'], actionsSupported: ['HIGHLIGHT_ELEMENT'] },
    { id: 'overview-kpi-average-risk', routeId: 'security-overview', routeName: ROUTE_NAMES.SECURITY_OVERVIEW, type: 'card', label: 'Average Risk KPI', description: 'Shows the average risk score across all alerts.', synonyms: ['average risk', 'average risk score', 'mean risk'], exampleUserQuestions: ['highlight average risk card'], actionsSupported: ['HIGHLIGHT_ELEMENT'] },
    { id: 'overview-kpi-predicted-anomaly-rate', routeId: 'security-overview', routeName: ROUTE_NAMES.SECURITY_OVERVIEW, type: 'card', label: 'Predicted Anomaly Rate KPI', description: 'Shows the predicted anomaly rate from the forecast model.', synonyms: ['predicted anomaly rate', 'forecast anomaly rate'], exampleUserQuestions: ['highlight predicted anomaly rate'], actionsSupported: ['HIGHLIGHT_ELEMENT'] },
    { id: 'overview-kpi-predicted-events', routeId: 'security-overview', routeName: ROUTE_NAMES.SECURITY_OVERVIEW, type: 'card', label: 'Predicted Events KPI', description: 'Shows the predicted total events from the forecast model.', synonyms: ['predicted events', 'predicted total events', 'tomorrow predicted events', 'future events'], exampleUserQuestions: ['highlight the card that indicates the tomorrow predicted total events', 'show me predicted events'], actionsSupported: ['HIGHLIGHT_ELEMENT'] },
    { id: 'overview-kpi-expected-alert-volume', routeId: 'security-overview', routeName: ROUTE_NAMES.SECURITY_OVERVIEW, type: 'card', label: 'Expected Alert Volume KPI', description: 'Shows the expected alert volume from the forecast model.', synonyms: ['expected alert volume', 'alert volume', 'expected alerts'], exampleUserQuestions: ['highlight expected alert volume'], actionsSupported: ['HIGHLIGHT_ELEMENT'] },
    { id: 'overview-top-anomaly-types', routeId: 'security-overview', routeName: ROUTE_NAMES.SECURITY_OVERVIEW, type: 'card', label: 'Top Anomaly Types', description: 'Chart showing top anomaly types detected.', synonyms: ['top anomalies', 'top anomaly types', 'anomaly types chart', 'anomaly distribution'], exampleUserQuestions: ['highlight top anomaly types card', 'show me top anomalies', 'highlight anomaly types'], actionsSupported: ['HIGHLIGHT_ELEMENT'] },
    { id: 'overview-top-rules', routeId: 'security-overview', routeName: ROUTE_NAMES.SECURITY_OVERVIEW, type: 'card', label: 'Top Triggered Rules', description: 'Chart showing top triggered rules.', synonyms: ['top rules', 'top triggered rules', 'rules detected', 'triggered rules chart'], exampleUserQuestions: ['highlight the top rules detected', 'show me top rules', 'highlight triggered rules'], actionsSupported: ['HIGHLIGHT_ELEMENT'] },
    // Alerts
    { id: 'alerts-search-filters', routeId: 'alerts', routeName: ROUTE_NAMES.ALERTS, type: 'filter', label: 'Alerts Search Filters', description: 'Search and filter section with risk level, anomaly type, insured ID, session ID, and date range inputs.', synonyms: ['alert filters', 'alert search', 'filter alerts', 'search alerts'], exampleUserQuestions: ['where are the alert filters', 'highlight the alert search section'], actionsSupported: ['HIGHLIGHT_ELEMENT'] },
    { id: 'alerts-risk-filter', routeId: 'alerts', routeName: ROUTE_NAMES.ALERTS, type: 'filter', label: 'Alerts Risk Filter', description: 'Dropdown filter for risk level (critical, high, medium, low) on the alerts page.', synonyms: ['risk filter', 'alert risk filter', 'filter by risk'], exampleUserQuestions: ['highlight risk filter on alerts'], actionsSupported: ['HIGHLIGHT_ELEMENT', 'SET_FILTER'] },
    { id: 'alerts-table', routeId: 'alerts', routeName: ROUTE_NAMES.ALERTS, type: 'table', label: 'Alerts Table', description: 'Main alerts data table with risk level, score, anomaly type, user, and action columns.', synonyms: ['alerts table', 'alert list', 'recent alerts', 'critical alerts list', 'all alerts', 'alert table'], exampleUserQuestions: ['where should i look here to see the recent critical alerts', 'highlight the alerts table', 'show me the alert list'], actionsSupported: ['HIGHLIGHT_ELEMENT'] },
    { id: 'alerts-refresh-button', routeId: 'alerts', routeName: ROUTE_NAMES.ALERTS, type: 'button', label: 'Refresh Alerts', description: 'Button that refreshes the alerts data.', synonyms: ['refresh alerts', 'alerts refresh', 'reload alerts'], exampleUserQuestions: ['show me the alerts refresh button', 'highlight refresh button on alerts'], actionsSupported: ['HIGHLIGHT_ELEMENT', 'CLICK_ELEMENT'] },
    // Alert Investigation
    { id: 'btn-explain-ai', routeId: 'alert-investigation', routeName: ROUTE_NAMES.ALERT_INVESTIGATION, type: 'button', label: 'Explain with AI Button', description: 'Button that opens the AI explanation modal for the current alert.', synonyms: ['explain ai', 'ai explain', 'explain with ai', 'ai button', 'ai explanation'], exampleUserQuestions: ['highlight where should i click to explain an alert with AI', 'show me the explain with AI button', 'where is the AI explain button'], actionsSupported: ['HIGHLIGHT_ELEMENT'] },
    { id: 'card-event-metadata', routeId: 'alert-investigation', routeName: ROUTE_NAMES.ALERT_INVESTIGATION, type: 'card', label: 'Event Metadata', description: 'Card showing event metadata fields such as event type, timestamp, source, and user ID.', synonyms: ['event metadata', 'event info', 'metadata card'], exampleUserQuestions: ['highlight event metadata card'], actionsSupported: ['HIGHLIGHT_ELEMENT'] },
    { id: 'card-model-scores', routeId: 'alert-investigation', routeName: ROUTE_NAMES.ALERT_INVESTIGATION, type: 'card', label: 'Model Scores', description: 'Card showing anomaly detection model scores including XGBoost, LightGBM, Transformer, TCN, and rule-based scores.', synonyms: ['model scores', 'score card', 'model scores card', 'detection scores'], exampleUserQuestions: ['highlight model scores card'], actionsSupported: ['HIGHLIGHT_ELEMENT'] },
    { id: 'card-sequence-evidence', routeId: 'alert-investigation', routeName: ROUTE_NAMES.ALERT_INVESTIGATION, type: 'card', label: 'Sequence Evidence', description: 'Card showing sequence-based evidence and top surprise fields.', synonyms: ['sequence evidence', 'evidence card', 'sequence card'], exampleUserQuestions: ['highlight sequence evidence card'], actionsSupported: ['HIGHLIGHT_ELEMENT'] },
    { id: 'card-session-lifecycle', routeId: 'alert-investigation', routeName: ROUTE_NAMES.ALERT_INVESTIGATION, type: 'card', label: 'Session Lifecycle', description: 'Card showing the session lifecycle events and status.', synonyms: ['session lifecycle', 'session card', 'session events'], exampleUserQuestions: ['highlight session lifecycle card'], actionsSupported: ['HIGHLIGHT_ELEMENT'] },
    { id: 'card-anomaly-attribution', routeId: 'alert-investigation', routeName: ROUTE_NAMES.ALERT_INVESTIGATION, type: 'card', label: 'Anomaly Attribution', description: 'Card showing anomaly type attribution with triggered rules and contribution details.', synonyms: ['anomaly attribution', 'attribution card', 'anomaly type attribution', 'rule contributions'], exampleUserQuestions: ['highlight anomaly attribution card'], actionsSupported: ['HIGHLIGHT_ELEMENT'] },
    { id: 'card-next-event-prediction', routeId: 'alert-investigation', routeName: ROUTE_NAMES.ALERT_INVESTIGATION, type: 'card', label: 'Next Event Prediction', description: 'Card showing next event prediction results and deviation evidence.', synonyms: ['next event prediction', 'prediction card', 'deviation evidence', 'next event card'], exampleUserQuestions: ['highlight next event prediction card', 'show deviation evidence'], actionsSupported: ['HIGHLIGHT_ELEMENT'] },
    { id: 'card-user-business-context', routeId: 'alert-investigation', routeName: ROUTE_NAMES.ALERT_INVESTIGATION, type: 'card', label: 'User Business Context', description: 'Card showing user business context including persona, baseline, and recent sessions.', synonyms: ['user business context', 'business context', 'user context card'], exampleUserQuestions: ['highlight user business context card'], actionsSupported: ['HIGHLIGHT_ELEMENT'] },
    // User 360
    { id: 'user360-search-input', routeId: 'user360', routeName: ROUTE_NAMES.USER_360, type: 'search-input', label: 'User 360 Search Input', description: 'Text input for entering an insured ID to look up a user profile.', synonyms: ['user search', 'search input', 'insured id input', 'lookup field', 'user lookup'], exampleUserQuestions: ['where to enter insured ID', 'highlight user search input'], actionsSupported: ['HIGHLIGHT_ELEMENT'] },
    { id: 'user360-kpi-churn-probability', routeId: 'user-360', routeName: ROUTE_NAMES.USER_360_DETAIL, type: 'card', label: 'Churn Probability', description: 'Shows the churn probability and risk level for the user.', synonyms: ['churn probability', 'user churn risk'], exampleUserQuestions: ['highlight churn probability on user 360'], actionsSupported: ['HIGHLIGHT_ELEMENT'] },
    { id: 'user360-kpi-average-risk-last-30d', routeId: 'user-360', routeName: ROUTE_NAMES.USER_360_DETAIL, type: 'card', label: 'Average Risk Last 30 Days', description: 'Shows the average risk score over the last 30 days.', synonyms: ['average risk', 'risk last 30 days', '30 day risk'], exampleUserQuestions: ['highlight average risk last 30 days'], actionsSupported: ['HIGHLIGHT_ELEMENT'] },
    { id: 'user360-kpi-alert-count-last-30d', routeId: 'user-360', routeName: ROUTE_NAMES.USER_360_DETAIL, type: 'card', label: 'Alert Count Last 30 Days', description: 'Shows the total number of alerts for this user in the last 30 days.', synonyms: ['alert count', 'user alerts count', '30 day alerts'], exampleUserQuestions: ['highlight alert count'], actionsSupported: ['HIGHLIGHT_ELEMENT'] },
    { id: 'user360-kpi-critical-alert-count-last-30d', routeId: 'user-360', routeName: ROUTE_NAMES.USER_360_DETAIL, type: 'card', label: 'Critical Alert Count Last 30 Days', description: 'Shows the number of critical alerts for this user in the last 30 days.', synonyms: ['critical alert count', 'user critical alerts'], exampleUserQuestions: ['highlight critical alert count'], actionsSupported: ['HIGHLIGHT_ELEMENT'] },
    { id: 'user360-persona-card', routeId: 'user-360', routeName: ROUTE_NAMES.USER_360_DETAIL, type: 'card', label: 'User Persona', description: 'Card showing the user persona classification.', synonyms: ['persona', 'user persona', 'persona card'], exampleUserQuestions: ['highlight persona card'], actionsSupported: ['HIGHLIGHT_ELEMENT'] },
    { id: 'user360-baseline-card', routeId: 'user-360', routeName: ROUTE_NAMES.USER_360_DETAIL, type: 'card', label: 'User Baseline', description: 'Card showing user baseline data including usual country, active hours, and top API families.', synonyms: ['baseline', 'user baseline', 'baseline card', 'user behavior baseline'], exampleUserQuestions: ['highlight baseline card'], actionsSupported: ['HIGHLIGHT_ELEMENT'] },
    { id: 'user360-next-event-prediction-card', routeId: 'user-360', routeName: ROUTE_NAMES.USER_360_DETAIL, type: 'card', label: 'Next Event Prediction', description: 'Card showing predicted next event actions for this user.', synonyms: ['next event prediction', 'user prediction', 'predicted actions'], exampleUserQuestions: ['highlight next event prediction on user 360'], actionsSupported: ['HIGHLIGHT_ELEMENT'] },
    { id: 'user360-recent-sessions-card', routeId: 'user-360', routeName: ROUTE_NAMES.USER_360_DETAIL, type: 'card', label: 'Recent Sessions', description: 'Card showing the user\'s recent sessions with risk scores.', synonyms: ['recent sessions', 'user sessions', 'session history'], exampleUserQuestions: ['highlight recent sessions card'], actionsSupported: ['HIGHLIGHT_ELEMENT'] },
    { id: 'user360-risk-timeline-card', routeId: 'user-360', routeName: ROUTE_NAMES.USER_360_DETAIL, type: 'card', label: 'Risk Timeline', description: 'Card showing the user\'s risk score timeline over time.', synonyms: ['risk timeline', 'risk history', 'risk trend'], exampleUserQuestions: ['highlight risk timeline card'], actionsSupported: ['HIGHLIGHT_ELEMENT'] },
    { id: 'user360-alerts-table', routeId: 'user-360', routeName: ROUTE_NAMES.USER_360_DETAIL, type: 'table', label: 'User Alerts Table', description: 'Table showing alerts for this user with risk level, score, timestamp, anomaly type, and actions.', synonyms: ['user alerts', 'user alerts table', 'user alert history'], exampleUserQuestions: ['highlight user alerts table'], actionsSupported: ['HIGHLIGHT_ELEMENT'] },
    // Runtime Health
    { id: 'runtime-refresh-button', routeId: 'runtime-health', routeName: ROUTE_NAMES.RUNTIME_HEALTH, type: 'button', label: 'Refresh Runtime Health', description: 'Button that refreshes runtime health data.', synonyms: ['refresh runtime', 'runtime refresh', 'reload runtime'], exampleUserQuestions: ['show me the refresh button on runtime'], actionsSupported: ['HIGHLIGHT_ELEMENT', 'CLICK_ELEMENT'] },
    { id: 'card-runtime-summary', routeId: 'runtime-health', routeName: ROUTE_NAMES.RUNTIME_HEALTH, type: 'card', label: 'Runtime Summary', description: 'Card showing overall runtime health status, version, and key feature flags.', synonyms: ['runtime summary', 'overall status', 'diagnostics card', 'runtime diagnostics', 'system status'], exampleUserQuestions: ['show me the diagnostics card here', 'highlight runtime summary'], actionsSupported: ['HIGHLIGHT_ELEMENT'] },
    { id: 'runtime-kpi-persona', routeId: 'runtime-health', routeName: ROUTE_NAMES.RUNTIME_HEALTH, type: 'card', label: 'Persona Enabled', description: 'Card showing whether persona feature is enabled.', synonyms: ['persona enabled', 'persona status'], exampleUserQuestions: [], actionsSupported: ['HIGHLIGHT_ELEMENT'] },
    { id: 'runtime-kpi-evidence-payload', routeId: 'runtime-health', routeName: ROUTE_NAMES.RUNTIME_HEALTH, type: 'card', label: 'Evidence Payload Enabled', description: 'Card showing whether LLM evidence payload feature is enabled.', synonyms: ['evidence payload', 'evidence payload status'], exampleUserQuestions: [], actionsSupported: ['HIGHLIGHT_ELEMENT'] },
    { id: 'runtime-kpi-artifact-base-path', routeId: 'runtime-health', routeName: ROUTE_NAMES.RUNTIME_HEALTH, type: 'card', label: 'Artifact Base Path', description: 'Card showing the artifact base path for the runtime.', synonyms: ['artifact path', 'artifact base path'], exampleUserQuestions: [], actionsSupported: ['HIGHLIGHT_ELEMENT'] },
    { id: 'runtime-kpi-llm-dataprocessor', routeId: 'runtime-health', routeName: ROUTE_NAMES.RUNTIME_HEALTH, type: 'card', label: 'LLM in Data Processor', description: 'Card showing whether LLM explanation is enabled in the data processor.', synonyms: ['llm dataprocessor', 'llm in data processor'], exampleUserQuestions: [], actionsSupported: ['HIGHLIGHT_ELEMENT'] },
    { id: 'runtime-kpi-sequence-model', routeId: 'runtime-health', routeName: ROUTE_NAMES.RUNTIME_HEALTH, type: 'card', label: 'Sequence Model', description: 'Card showing the current sequence model fallback mode.', synonyms: ['sequence model', 'fallback mode'], exampleUserQuestions: [], actionsSupported: ['HIGHLIGHT_ELEMENT'] },
    { id: 'card-model-health', routeId: 'runtime-health', routeName: ROUTE_NAMES.RUNTIME_HEALTH, type: 'card', label: 'Model Health', description: 'Card showing the health status of all machine learning models.', synonyms: ['model health', 'models health', 'ml models status'], exampleUserQuestions: ['show model health', 'highlight model health card'], actionsSupported: ['HIGHLIGHT_ELEMENT'] },
    { id: 'card-kafka-health', routeId: 'runtime-health', routeName: ROUTE_NAMES.RUNTIME_HEALTH, type: 'card', label: 'Kafka Health', description: 'Card showing Kafka consumer group health and diagnostics.', synonyms: ['kafka health', 'kafka status', 'kafka diagnostics'], exampleUserQuestions: ['show kafka health', 'highlight kafka health card', 'take me to the view that i can see the kafka health'], actionsSupported: ['HIGHLIGHT_ELEMENT'] },
    // Churn
    { id: 'churn-kpi-0', routeId: 'churn', routeName: ROUTE_NAMES.CHURN, type: 'card', label: 'Total Users', description: 'Shows the total number of users being monitored for churn.', synonyms: ['total users', 'churn total users'], exampleUserQuestions: [], actionsSupported: ['HIGHLIGHT_ELEMENT'] },
    { id: 'churn-kpi-1', routeId: 'churn', routeName: ROUTE_NAMES.CHURN, type: 'card', label: 'High Risk Users', description: 'Shows the number of high churn risk users.', synonyms: ['high risk users', 'high churn risk'], exampleUserQuestions: [], actionsSupported: ['HIGHLIGHT_ELEMENT'] },
    { id: 'churn-kpi-2', routeId: 'churn', routeName: ROUTE_NAMES.CHURN, type: 'card', label: 'Medium Risk Users', description: 'Shows the number of medium churn risk users.', synonyms: ['medium risk users', 'medium churn risk'], exampleUserQuestions: [], actionsSupported: ['HIGHLIGHT_ELEMENT'] },
    { id: 'churn-kpi-3', routeId: 'churn', routeName: ROUTE_NAMES.CHURN, type: 'card', label: 'Low Risk Users', description: 'Shows the number of low churn risk users.', synonyms: ['low risk users', 'low churn risk'], exampleUserQuestions: [], actionsSupported: ['HIGHLIGHT_ELEMENT'] },
    { id: 'churn-kpi-4', routeId: 'churn', routeName: ROUTE_NAMES.CHURN, type: 'card', label: 'Churn Rate', description: 'Shows the overall churn rate percentage.', synonyms: ['churn rate', 'overall churn rate'], exampleUserQuestions: [], actionsSupported: ['HIGHLIGHT_ELEMENT'] },
    { id: 'churn-distribution-chart', routeId: 'churn', routeName: ROUTE_NAMES.CHURN, type: 'card', label: 'Churn Distribution Chart', description: 'Donut chart showing the distribution of users by churn risk level.', synonyms: ['churn distribution', 'distribution chart', 'churn donut chart'], exampleUserQuestions: ['highlight churn distribution chart'], actionsSupported: ['HIGHLIGHT_ELEMENT'] },
    { id: 'churn-risk-filter', routeId: 'churn', routeName: ROUTE_NAMES.CHURN, type: 'filter', label: 'Churn Risk Filter', description: 'Dropdown filter for churn risk level (high, medium, low) on the churn page.', synonyms: ['churn risk filter', 'filter churn', 'churn filter'], exampleUserQuestions: ['filter churn table to medium risk users', 'highlight churn risk filter'], actionsSupported: ['HIGHLIGHT_ELEMENT', 'SET_FILTER'] },
    { id: 'churn-table', routeId: 'churn', routeName: ROUTE_NAMES.CHURN, type: 'table', label: 'Churn Users Table', description: 'Table listing users with churn risk, final risk score, anomaly count, and last activity.', synonyms: ['churn table', 'churn users', 'churn list', 'high risk users table'], exampleUserQuestions: ['highlight churn users table', 'show me churn list'], actionsSupported: ['HIGHLIGHT_ELEMENT'] },
    { id: 'churn-refresh-button', routeId: 'churn', routeName: ROUTE_NAMES.CHURN, type: 'button', label: 'Refresh Churn Data', description: 'Button that refreshes churn data.', synonyms: ['refresh churn', 'churn refresh', 'reload churn'], exampleUserQuestions: ['show me the churn refresh button'], actionsSupported: ['HIGHLIGHT_ELEMENT', 'CLICK_ELEMENT'] },
    // Forecast
    { id: 'forecast-refresh-button', routeId: 'forecast', routeName: ROUTE_NAMES.FORECAST, type: 'button', label: 'Refresh Forecast', description: 'Button that refreshes forecast data.', synonyms: ['refresh forecast', 'forecast refresh', 'reload forecast'], exampleUserQuestions: ['refresh the forecast', 'highlight forecast refresh button'], actionsSupported: ['HIGHLIGHT_ELEMENT', 'CLICK_ELEMENT'] },
    { id: 'forecast-kpi-0', routeId: 'forecast', routeName: ROUTE_NAMES.FORECAST, type: 'card', label: 'Forecast Date', description: 'Shows the date of the forecast.', synonyms: ['forecast date'], exampleUserQuestions: [], actionsSupported: ['HIGHLIGHT_ELEMENT'] },
    { id: 'forecast-kpi-1', routeId: 'forecast', routeName: ROUTE_NAMES.FORECAST, type: 'card', label: 'Predicted Total Events', description: 'Shows the predicted total number of events.', synonyms: ['predicted total events', 'forecast total events', 'predicted events count'], exampleUserQuestions: ['highlight predicted total events'], actionsSupported: ['HIGHLIGHT_ELEMENT'] },
    { id: 'forecast-kpi-2', routeId: 'forecast', routeName: ROUTE_NAMES.FORECAST, type: 'card', label: 'Predicted Anomaly Rate', description: 'Shows the predicted anomaly rate percentage.', synonyms: ['predicted anomaly rate', 'forecast anomaly rate'], exampleUserQuestions: ['highlight predicted anomaly rate'], actionsSupported: ['HIGHLIGHT_ELEMENT'] },
    { id: 'forecast-kpi-3', routeId: 'forecast', routeName: ROUTE_NAMES.FORECAST, type: 'card', label: 'Expected Alert Volume', description: 'Shows the expected alert volume.', synonyms: ['expected alert volume', 'forecast alert volume', 'alert volume'], exampleUserQuestions: ['highlight expected alert volume'], actionsSupported: ['HIGHLIGHT_ELEMENT'] },
    { id: 'forecast-chart', routeId: 'forecast', routeName: ROUTE_NAMES.FORECAST, type: 'card', label: 'Forecast Chart', description: 'Chart showing historical total events and anomaly rate with forecast overlay.', synonyms: ['forecast chart', 'forecast graph', 'events chart', 'anomaly rate chart'], exampleUserQuestions: ['where can i see forecast chart', 'highlight forecast chart'], actionsSupported: ['HIGHLIGHT_ELEMENT'] },
  ],

  panels: [
    { id: 'explain-ai', label: 'AI Explanation Panel', description: 'Modal panel that displays AI-generated explanations for alerts.', synonyms: ['ai explanation', 'explain ai panel', 'ai modal'], actionsSupported: ['OPEN_PANEL'] },
    { id: 'evidence-payload', label: 'Evidence Payload Panel', description: 'Sub-panel within the AI explanation modal showing raw evidence payload JSON.', synonyms: ['evidence payload', 'evidence panel', 'raw evidence'], actionsSupported: ['OPEN_PANEL'] },
    { id: 'advanced-context', label: 'Advanced Context Panel', description: 'Expanded section within alert investigation showing additional context data.', synonyms: ['advanced context', 'context panel', 'more context'], actionsSupported: ['OPEN_PANEL'] },
  ],

  filters: [
    { id: 'alerts-risk', routeId: 'alerts', routeName: ROUTE_NAMES.ALERTS, label: 'Alerts Risk Filter', description: 'Filters the alerts table by risk level.', allowedValues: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], synonyms: ['filter alerts', 'alert risk', 'critical alerts', 'high risk alerts'], actionsSupported: ['SET_FILTER'] },
    { id: 'churn-risk', routeId: 'churn', routeName: ROUTE_NAMES.CHURN, label: 'Churn Risk Filter', description: 'Filters the churn users table by risk level.', allowedValues: ['LOW', 'MEDIUM', 'HIGH'], synonyms: ['filter churn', 'churn risk', 'medium risk churn'], actionsSupported: ['SET_FILTER'] },
  ],

  refreshTargets: [
    { id: 'forecast', routeId: 'forecast', routeName: ROUTE_NAMES.FORECAST, label: 'Refresh Forecast', description: 'Refreshes forecast dashboard data.', synonyms: ['refresh forecast', 'forecast refresh'], actionsSupported: ['REFRESH_VIEW'] },
    { id: 'alerts', routeId: 'alerts', routeName: ROUTE_NAMES.ALERTS, label: 'Refresh Alerts', description: 'Refreshes alerts page data.', synonyms: ['refresh alerts', 'alerts refresh'], actionsSupported: ['REFRESH_VIEW'] },
    { id: 'churn', routeId: 'churn', routeName: ROUTE_NAMES.CHURN, label: 'Refresh Churn', description: 'Refreshes churn page data.', synonyms: ['refresh churn', 'churn refresh'], actionsSupported: ['REFRESH_VIEW'] },
    { id: 'runtime', routeId: 'runtime-health', routeName: ROUTE_NAMES.RUNTIME_HEALTH, label: 'Refresh Runtime Health', description: 'Refreshes runtime health data.', synonyms: ['refresh runtime', 'runtime refresh'], actionsSupported: ['REFRESH_VIEW'] },
  ],

  searchTargets: [
    { id: 'alert-search', routeId: 'alerts', routeName: ROUTE_NAMES.ALERTS, label: 'Search Alerts', description: 'Search alerts by query or event ID.', params: ['q'], synonyms: ['search alerts', 'find alert', 'lookup alert'], actionsSupported: ['SEARCH_ALERT'] },
    { id: 'user-search', routeId: 'user360', routeName: ROUTE_NAMES.USER_360, label: 'Search User', description: 'Search for a user by insured ID.', params: ['insuredId'], synonyms: ['search user', 'find user', 'lookup user', 'search insured'], actionsSupported: ['SEARCH_USER'] },
  ],
};

const outputPath = path.resolve(__dirname, 'dashboardAssistantManifest.json');
fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2));
console.log('Manifest JSON written successfully');
