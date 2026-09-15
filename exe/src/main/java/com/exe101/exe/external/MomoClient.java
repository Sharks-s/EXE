package com.exe101.exe.external;

import com.exe101.exe.config.MomoProperties;

import com.exe101.exe.dto.request.MomoCreatePaymentRequest;
import com.exe101.exe.dto.request.MomoQueryRequest;
import com.exe101.exe.dto.response.MomoCreatePaymentResult;
import com.exe101.exe.dto.response.MomoQueryResult;
import com.exe101.exe.exception.BusinessException;
import com.exe101.exe.exception.ErrorCode;
import com.exe101.exe.exception.MomoAmbiguousResultException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

@Slf4j
@Component
@RequiredArgsConstructor
public class MomoClient {

    private final RestTemplate restTemplate;
    private final MomoProperties momoProperties;

    public MomoCreatePaymentResult createPayment(MomoCreatePaymentRequest request) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<MomoCreatePaymentRequest> entity = new HttpEntity<>(request, headers);

        MomoCreatePaymentResult result;
        try {
            result = restTemplate.postForObject(momoProperties.getEndpoint(), entity, MomoCreatePaymentResult.class);
        } catch (ResourceAccessException e) {
            log.error("[Momo] Timeout/connection error khi tạo payment, orderId={}", request.orderId(), e);
            throw new MomoAmbiguousResultException("Timeout hoặc mất kết nối tới MoMo", e);
        } catch (HttpStatusCodeException e) {
            log.error("[Momo] HTTP error {} khi tạo payment: {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new BusinessException(ErrorCode.MOMO_REQUEST_FAILED);
        }

        if (result == null || result.resultCode() == null) {
            log.error("[Momo] Response rỗng hoặc thiếu resultCode, orderId={}", request.orderId());
            throw new MomoAmbiguousResultException("Response từ MoMo không hợp lệ", null);
        }

        if (result.resultCode() != 0) {
            log.error("[Momo] Create payment failed rõ ràng: {}", result);
            throw new BusinessException(ErrorCode.MOMO_REQUEST_FAILED);
        }

        return result;
    }

    public MomoQueryResult queryTransaction(MomoQueryRequest request) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<MomoQueryRequest> entity = new HttpEntity<>(request, headers);

        try {
            MomoQueryResult result = restTemplate.postForObject(
                    momoProperties.getQueryEndpoint(), entity, MomoQueryResult.class);
            if (result == null) {
                throw new MomoAmbiguousResultException("Query response rỗng", null);
            }
            return result;
        } catch (ResourceAccessException e) {
            log.error("[Momo] Timeout khi query transaction, orderId={}", request.orderId(), e);
            throw new MomoAmbiguousResultException("Timeout khi query transaction", e);
        } catch (HttpStatusCodeException e) {
            log.error("[Momo] HTTP error {} khi query transaction: {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new BusinessException(ErrorCode.MOMO_REQUEST_FAILED);
        }
    }
}