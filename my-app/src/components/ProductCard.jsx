function ProductCard({ product, onAddToCart }) {
  const imageSrc = product.imageFileId
    ? `http://localhost:5000/api/images/${product.imageFileId}`
    : null;

  return (
    <div className="product-card">
      <div className="product-card__image">
        {imageSrc ? (
          <img src={imageSrc} alt={product.name} />
        ) : (
          <span>No image</span>
        )}
      </div>

      <div className="product-card__content">
        <h2 className="product-card__title">{product.name}</h2>

        <p className="product-card__description">{product.description}</p>

        <div className="product-card__meta">
          <span>{product.weight} г</span>
          <span>{product.inStock ? "В наявності" : "Немає в наявності"}</span>
        </div>

        <div className="product-card__footer">
          <strong>{product.price} грн</strong>

          <button
            className="product-card__button"
            onClick={() => onAddToCart(product)}
            disabled={!product.inStock}
          >
            в кошик
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;