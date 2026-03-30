function AboutSection({ about }) {
  const imageSrc = about?.imageFileId
    ? `http://localhost:5000/api/images/${about.imageFileId}`
    : null;

  return (
    <div className="about-section__grid">
      <div className="about-section__image">
        {imageSrc ? (
          <img src={imageSrc} alt={about?.title || "Про мене"} />
        ) : (
          <div className="about-section__placeholder">Відсутнє фото</div>
        )}
      </div>

      <div className="about-section__content">
        <h2>{about?.title || "Про мене"}</h2>
        <p>{about?.text || "Цей розділ поки не заповнений."}</p>
      </div>
    </div>
  );
}

export default AboutSection;