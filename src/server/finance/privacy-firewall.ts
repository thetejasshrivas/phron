export type AnalyticsEventName =
  | 'user_signed_up'
  | 'onboarding_step_completed'
  | 'transaction_logged'
  | 'category_swap_clicked'
  | 'overspend_detected'
  | 'recovery_plan_action'
  | 'reconciliation_completed'
  | 'health_state_changed'
  | 'salary_confirmed';

type SafeAnalyticsEvent = { readonly name: AnalyticsEventName; readonly properties: Readonly<Record<string, string | number | boolean>> };

const UUID = /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i;
const EMAIL = /\b[\w.!#$%&'*+/=?^`{|}~-]+@[\w-]+(?:\.[\w-]+)+\b/i;
const SENSITIVE_LABEL = /\b(?:monthly\s+net\s+income|net\s+income|salary|income|liquid\s+(?:cash\s+)?balance|current\s+balance|bank\s+balance|cash\s+balance|balance\s+(?:is|of|:)|total\s+(?:outstanding\s+)?debt|outstanding\s+debt|credit\s+card\s+debt|obligations?)\b/i;
const INVESTMENT_ADVICE = /\b(?:stocks?|shares?|mutual\s+funds?|invest(?:ment|ing)?|portfolio|crypto(?:currency)?|credit\s+advice|which\s+fund)\b/i;

/** Conservative guard for user text: keep private context on-device/server-local. */
export function hasSensitiveOutboundContext(text: string): boolean {
  return EMAIL.test(text) || UUID.test(text) || SENSITIVE_LABEL.test(text);
}

/** Deterministic refusal before extraction; never forwards advice requests to a model. */
export function isRestrictedAdviceRequest(text: string): boolean {
  return INVESTMENT_ADVICE.test(text);
}

const enumValues: Readonly<Record<string, readonly string[]>> = {
  user_signed_up: ['method:google_oauth'],
  onboarding_step_completed: ['step:1', 'step:2', 'is_mid_cycle:boolean'],
  transaction_logged: ['input_type:nlp_single', 'input_type:nlp_multi', 'input_type:manual', 'confidence:high', 'confidence:medium', 'confidence:low', 'is_estimated:boolean', 'is_credit_card:boolean'],
  category_swap_clicked: ['time_elapsed_seconds:integer'],
  overspend_detected: ['tier:discretionary', 'goal_impacted:fixed', 'goal_impacted:flexible', 'goal_impacted:none'],
  recovery_plan_action: ['action:accepted', 'action:adjusted', 'action:rejected', 'used_next_cycle_commitment:boolean'],
  reconciliation_completed: ['drift_direction:positive', 'drift_direction:negative', 'had_recalled_spend:boolean'],
  health_state_changed: ['from_state:A', 'from_state:B', 'from_state:C', 'to_state:A', 'to_state:B', 'to_state:C'],
  salary_confirmed: ['was_on_time:boolean'],
};

const eventKeys: Readonly<Record<string, readonly string[]>> = {
  user_signed_up: ['method'], onboarding_step_completed: ['step', 'is_mid_cycle'],
  transaction_logged: ['input_type', 'confidence', 'is_estimated', 'is_credit_card'],
  category_swap_clicked: ['time_elapsed_seconds'], overspend_detected: ['tier', 'goal_impacted'],
  recovery_plan_action: ['action', 'used_next_cycle_commitment'],
  reconciliation_completed: ['drift_direction', 'had_recalled_spend'],
  health_state_changed: ['from_state', 'to_state'], salary_confirmed: ['was_on_time'],
};

/** Exact schema projection; unknown keys and free-form values are discarded. */
export function createSafeAnalyticsEvent(name: string, input: Readonly<Record<string, unknown>>): SafeAnalyticsEvent | null {
  const keys = eventKeys[name];
  if (!keys) return null;
  const properties: Record<string, string | number | boolean> = {};
  for (const key of keys) {
    const value = input[key];
    if (typeof value === 'string' && enumValues[name]?.includes(`${key}:${value}`)) properties[key] = value;
    else if (typeof value === 'boolean' && enumValues[name]?.includes(`${key}:boolean`)) properties[key] = value;
    else if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && enumValues[name]?.includes(`${key}:integer`)) properties[key] = value;
    else return null;
  }
  return { name: name as AnalyticsEventName, properties };
}
