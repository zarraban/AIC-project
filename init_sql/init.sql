CREATE TABLE "Category" (
    category_number INT PRIMARY KEY,
    category_name VARCHAR(50) NOT NULL
);

CREATE TABLE "Product" (
    id_product INT PRIMARY KEY,
    category_number INT NOT NULL,
    product_name VARCHAR(50) NOT NULL,
    manufacturer VARCHAR(50) NOT NULL,
    characteristics VARCHAR(100) NOT NULL,
    FOREIGN KEY (category_number) REFERENCES "Category"(category_number) ON UPDATE CASCADE ON DELETE NO ACTION
);

CREATE TABLE "Store_Product" (
    upc VARCHAR(12) PRIMARY KEY,
    upc_prom VARCHAR(12),
    id_product INT NOT NULL,
    selling_price DECIMAL(13,4) NOT NULL CHECK (selling_price >= 0),
    products_number INT NOT NULL CHECK (products_number >= 0),
    promotional_product BOOLEAN NOT NULL,
    FOREIGN KEY (upc_prom) REFERENCES "Store_Product"(upc) ON UPDATE CASCADE ON DELETE SET NULL,
    FOREIGN KEY (id_product) REFERENCES "Product"(id_product) ON UPDATE CASCADE ON DELETE NO ACTION
);

CREATE TABLE "Employee" (
    id_employee VARCHAR(10) PRIMARY KEY,
    empl_surname VARCHAR(50) NOT NULL,
    empl_name VARCHAR(50) NOT NULL,
    empl_patronymic VARCHAR(50),
    empl_role VARCHAR(10) NOT NULL,
    salary DECIMAL(13,4) NOT NULL CHECK (salary >= 0),
    date_of_birth DATE NOT NULL,
    date_of_start DATE NOT NULL,
    phone_number VARCHAR(13) NOT NULL,
    city VARCHAR(50) NOT NULL,
    street VARCHAR(50) NOT NULL,
    zip_code VARCHAR(9) NOT NULL,
    CHECK (date_of_birth <= CURRENT_DATE - INTERVAL '18 years')
);

