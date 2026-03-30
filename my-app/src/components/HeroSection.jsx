import logo from "../assets/images/logo.png";

function HeroSection() {
  return (
    <section id="home" className="hero">
      <div className="hero__container">
        <div className="hero__logo-side">
          <img src={logo} alt="Coffee Shop logo" className="hero__logo-image" />
        </div>

        <div className="hero__content">
          <p className="hero__label">Specialty coffee</p>

          <h1 className="hero__title">HARZ</h1>

          <p className="hero__subtitle">
            Спешелті кава, навчання, обсмажування та живий підхід до кожної чашки.
          </p>

          <div className="hero__contacts">
            <div className="hero__contact">
              <span>Телефон</span>
              <a href="tel:+380991332757">+380 99 133 27 57</a>
            </div>

            <div className="hero__contact">
              <span>Instagram</span>
              <a href="https://www.instagram.com/harz_kaffee_wein/" target="_blank" rel="noreferrer">
                @harz_kaffee_wein
              </a>
            </div>

            {/* <div className="hero__contact">
              <span>Telegram</span>
              <a href="https://t.me/your_username" target="_blank" rel="noreferrer">
                @your_username
              </a>
            </div> */}
          </div>

          <div className="hero__actions">
            <a href="#shop" className="hero__button hero__button--primary">
              Перейти в магазин
            </a>

            <a href="#courses" className="hero__button hero__button--secondary">
              Переглянути курси
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;