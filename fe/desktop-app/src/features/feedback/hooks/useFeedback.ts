import { useEffect, useMemo, useState } from "react";
import { toast } from "@/shared/store/toastStore";
import { handleApiError } from "@/utils/handleApiError";
import { feedbackApi } from "../api/feedback.api";
import type {
  CreateUserFeedbackRequest,
  UserFeedback,
  UserFeedbackType,
} from "../types/feedback.types";

const INITIAL_FORM: CreateUserFeedbackRequest = {
  type: "GENERAL",
  title: "",
  content: "",
  rating: null,
};

const TITLE_MAX_LENGTH = 150;
const CONTENT_MAX_LENGTH = 5000;

export function useFeedback() {
  const [feedbacks, setFeedbacks] = useState<UserFeedback[]>([]);
  const [form, setForm] = useState<CreateUserFeedbackRequest>(INITIAL_FORM);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const title = form.title.trim();
  const content = form.content.trim();

  const canSubmit = useMemo(
    () =>
      title.length > 0 &&
      title.length <= TITLE_MAX_LENGTH &&
      content.length > 0 &&
      content.length <= CONTENT_MAX_LENGTH &&
      (form.rating === null ||
        form.rating === undefined ||
        (form.rating >= 1 && form.rating <= 5)),
    [content.length, form.rating, title.length],
  );

  const loadFeedbacks = async () => {
    setIsLoading(true);
    try {
      setFeedbacks(await feedbackApi.getMine());
    } catch (err) {
      handleApiError(err, {
        context: "[useFeedback]",
        action: "Failed to load user feedbacks",
        fallbackMessage: "Chưa tải được danh sách feedback.",
        dedupeKey: "feedback-load",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const setType = (type: UserFeedbackType) => {
    setForm((current) => ({ ...current, type }));
  };

  const setRating = (rating: number | null) => {
    setForm((current) => ({ ...current, rating }));
  };

  const submitFeedback = async () => {
    if (!canSubmit || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const created = await feedbackApi.create({
        type: form.type,
        title,
        content,
        rating: form.rating,
      });
      setFeedbacks((current) => [created, ...current]);
      setForm(INITIAL_FORM);
      toast.success("Đã gửi feedback. Cảm ơn bạn đã góp ý!");
    } catch (err) {
      handleApiError(err, {
        context: "[useFeedback]",
        action: "Failed to submit user feedback",
        fallbackMessage: "Chưa gửi được feedback, vui lòng thử lại.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    void loadFeedbacks();
  }, []);

  return {
    canSubmit,
    contentMaxLength: CONTENT_MAX_LENGTH,
    feedbacks,
    form,
    isLoading,
    isSubmitting,
    loadFeedbacks,
    setForm,
    setRating,
    setType,
    submitFeedback,
    titleMaxLength: TITLE_MAX_LENGTH,
  };
}
