function Header() {
  return (
    <header className="header">
      <div className="header__container">
        <div className="header__logo">HARZ KAFFEE WEIN</div>

        <nav className="header__nav">
          <a href="#home">Головна</a>
          <a href="#about">Про мене</a>
          <a href="#courses">Курси</a>
          <a href="#roasting">Обсмажка</a>
          <a href="#shop">Магазин</a>
        </nav>
      </div>
    </header>
  );
}

export default Header;