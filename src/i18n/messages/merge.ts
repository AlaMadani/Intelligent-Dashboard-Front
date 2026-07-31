// ---- Types & Helpers ----
type MessageTree = Record<string, unknown>;

const isMessageTree = (value: unknown): value is MessageTree =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

// ---- Merge Utility ----
export const mergeMessages = <TDefault extends MessageTree, TOverride extends MessageTree>(
  defaults: TDefault,
  overrides: TOverride,
): TDefault & TOverride => {
  const result: MessageTree = { ...defaults };

  for (const [key, overrideValue] of Object.entries(overrides)) {
    const defaultValue = result[key];
    result[key] =
      isMessageTree(defaultValue) && isMessageTree(overrideValue)
        ? mergeMessages(defaultValue, overrideValue)
        : overrideValue;
  }

  return result as TDefault & TOverride;
};
