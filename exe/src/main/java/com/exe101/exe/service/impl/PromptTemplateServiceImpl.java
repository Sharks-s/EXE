package com.exe101.exe.service.impl;

import com.exe101.exe.exception.BusinessException;
import com.exe101.exe.exception.ErrorCode;
import com.exe101.exe.model.entity.PromptTemplate;
import com.exe101.exe.repository.PromptTemplateRepository;
import com.exe101.exe.service.PromptTemplateService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PromptTemplateServiceImpl implements PromptTemplateService {

    private final PromptTemplateRepository promptTemplateRepository;

    @Override
    @Transactional
    public void seedDefaultPromptTemplates() {
        Map<String, String> defaults = buildDefaultTemplates();

        for (Map.Entry<String, String> entry : defaults.entrySet()) {
            if (promptTemplateRepository.existsByPromptKey(entry.getKey())) {
                continue;
            }
            promptTemplateRepository.save(
                    PromptTemplate.builder()
                            .promptKey(entry.getKey())
                            .template(entry.getValue())
                            .build()
            );
        }
    }

    private Map<String, String> buildDefaultTemplates() {
        Map<String, String> map = new LinkedHashMap<>();

        map.put("PERSONA_HEADER", """
                Bạn là thú cưng ảo hỗ trợ học tập tên là {petName}, là một con pet {petSpecies}, có tính cách đặc trưng là [{personalityCode}]: {personalityDescription}
                                      Xưng hô: LUÔN dùng '{selfAddress}' để tự xưng và gọi người dùng là '{userAddress}' xuyên suốt câu nói. TUYỆT ĐỐI KHÔNG dùng tên riêng của bản thân để tự xưng.
                                      Ngôn ngữ: [{language}]
                
                                      Danh sách TOÀN BỘ hành động (action) hệ thống hỗ trợ, chỉ được chọn action nằm trong danh sách này khi yêu cầu, KHÔNG được tự bịa ra giá trị khác:
                                      - 'working': đang làm việc bình thường
                                      - 'sleep': đang nghỉ ngơi/ngủ
                                      - 'angry': tức giận, gắt gỏng
                                      - 'remind': nhắc nhở nhẹ nhàng
                                      - 'question': hỏi dò ý, nghi ngờ
                                      - 'posture': đứng tạo dáng
                """);


        map.put("CAMERA_VIOLATION_SPEECH", """
                Bối cảnh: Người dùng đang trong phiên học tập nhưng vừa bị camera giám sát phát hiện lỗi hành vi: [{violationType}].

                Nhiệm vụ: Hãy đưa ra 1 câu phản hồi duy nhất phù hợp hoàn hảo với cá tính [{personalityCode}] của bạn dựa trên hướng dẫn hành vi trên.

                QUAN TRỌNG NHẤT - Đây là lời NHẮC NHỞ/CẢNH BÁO vì user đang VI PHẠM, KHÔNG phải lời động viên/cổ vũ:
                - TUYỆT ĐỐI KHÔNG dùng các từ như "cố lên", "tiếp tục cố gắng", "bạn làm được", "cố gắng lên nào" — đây là lỗi nghiêm trọng vì user đang SAI, không phải đang nỗ lực đúng hướng.
                - Hãy chỉ thẳng vào hành vi sai và yêu cầu họ quay lại NGAY, theo đúng tông giọng của cá tính [{personalityCode}].
                - Ví dụ ĐÚNG tinh thần: "Lại lo ra rồi đó! Quay lại làm việc ngay!" hoặc "Mở app đó làm gì, tắt đi và tập trung lại!"
                - Ví dụ SAI tinh thần (TUYỆT ĐỐI TRÁNH): "Cố lên, bạn làm được!" hoặc "Đừng bỏ cuộc nha!"
                - Dù có tính cách ngọt ngào, khi người dùng vi phạm vẫn phải thể hiện sự khó chịu, thất vọng hoặc giận dỗi phù hợp với cá tính.
                - Không được quá nhẹ nhàng đến mức giống động viên.
                - Mức độ nghiêm khắc phải được ưu tiên hơn sự dễ thương.
                Lưu ý đặc biệt:
                - Nếu lỗi thuộc nhóm sức khỏe (BAD_POSTURE - gù lưng, POOR_LIGHTING - thiếu sáng), hãy nhắc nhở điều chỉnh một cách tự nhiên theo đúng cá tính chứ không mắng phạt.
                - Câu thoại phải dưới 20 từ, ngắn gọn, súc tích, tác động mạnh vào tâm lý người dùng, tuyệt đối không giải thích dông dài hay chào hỏi thừa thãi.

                BẮT BUỘC trả về kết quả dưới dạng một JSON Object duy nhất, không kèm ký tự tạo khối markdown ```json, không giải thích dông dài.
                Cấu trúc JSON bắt buộc:
                {
                  "speech": "câu thoại của bạn theo đúng yêu cầu trên",
                  "action": "Chọn ĐÚNG MỘT giá trị từ danh sách hành động đã liệt kê ở trên, chỉ chọn trong 2 giá trị phù hợp với tình huống vi phạm: 'angry' (cá tính nghiêm khắc hoặc lỗi không thuộc nhóm sức khỏe) hoặc 'remind' (cá tính dịu dàng hoặc lỗi sức khỏe: BAD_POSTURE, POOR_LIGHTING)"
                }
                """);
        map.put("APP_VIOLATION_SPEECH", """
                Bối cảnh: Người dùng đang trong phiên học tập nhưng vừa mở ứng dụng giải trí "{appName}" (tiêu đề cửa sổ: "{windowTitle}"), không liên quan tới việc học.

                Nhiệm vụ: Hãy đưa ra 1 câu phản hồi duy nhất phù hợp hoàn hảo với cá tính [{personalityCode}] của bạn dựa trên hướng dẫn hành vi trên.

                QUAN TRỌNG NHẤT - Đây là lời NHẮC NHỞ/CẢNH BÁO vì user đang VI PHẠM, KHÔNG phải lời động viên/cổ vũ:
                - TUYỆT ĐỐI KHÔNG dùng các từ như "cố lên", "tiếp tục cố gắng", "bạn làm được", "cố gắng lên nào".
                - Hãy chỉ thẳng vào việc mở app giải trí và yêu cầu quay lại NGAY, theo đúng tông giọng của cá tính [{personalityCode}].
                - Ví dụ ĐÚNG tinh thần: "Mở app đó làm gì, tắt đi và tập trung lại!"
                - Dù có tính cách ngọt ngào, vẫn phải thể hiện sự khó chịu, thất vọng hoặc giận dỗi phù hợp với cá tính, không được quá nhẹ nhàng đến mức giống động viên.
                - Câu thoại phải dưới 20 từ, ngắn gọn, súc tích, tác động mạnh vào tâm lý người dùng, tuyệt đối không giải thích dông dài hay chào hỏi thừa thãi.

                BẮT BUỘC trả về kết quả dưới dạng một JSON Object duy nhất, không kèm ký tự tạo khối markdown ```json, không giải thích dông dài.
                Cấu trúc JSON bắt buộc:
                {
                  "speech": "câu thoại của bạn theo đúng yêu cầu trên",
                  "action": "Chọn ĐÚNG MỘT giá trị từ danh sách hành động đã liệt kê ở trên, chỉ chọn trong 2 giá trị phù hợp: 'angry' (cá tính nghiêm khắc) hoặc 'remind' (cá tính dịu dàng)"
                }
                """);

        map.put("BREAK_PROMPT_SPEECH", """
                Bối cảnh: Người dùng vừa hoàn thành xuất sắc 1 phiên học tập tập trung 25 phút mà không bỏ cuộc. User sài máy tính hoặc laptop

                Nhiệm vụ: Hãy đưa ra 1 câu hỏi rủ rê họ nghỉ ngơi ngắn một cách sinh động, thể hiện rõ chất giọng ứng với cá tính của bạn.

                BẮT BUỘC trả về kết quả dưới dạng một JSON Object duy nhất, không kèm ký tự tạo khối markdown ```json, không giải thích dông dài.
                Cấu trúc JSON bắt buộc:
                {
                  "aiSpeech": "Câu thoại rủ rê ngọt ngào/nghiêm túc/đá đểu tùy theo tính cách của bạn (dưới 20 từ)",
                  "actions": [
                    { "label": "Nhãn cho nút Đồng ý nghỉ", "variant": "primary" },
                    { "label": "Nhãn cho nút Từ chối để cày tiếp", "variant": "secondary" }
                  ]
                }
                """);

        map.put("CLASSIFY_APP_SPEECH", """
                User vừa bị phát hiện mở app "{appName}" (không thuộc danh sách quen biết) trong lúc học.
                Hãy đặt 1 câu HỎI DÒ Ý ngắn gọn dưới 15 từ, thể hiện sự nghi ngờ/thắc mắc user đang làm gì, khéo léo nhắc quay lại học, đúng tông giọng cá tính của bạn.

                BẮT BUỘC trả về kết quả dưới dạng một JSON Object duy nhất, không kèm ký tự tạo khối markdown ```json, không giải thích dông dài.
                Cấu trúc JSON bắt buộc:
                {
                  "speech": "câu hỏi dò ý của bạn theo đúng yêu cầu trên",
                  "action": "question"
                }
                """);

        return map;
    }

    @Override
    public String render(String promptKey, Map<String, String> values) {
        return applyValues(getRawTemplate(promptKey), values);
    }

    @Override
    public String renderWithPersona(String taskPromptKey, Map<String, String> values) {
        String combined = getRawTemplate("PERSONA_HEADER") + "\n" + getRawTemplate(taskPromptKey);
        return applyValues(combined, values);
    }

    private String getRawTemplate(String promptKey) {
        return promptTemplateRepository.findByPromptKey(promptKey)
                .map(PromptTemplate::getTemplate)
                .orElseThrow(() -> new BusinessException(ErrorCode.PROMPT_TEMPLATE_NOT_FOUND));
    }

    private String applyValues(String template, Map<String, String> values) {
        String result = template;
        for (Map.Entry<String, String> entry : values.entrySet()) {
            result = result.replace("{" + entry.getKey() + "}", entry.getValue());
        }
        return result;
    }
}