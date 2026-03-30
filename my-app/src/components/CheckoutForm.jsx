import { useState } from "react";

function CheckoutForm({ cartItems, onSubmitOrder, onSuccess }) {
  const [formData, setFormData] = useState({
    customerName: "",
    telegram: "",
    phone: "",
    comment: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (cartItems.length === 0) {
      alert("Кошик порожній");
      return;
    }

    if (!formData.customerName.trim()) {
      alert("Введіть ім'я");
      return;
    }

    if (!formData.telegram.trim() && !formData.phone.trim()) {
      alert("Вкажіть Telegram або телефон");
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmitOrder({
        customerName: formData.customerName,
        telegram: formData.telegram,
        phone: formData.phone,
        comment: formData.comment,
        items: cartItems.map((item) => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          weight: item.weight,
          quantity: item.quantity,
        })),
        totalAmount,
      });

      setFormData({
        customerName: "",
        telegram: "",
        phone: "",
        comment: "",
      });

      onSuccess();
      alert("Замовлення надіслано");
    } catch (error) {
      console.error("Помилка при відправці замовлення:", error);
      alert("Не вдалось відправити замовлення");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="checkout-section">
      <h2 className="section-title">Оформлення замовлення</h2>

      <form className="checkout-form" onSubmit={handleSubmit}>
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
          Коментар
          <textarea
            name="comment"
            value={formData.comment}
            onChange={handleChange}
            placeholder="Наприклад: потрібен помол під фільтр"
            rows="4"
          />
        </label>

        <div className="checkout-summary">
          <span>Сума замовлення:</span>
          <strong>{totalAmount} грн</strong>
        </div>

        <button
          className="checkout-form__submit"
          type="submit"
          disabled={isSubmitting || cartItems.length === 0}
        >
          {isSubmitting ? "Відправка..." : "Відправити замовлення"}
        </button>
      </form>
    </section>
  );
}

export default CheckoutForm;