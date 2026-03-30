function RoastingSection({ roasting, onOpenModal }) {
  const imageSrc = roasting?.imageFileId
    ? `http://localhost:5000/api/images/${roasting.imageFileId}`
    : null;

  return (
    <div className="roasting-section">
      <div className="roasting-section__image">
        {imageSrc ? (
          <img src={imageSrc} alt={roasting?.title || "Послуга обсмажки"} />
        ) : (
          <div className="roasting-section__placeholder">Немає фото</div>
        )}
      </div>

      <div className="roasting-section__content">
        <h2>{roasting?.title || "Послуга обсмажки"}</h2>
        <p>
          {roasting?.description || "Опис послуги обсмажки поки не заповнено."}
        </p>

        <button className="roasting-section__button" onClick={onOpenModal}>
          Змовити обсмажку
        </button>
      </div>
    </div>
  );
}

export default RoastingSection;