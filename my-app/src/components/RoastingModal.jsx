import { useState } from "react";
import { createRoastingRequest } from "../services/roastingService";

function RoastingModal({ roasting, onClose }) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    telegram: "",
    description: "",
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

    if (!formData.description.trim()) {
      alert("Введіть опис");
      return;
    }

    setIsSubmitting(true);

    try {
      await createRoastingRequest(formData);
      alert("Заявка на обсмажку надіслана");
      onClose();
    } catch (error) {
      console.error("Помилка при відправці заявки на обсмажку:", error.message);
      alert("Не вдалось відправити заявку");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="roasting-modal-overlay" onClick={onClose}>
      <div className="roasting-modal" onClick={(e) => e.stopPropagation()}>
        <button className="roasting-modal__close" onClick={onClose}>
          ×
        </button>

        <h2 className="roasting-modal__title">
          {roasting?.title || "Послуга обсмажки"}
        </h2>

        <form className="roasting-modal__form" onSubmit={handleSubmit}>
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
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+380..."
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
            Опис
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Опишіть ваш запит на обсмажку"
              rows="5"
            />
          </label>

          <button
            type="submit"
            className="roasting-modal__submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Відправка..." : "Відправити заявку"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default RoastingModal;