import { useEffect, useState, useMemo, useRef } from "react";
import { getProducts } from "./services/productService";
import { createOrder } from "./services/orderService";
import ProductCard from "./components/ProductCard";
import Cart from "./components/Cart";
import CheckoutForm from "./components/CheckoutForm";
import Header from "./components/Header";
import { getAboutContent } from "./services/aboutService";
import AboutSection from "./components/AboutSection";
import "./App.css";
import CourseCard from "./components/CourseCard";
import CourseModal from "./components/CourseModal";
import { getCourses } from "./services/courseService";
import { getRoastingContent } from "./services/roastingService";
import RoastingSection from "./components/RoastingSection";
import RoastingModal from "./components/RoastingModal";
import HeroSection from "./components/HeroSection";
import Footer from "./components/Footer";

function App() {
  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [about, setAbout] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courses, setCourses] = useState([]);
  const [roasting, setRoasting] = useState(null);
  const [isRoastingModalOpen, setIsRoastingModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortType, setSortType] = useState("default");
  const coffeeRef = useRef(null);

  const itemsPerPage = 6;

  const sortedProducts = useMemo(() => {
    const copy = [...products];

    if (sortType === "name") {
      return copy.sort((a, b) => a.name.localeCompare(b.name));
    }

    if (sortType === "price") {
      return copy.sort((a, b) => a.price - b.price);
    }

    return copy;
  }, [products, sortType]);

  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);

  const safeCurrentPage = Math.min(currentPage, Math.max(totalPages, 1));

  const currentProducts = useMemo(() => {
    const start = (safeCurrentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return sortedProducts.slice(start, end);
  }, [sortedProducts, safeCurrentPage]);

  const changePage = (page) => {
    if (page < 1 || page > totalPages) return;

    setCurrentPage(page);

    setTimeout(() => {
      const element = coffeeRef.current;
      if (!element) return;

      const headerOffset = window.innerWidth <= 768 ? 110 : 90;
      const extraOffset = -20;
      const y =
        element.getBoundingClientRect().top +
        window.pageYOffset -
        headerOffset -
        extraOffset;

      window.scrollTo({
        top: y,
        behavior: "smooth",
      });
    }, 0);
  };

  useEffect(() => {
    const loadRoasting = async () => {
      try {
        const data = await getRoastingContent();
        setRoasting(data);
      } catch (error) {
        console.error("Failed to load roasting content:", error.message);
      }
    };

    loadRoasting();
  }, []);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const data = await getCourses();
        setCourses(data);
      } catch (error) {
        console.error("Failed to load courses:", error.message);
      }
    };

    loadCourses();
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      const data = await getProducts();
      setProducts(data);
    };

    loadProducts();
  }, []);

  useEffect(() => {
    const loadAbout = async () => {
      try {
        const data = await getAboutContent();
        setAbout(data);
      } catch (error) {
        console.error("Failed to load about content:", error.message);
      }
    };

    loadAbout();
  }, []);

  const handleAddToCart = (product) => {
    setCartItems((prev) => {
      const existingItem = prev.find((item) => item.id === product.id);

      if (existingItem) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }

      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const handleIncreaseQuantity = (productId) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, quantity: item.quantity + 1 } : item,
      ),
    );
  };

  const handleDecreaseQuantity = (productId) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const handleRemoveFromCart = (productId) => {
    setCartItems((prev) => prev.filter((item) => item.id !== productId));
  };

  const handleSubmitOrder = async (orderData) => {
    await createOrder(orderData);
  };

  const handleOrderSuccess = () => {
    setCartItems([]);
  };

  return (
    <>
      <Header />

      <main>
        <HeroSection />

        <section id="about" className="section">
          <AboutSection about={about} />
        </section>

        <section id="courses" className="section">
          <h2 className="section-title">Курси</h2>
          <p className="section-subtitle">Інформація про курси.</p>

          <div className="courses-grid">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onClick={() => setSelectedCourse(course)}
              />
            ))}
          </div>
        </section>

        {selectedCourse && (
          <CourseModal
            course={selectedCourse}
            onClose={() => setSelectedCourse(null)}
          />
        )}

        <section id="roasting" className="section">
          <RoastingSection
            roasting={roasting}
            onOpenModal={() => setIsRoastingModalOpen(true)}
          />
        </section>

        {isRoastingModalOpen && (
          <RoastingModal
            roasting={roasting}
            onClose={() => setIsRoastingModalOpen(false)}
          />
        )}

        <section id="shop" className="section">
          <h2>Магазин</h2>

          <div className="app">
            <header className="hero">
              <p className="hero__subtitle">Specialty coffee beans</p>
              <h1 className="hero__title">HARZ Coffee Shop</h1>
              <p className="hero__text">
                Оберіть каву, додайте позиції до кошика та надішліть замовлення. Ми
                зв'яжемося з вами для уточнення деталей та оплати.
              </p>
            </header>

            <main className="page-content">
              <section className="products-section" id="shop">
                <div className="products-header">
                  <h2 className="section-title" ref={coffeeRef}>
                    Кава
                  </h2>

                  <div className="products-sort">
                    <button
                      className={sortType === "name" ? "active" : ""}
                      onClick={() => setSortType("name")}
                    >
                      За назвою
                    </button>

                    <button
                      className={sortType === "price" ? "active" : ""}
                      onClick={() => setSortType("price")}
                    >
                      За ціною
                    </button>
                  </div>
                </div>

                <div className="products-grid">
                  {currentProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={handleAddToCart}
                    />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="pagination">
                    <button
                      onClick={() => changePage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Назад
                    </button>

                    {Array.from({ length: totalPages }, (_, index) => {
                      const page = index + 1;

                      return (
                        <button
                          key={page}
                          className={currentPage === page ? "active" : ""}
                          onClick={() => changePage(page)}
                        >
                          {page}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => changePage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Вперед
                    </button>
                  </div>
                )}
              </section>

              <aside className="sidebar">
                <Cart
                  cartItems={cartItems}
                  onIncrease={handleIncreaseQuantity}
                  onDecrease={handleDecreaseQuantity}
                  onRemove={handleRemoveFromCart}
                />

                <CheckoutForm
                  cartItems={cartItems}
                  onSubmitOrder={handleSubmitOrder}
                  onSuccess={handleOrderSuccess}
                />
              </aside>
            </main>
          </div>
        </section>

        <section className="location-section" id="location">
          <div className="location-image">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1584.4411954146613!2d24.023826913665282!3d49.85596856600208!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x473add0a7033ce59%3A0x93dd7adecdd2f41e!2sHARZ%20kaffee%26wein!5e0!3m2!1sru!2sno!4v1774449664379!5m2!1sru!2sno"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Де ми знаходимося"
              allowFullScreen
            ></iframe>
          </div>

          <div className="location-content">
            <h2>Де ми знаходимося</h2>

            <p>
              Ми знаходимося в зручному місці, куди легко добратися пішки, на
              машині або громадським транспортом.
            </p>

            <p>
              <strong>Адреса:</strong> проспект В'ячеслава Чорновола, 16д, Львів, Львівська область, Україна
            </p>
            <p>
              <strong>Час роботи:</strong> щодня з 08:30 до 21:00
            </p>
            <p>
              <strong>Телефон:</strong> +380 99 133 27 57
            </p>

            <a
              className="location-button"
              href="https://www.google.com/maps?ll=49.855942,24.024774&z=15&t=m&hl=ru&gl=NO&mapclient=embed&cid=10654807390782944286"
              target="_blank"
              rel="noreferrer"
            >
              Відкрити маршрут
            </a>
          </div>
        </section>
        <Footer />
      </main>
    </>
  );
}

export default App;
