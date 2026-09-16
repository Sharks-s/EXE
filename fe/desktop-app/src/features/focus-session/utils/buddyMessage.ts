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
  return messages[Math.abs(hashText(seed)) % messages.length];
};

export const getBuddyMessage = ({
  petName,
  personalityCode,
  focusGoal,
  durationMinutes,
  todayFocusMinutes,
}: BuddyMessageParams) => {
  if (!petName) {
    return "Trang bị một thú cưng để có bạn đồng hành trong phiên tập trung.";
  }

  const normalizedPersonality = (personalityCode || "INSPIRING").toUpperCase();
  const dailySeed = new Date().toISOString().slice(0, 10);
  const seed = `${dailySeed}-${normalizedPersonality}-${petName}-${focusGoal}-${durationMinutes}`;
  const todayFocusText =
    todayFocusMinutes && todayFocusMinutes > 0
      ? ` Hôm nay bạn đã có ${Math.round(todayFocusMinutes)} phút tập trung rồi.`
      : "";

  const messagesByPersonality: Record<string, string[]> = {
    SWEET: [
      `${petName} sẽ ở đây cổ vũ bạn nhé. Bắt đầu ${durationMinutes} phút cho ${focusGoal} thật êm nào.${todayFocusText}`,
      `${petName} tin bạn làm được. Cứ đi từng bước nhỏ với ${focusGoal} thôi.`,
      `Nhẹ nhàng vào việc nào, ${petName} đang canh giữ sự tập trung cho bạn.`,
    ],
    STRICT: [
      `${petName} đã sẵn sàng. ${durationMinutes} phút tới chỉ dành cho ${focusGoal}, không lan man.`,
      `Vào chế độ tập trung. ${petName} sẽ nhắc bạn giữ đúng cam kết với ${focusGoal}.`,
      `Mục tiêu đã rõ: ${focusGoal}. Bắt đầu ngay, hoàn thành trước rồi nghỉ sau.`,
    ],
    MEAN: [
      `${petName} đang nhìn đấy. Đừng để ${focusGoal} lại bị trì hoãn thêm nữa.`,
      `${durationMinutes} phút không quá dài đâu. ${petName} mong bạn đừng làm nó khó hơn cần thiết.`,
      `Nếu đã chọn ${focusGoal} thì làm tới nơi tới chốn. ${petName} sẽ để mắt tới bạn.`,
    ],
    CALM: [
      `${petName} ở bên bạn. Hít thở một nhịp, rồi bắt đầu ${focusGoal} thật chậm và chắc.`,
      `Cứ giữ nhịp ổn định. ${petName} sẽ đồng hành trong ${durationMinutes} phút tiếp theo.`,
      `Không cần vội. Chỉ cần quay lại với ${focusGoal}, từng phút một.`,
    ],
    FRIEND: [
      `${petName} vào team với bạn hôm nay. Mình cùng xử lý ${focusGoal} nhé.`,
      `Có ${petName} ngồi cạnh rồi. Làm ${durationMinutes} phút, xong mình nghỉ một chút.`,
      `${focusGoal} nghe có vẻ ổn đó. ${petName} sẽ đi cùng bạn đến hết phiên.`,
    ],
    INSPIRING: [
      `${petName} đang sẵn sàng đồng hành. Biến ${durationMinutes} phút này thành một bước tiến thật đẹp nào.`,
      `Hôm nay bắt đầu bằng ${focusGoal}. ${petName} tin đây sẽ là một phiên đáng giá.`,
      `Một phiên tập trung tốt có thể đổi cả ngày. ${petName} sẽ đi cùng bạn.`,
    ],
  };

  return pickMessage(
    messagesByPersonality[normalizedPersonality] ?? messagesByPersonality.INSPIRING,
    seed,
  );
};