CREATE TABLE "Employee_Auth" (
    id_employee VARCHAR(10) PRIMARY KEY,
    login VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    FOREIGN KEY (id_employee) REFERENCES "Employee"(id_employee) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE "Customer_Card" (
    card_number VARCHAR(13) PRIMARY KEY,
    cust_surname VARCHAR(50) NOT NULL,
    cust_name VARCHAR(50) NOT NULL,
    cust_patronymic VARCHAR(50),
    phone_number VARCHAR(13) NOT NULL,
    city VARCHAR(50),
    street VARCHAR(50),
    zip_code VARCHAR(9),
    percent INT NOT NULL CHECK (percent >= 0)
);

CREATE TABLE "Receipt" (
    receipt_number VARCHAR(10) PRIMARY KEY,
    id_employee VARCHAR(10) NOT NULL,
    card_number VARCHAR(13),
    print_date TIMESTAMP NOT NULL,
    sum_total DECIMAL(13,4) NOT NULL CHECK (sum_total >= 0),
    vat DECIMAL(13,4) NOT NULL CHECK (vat >= 0),
    FOREIGN KEY (id_employee) REFERENCES "Employee"(id_employee) ON UPDATE CASCADE ON DELETE NO ACTION,
    FOREIGN KEY (card_number) REFERENCES "Customer_Card"(card_number) ON UPDATE CASCADE ON DELETE NO ACTION
);

CREATE TABLE "Sale" (
    upc VARCHAR(12) NOT NULL,
    receipt_number VARCHAR(10) NOT NULL,
    product_number INT NOT NULL CHECK (product_number >= 0),
    selling_price DECIMAL(13,4) NOT NULL CHECK (selling_price >= 0),
    PRIMARY KEY (upc, receipt_number),
    FOREIGN KEY (upc) REFERENCES "Store_Product"(upc) ON UPDATE CASCADE ON DELETE NO ACTION,
    FOREIGN KEY (receipt_number) REFERENCES "Receipt"(receipt_number) ON UPDATE CASCADE ON DELETE CASCADE
);

INSERT INTO "Category" (category_number, category_name) VALUES
(1, 'Молочні продукти'),
(2, 'М''ясні вироби'),
(3, 'Хлібобулочні вироби'),
(4, 'Напої'),
(5, 'Солодощі');
INSERT INTO "Product" (id_product, category_number, product_name, manufacturer, characteristics) VALUES
(1, 1, 'Молоко 2.5%', 'Яготинське', 'Пастеризоване, 900г'),
(2, 2, 'Ковбаса Лікарська', 'Глобино', 'Варена, вищий сорт'),
(3, 3, 'Хліб Український', 'Київхліб', 'Житній, нарізний'),
(4, 4, 'Сік Яблучний', 'Сандора', '1 літр, без цукру'),
(5, 5, 'Шоколад Світоч', 'Світоч', 'Чорний 70% какао');
INSERT INTO "Store_Product" (upc, upc_prom, id_product, selling_price, products_number, promotional_product) VALUES
('111111111111', NULL, 1, 35.50, 100, FALSE),
('222222222222', NULL, 2, 150.00, 50, FALSE),
('333333333333', NULL, 3, 25.00, 40, FALSE),
('444444444444', NULL, 4, 45.00, 60, FALSE),
('11111111111P', '111111111111', 1, 28.40, 20, TRUE);
INSERT INTO "Employee" (id_employee, empl_surname, empl_name, empl_patronymic, empl_role, salary, date_of_birth, date_of_start, phone_number, city, street, zip_code) VALUES
('mgr-001', 'Шевченко', 'Андрій', 'Миколайович', 'Manager', 25000.00, '1985-05-12', '2023-01-15', '+380501234567', 'Київ', 'Хрещатик, 1', '01001'),
('csh-001', 'Коваленко', 'Марія', 'Іванівна', 'Cashier', 15000.00, '1995-08-24', '2023-03-20', '+380671234567', 'Київ', 'Політехнічна, 10', '03056'),
('csh-002', 'Бойко', 'Олег', 'Петрович', 'Cashier', 15000.00, '1998-11-05', '2023-05-10', '+380631234567', 'Київ', 'Саксаганського, 50', '01033'),
('csh-003', 'Мельник', 'Олена', 'Василівна', 'Cashier', 14500.00, '1992-02-14', '2023-06-01', '+380991234567', 'Київ', 'Велика Васильківська, 22', '01004'),
('csh-004', 'Кравченко', 'Віктор', 'Олександрович', 'Cashier', 14000.00, '2000-09-30', '2023-08-15', '+380971234567', 'Київ', 'Перемоги, 45', '03057');
INSERT INTO "Employee_Auth" (id_employee, login, password_hash) VALUES
('mgr-001', 'mgr-001', '$2b$12$KzH1oIfm0i0QkwHK.O.oh.UbPlnRTbRI9BhbsXJkg2QYs4RrD3T6O'),
('csh-001', 'csh-001', '$2b$12$KzH1oIfm0i0QkwHK.O.oh.UbPlnRTbRI9BhbsXJkg2QYs4RrD3T6O'),
('csh-002', 'csh-002', '$2b$12$KzH1oIfm0i0QkwHK.O.oh.UbPlnRTbRI9BhbsXJkg2QYs4RrD3T6O'),
('csh-003', 'csh-003', '$2b$12$KzH1oIfm0i0QkwHK.O.oh.UbPlnRTbRI9BhbsXJkg2QYs4RrD3T6O'),
('csh-004', 'csh-004', '$2b$12$KzH1oIfm0i0QkwHK.O.oh.UbPlnRTbRI9BhbsXJkg2QYs4RrD3T6O');
INSERT INTO "Customer_Card" (card_number, cust_surname, cust_name, cust_patronymic, phone_number, city, street, zip_code, percent) VALUES
('C000000000001', 'Іваненко', 'Петро', 'Олексійович', '+380501111111', 'Київ', 'Антоновича, 15', '01004', 5),
('C000000000002', 'Ткаченко', 'Анна', 'Сергіївна', '+380672222222', 'Київ', 'Басейна, 5', '01004', 10),
('C000000000003', 'Лисенко', 'Дмитро', 'Володимирович', '+380633333333', 'Бровари', 'Київська, 10', '07400', 3),
('C000000000004', 'Савченко', 'Юлія', 'Ігорівна', '+380994444444', 'Київ', 'Голосіївська, 20', '03039', 15),
('C000000000005', 'Пономаренко', 'Сергій', 'Юрійович', '+380975555555', 'Вишневе', 'Святошинська, 40', '08132', 7);
INSERT INTO "Receipt" (receipt_number, id_employee, card_number, print_date, sum_total, vat) VALUES
('R000000001', 'csh-001', 'C000000000001', '2023-10-01 10:15:00', 209.95, 41.99),
('R000000002', 'csh-002', NULL, '2023-10-01 11:30:00', 150.00, 30.00),
('R000000003', 'csh-001', 'C000000000002', '2023-10-02 14:45:00', 346.50, 69.30),
('R000000004', 'csh-003', 'C000000000003', '2023-10-02 16:20:00', 129.88, 25.98),
('R000000005', 'csh-004', 'C000000000004', '2023-10-03 09:10:00', 450.50, 90.10);
INSERT INTO "Sale" (upc, receipt_number, product_number, selling_price) VALUES
('111111111111', 'R000000001', 2, 35.50),
('222222222222', 'R000000001', 1, 150.00),
('222222222222', 'R000000002', 1, 150.00),
('444444444444', 'R000000003', 3, 45.00),
('222222222222', 'R000000003', 1, 150.00),
('111111111111', 'R000000003', 1, 35.50),
('11111111111P', 'R000000003', 1, 28.40),
('111111111111', 'R000000004', 1, 35.50),
('11111111111P', 'R000000004', 1, 28.40),
('333333333333', 'R000000005', 4, 25.00),
('222222222222', 'R000000005', 2, 150.00);