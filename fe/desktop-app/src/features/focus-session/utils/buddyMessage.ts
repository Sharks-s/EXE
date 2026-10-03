type BuddyMessageParams = {
  petName?: string | null;
  personalityCode?: string | null;
  focusGoal: string;
  durationMinutes: number;
  todayFocusMinutes?: number;
};

const hashText = (value: string) =>
  value.split("").reduce((total, char) => total + char.charCodeAt(0), 0);

const pickMessage = (messages: string[], seed: string) => {
  if (!messages || messages.length === 0) return "";
  return messages[Math.abs(hashText(seed)) % messages.length];
};

export const getBuddyMessage = (
  {
    petName,
    personalityCode,
    focusGoal,
    durationMinutes,
    todayFocusMinutes,
  }: BuddyMessageParams,
  t: any
) => {
  if (!petName) {
    return t("dashboard.buddy_messages.no_pet");
  }

  const normalizedPersonality = (personalityCode || "INSPIRING").toUpperCase();
  const dailySeed = new Date().toISOString().slice(0, 10);
  const seed = `${dailySeed}-${normalizedPersonality}-${petName}-${focusGoal}-${durationMinutes}`;
  
  const todayFocusText =
    todayFocusMinutes && todayFocusMinutes > 0
      ? t("dashboard.buddy_messages.today_focus", { minutes: Math.round(todayFocusMinutes) })
      : "";

  const messages = t(`dashboard.buddy_messages.${normalizedPersonality}`, {
    returnObjects: true,
    petName,
    focusGoal,
    durationMinutes,
    todayFocusText,
  }) as string[];

  const defaultMessages = t(`dashboard.buddy_messages.INSPIRING`, {
    returnObjects: true,
    petName,
    focusGoal,
    durationMinutes,
    todayFocusText,
  }) as string[];

  return pickMessage(
    Array.isArray(messages) ? messages : defaultMessages,
    seed
  );
};
