import { useState } from "react";
import { createCourseRequest } from "../services/courseRequestService";

function CourseModal({ course, onClose }) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    telegram: "",
    comment: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert("Введіть ім'я");
      return;
    }

    if (!formData.phone.trim()) {
      alert("Введіть номер телефона");
      return;
    }

    if (!formData.telegram.trim()) {
      alert("Введіть Telegram");
      return;
    }

    setIsSubmitting(true);

    try {
      await createCourseRequest({
        courseTitle: course.title,
        price: course.price,
        name: formData.name,
        phone: formData.phone,
        telegram: formData.telegram,
        comment: formData.comment,
      });

      alert("Заявка на курс надіслана");
      onClose();
    } catch (error) {
      console.error("Помилка при відправці заявки на курс:", error.message);
      alert("Не вдалось відправити заявку");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="course-modal-overlay" onClick={onClose}>
      <div className="course-modal" onClick={(e) => e.stopPropagation()}>
        <button className="course-modal__close" onClick={onClose}>
          ×
        </button>

        <h2 className="course-modal__title">{course.title}</h2>
        <div className="course-modal__price">{course.price} грн</div>

        <form className="course-modal__form" onSubmit={handleSubmit}>
          <label>
            Ім'я
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ваше ім'я"
            />
          </label>

          <label>
            Номер телефону
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+380 00 000 00 00"
            />
          </label>

          <label>
            Telegram
            <input
              type="text"
              name="telegram"
              value={formData.telegram}
              onChange={handleChange}
              placeholder="@username"
            />
          </label>

          <label>
            Коментар
            <textarea
              name="comment"
              value={formData.comment}
              onChange={handleChange}
              placeholder="Ваш коментарий"
              rows="4"
            />
          </label>

          <button
            type="submit"
            className="course-modal__submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Відправка..." : "Відправити заявку"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CourseModal;