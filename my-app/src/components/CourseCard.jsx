function CourseCard({ course, onClick }) {
  const imageSrc = course.imageFileId
    ? `http://localhost:5000/api/images/${course.imageFileId}`
    : null;

  return (
    <div className="course-card course-card--clickable" onClick={onClick}>
      <div className="course-card__image">
        {imageSrc ? (
          <img src={imageSrc} alt={course.title} />
        ) : (
          <div className="course-card__placeholder">Немає фото</div>
        )}
      </div>

      <div className="course-card__content">
        <h3 className="course-card__title">{course.title}</h3>
        <p className="course-card__description">{course.description}</p>
        <div className="course-card__price">{course.price} грн</div>
      </div>
    </div>
  );
}

export default CourseCard;