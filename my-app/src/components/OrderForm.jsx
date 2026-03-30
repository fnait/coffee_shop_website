import { useState } from "react";

function OrderForm({ product, onClose, onSubmitOrder }) {
  const [formData, setFormData] = useState({
    customerName: "",
    telegram: "",
    phone: "",
    quantity: 1,
    comment: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: name === "quantity" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.customerName.trim()) {
      alert("Введіть ім'я");
      return;
    }

    if (!formData.telegram.trim() && !formData.phone.trim()) {
      alert("Укажіть Telegram або телефон");
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmitOrder({
        customerName: formData.customerName,
        telegram: formData.telegram,
        phone: formData.phone,
        quantity: formData.quantity,
        comment: formData.comment,
        items: [
          {
            productId: product.id,
            name: product.name,
            price: product.price,
            weight: product.weight,
            quantity: formData.quantity,
          },
        ],
        totalAmount: product.price * formData.quantity,
      });

      alert("Заявка надіслана");
      onClose();
    } catch (error) {
      console.error("Помилка при створенні замовлення:", error);
      alert("Не вдалось відправити заявку");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal__header">
          <h2>Оформить заявку</h2>
          <button className="modal__close" onClick={onClose}>
            ×
          </button>
        </div>

        <p className="modal__product">
          Товар: <strong>{product.name}</strong>
        </p>

        <form className="order-form" onSubmit={handleSubmit}>
          <label>
            Ім'я
            <input
              type="text"
              name="customerName"
              value={formData.customerName}
              onChange={handleChange}
              placeholder="Ваше ім'я"
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
            Телефон
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+380..."
            />
          </label>

          <label>
            Кількість
            <input
              type="number"
              name="quantity"
              min="1"
              value={formData.quantity}
              onChange={handleChange}
            />
          </label>

          <label>
            Коментар
            <textarea
              name="comment"
              value={formData.comment}
              onChange={handleChange}
              placeholder="Наприклад: потрібен помол під фільтр"
              rows="4"
            />
          </label>

          <div className="order-form__summary">
            <span>Всього:</span>
            <strong>{product.price * formData.quantity} грн</strong>
          </div>

          <button
            className="order-form__submit"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Відправка..." : "Відправити заявку"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default OrderForm;