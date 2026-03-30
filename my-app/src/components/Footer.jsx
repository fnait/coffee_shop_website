import logo from "../assets/images/wlogo.png";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
      <div className="footer-left">
        <div className="footer-brand">
          <img src={logo} alt="Coffee Shop logo" className="footer-logo" />

          <div className="footer-text">
            <h3>HARZ KAFFEE WEIN</h3>
            <p>проспект В'ячеслава Чорновола, 16д, Львів, Львівська область, Україна</p>
            <p>Щодня: 08:30 – 21:00</p>
          </div>
        </div>
      </div>

        <div className="footer-center">
          <a style={{ textDecoration: "none" }} href="tel:+380991332757">+380 99 133 27 57</a> <br />
          <a style={{ textDecoration: "none" }} href="https://www.instagram.com/harz_kaffee_wein/" target="_blank" rel="noreferrer">
            @harz_kaffee_wein
          </a>
        </div>

        <div className="footer-right">
          <a
            href="https://maps.app.goo.gl/ds3GvMFTgyWHoSAC6"
            target="_blank"
            rel="noreferrer"
          >
            Відкрити карту
          </a>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} HARZ KAFFEE WEIN. Всі права захищені.</p>
      </div>
    </footer>
  );
}