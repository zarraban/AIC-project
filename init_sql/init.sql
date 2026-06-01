CREATE TABLE "Category" (
    category_number INT PRIMARY KEY,
    category_name VARCHAR(50) NOT NULL
);

CREATE TABLE "Product" (
    id_product INT PRIMARY KEY,
    category_number INT NOT NULL,
    product_name VARCHAR(50) NOT NULL,
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