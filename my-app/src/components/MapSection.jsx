// MapSection.jsx
import "./MapSection.css";

export default function MapSection() {
  return (
    <section className="map-section" id="map">
      <div className="map-container">
        <div className="map-info">
          <h2>Де ми знаходимося</h2>
          <p>проспект В'ячеслава Чорновола, 16д, Львів, Львівська область, УкраЇна</p>
          <p>Телефон: +380 00 000 00 00</p>
          <p>Щодня з 08:30 до 21:00</p>
        </div>

        <div className="map-wrapper">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1584.4411954146613!2d24.023826913665282!3d49.85596856600208!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x473add0a7033ce59%3A0x93dd7adecdd2f41e!2sHARZ%20kaffee%26wein!5e0!3m2!1sru!2sno!4v1774449664379!5m2!1sru!2sno"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Карта"
          ></iframe>
        </div>
      </div>
    </section>
  );
}
