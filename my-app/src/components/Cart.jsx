function Cart({ cartItems, onIncrease, onDecrease, onRemove }) {
  const totalAmount = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <section className="cart-section">
      <h2 className="section-title">Кошик</h2>

      {cartItems.length === 0 ? (
        <div className="cart-empty">
          <p>Кошик поки порожній</p>
          <span>Додайте каву з каталогу</span>
        </div>
      ) : (
        <>
          <div className="cart-list">
            {cartItems.map((item) => (
              <div className="cart-item" key={item.id}>
                <div className="cart-item__info">
                  <h3>{item.name}</h3>
                  <p>{item.weight} г</p>
                  <span>{item.price} грн за пачку</span>
                </div>

                <div className="cart-item__controls">
                  <div className="cart-item__quantity">
                    <button onClick={() => onDecrease(item.id)}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => onIncrease(item.id)}>+</button>
                  </div>

                  <strong>{item.price * item.quantity} грн</strong>

                  <button
                    className="cart-item__remove"
                    onClick={() => onRemove(item.id)}
                  >
                    Видалити
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-total">
            <span>Всього:</span>
            <strong>{totalAmount} грн</strong>
          </div>
        </>
      )}
    </section>
  );
}

export default Cart;