-- Create tables
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(100),
    age INTEGER,
    city VARCHAR(50),
    country VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INTEGER DEFAULT 0,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    shipping_address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    shipped_at TIMESTAMP
);

CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id),
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL
);

CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id),
    user_id INTEGER REFERENCES users(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert categories
INSERT INTO categories (name, description) VALUES
    ('Electronics', 'Electronic devices and gadgets'),
    ('Clothing', 'Fashion and apparel'),
    ('Books', 'Physical and digital books'),
    ('Home & Garden', 'Home improvement and gardening'),
    ('Sports', 'Sports equipment and gear'),
    ('Toys', 'Games and toys'),
    ('Food', 'Food and beverages'),
    ('Health', 'Health and wellness products');

-- Insert users (50 random users)
INSERT INTO users (username, email, full_name, age, city, country, is_active) VALUES
    ('johndoe', 'john.doe@email.com', 'John Doe', 28, 'New York', 'USA', true),
    ('janedoe', 'jane.doe@email.com', 'Jane Doe', 32, 'Los Angeles', 'USA', true),
    ('mikebrown', 'mike.brown@email.com', 'Mike Brown', 45, 'Chicago', 'USA', true),
    ('sarahsmith', 'sarah.smith@email.com', 'Sarah Smith', 29, 'Houston', 'USA', true),
    ('davidlee', 'david.lee@email.com', 'David Lee', 38, 'Phoenix', 'USA', false),
    ('emilyjones', 'emily.jones@email.com', 'Emily Jones', 24, 'Philadelphia', 'USA', true),
    ('chrismartin', 'chris.martin@email.com', 'Chris Martin', 41, 'San Antonio', 'USA', true),
    ('amandawhite', 'amanda.white@email.com', 'Amanda White', 35, 'San Diego', 'USA', true),
    ('danielgarcia', 'daniel.garcia@email.com', 'Daniel Garcia', 27, 'Dallas', 'USA', true),
    ('jessicarodriguez', 'jessica.rodriguez@email.com', 'Jessica Rodriguez', 31, 'San Jose', 'USA', false),
    ('matthewwilson', 'matthew.wilson@email.com', 'Matthew Wilson', 33, 'Austin', 'USA', true),
    ('ashleymoore', 'ashley.moore@email.com', 'Ashley Moore', 26, 'Jacksonville', 'USA', true),
    ('andrewtaylor', 'andrew.taylor@email.com', 'Andrew Taylor', 39, 'Fort Worth', 'USA', true),
    ('nicoleanderson', 'nicole.anderson@email.com', 'Nicole Anderson', 30, 'Columbus', 'USA', true),
    ('josephthomas', 'joseph.thomas@email.com', 'Joseph Thomas', 44, 'Charlotte', 'USA', true),
    ('stephaniejackson', 'stephanie.jackson@email.com', 'Stephanie Jackson', 28, 'San Francisco', 'USA', true),
    ('ryanmiller', 'ryan.miller@email.com', 'Ryan Miller', 36, 'Indianapolis', 'USA', true),
    ('lauradavis', 'laura.davis@email.com', 'Laura Davis', 25, 'Seattle', 'USA', false),
    ('kevinbrown', 'kevin.brown@email.com', 'Kevin Brown', 42, 'Denver', 'USA', true),
    ('melissawalker', 'melissa.walker@email.com', 'Melissa Walker', 29, 'Washington', 'USA', true),
    ('brianhall', 'brian.hall@email.com', 'Brian Hall', 37, 'Boston', 'USA', true),
    ('amymyoung', 'amy.young@email.com', 'Amy Young', 31, 'El Paso', 'USA', true),
    ('jasonking', 'jason.king@email.com', 'Jason King', 34, 'Nashville', 'USA', true),
    ('angelascott', 'angel.scott@email.com', 'Angela Scott', 27, 'Baltimore', 'USA', true),
    ('timothygreen', 'timothy.green@email.com', 'Timothy Green', 40, 'Oklahoma City', 'USA', true),
    ('victoriaadams', 'victoria.adams@email.com', 'Victoria Adams', 23, 'Las Vegas', 'USA', true),
    ('brandonbaker', 'brandon.baker@email.com', 'Brandon Baker', 35, 'Louisville', 'USA', false),
    ('samanthagonzalez', 'samantha.gonzalez@email.com', 'Samantha Gonzalez', 32, 'Portland', 'USA', true),
    ('zacharynelson', 'zachary.nelson@email.com', ' Zachary Nelson', 38, 'Miami', 'USA', true),
    ('alexiscarter', 'alexis.carter@email.com', 'Alexis Carter', 26, 'Oakland', 'USA', true),
    ('justinmitchell', 'justin.mitchell@email.com', 'Justin Mitchell', 43, 'Minneapolis', 'USA', true),
    ('michelleperez', 'michelle.perez@email.com', 'Michelle Perez', 30, 'Tucson', 'USA', true),
    ('austinroberts', 'austin.roberts@email.com', 'Austin Roberts', 28, 'Fresno', 'USA', true),
    ('jenniferturner', 'jennifer.turner@email.com', 'Jennifer Turner', 33, 'Sacramento', 'USA', false),
    ('codyphillips', 'cody.phillips@email.com', 'Cody Phillips', 41, 'Atlanta', 'USA', true),
    ('ashleycampbell', 'ashley.campbell@email.com', 'Ashley Campbell', 29, 'Kansas City', 'USA', true),
    ('jacobparker', 'jacob.parker@email.com', 'Jacob Parker', 36, 'Colorado Springs', 'USA', true),
    ('victoriadiaz', 'victoria.diaz@email.com', 'Victoria Diaz', 24, 'Raleigh', 'USA', true),
    ('dylanevans', 'dylan.evans@email.com', 'Dylan Evans', 45, 'Omaha', 'USA', true),
    ('kaylaedwards', 'kayla.edwards@email.com', 'Kayla Edwards', 31, 'Miami Beach', 'USA', true),
    ('tylergonzales', 'tyler.gonzales@email.com', 'Tyler Gonzales', 27, 'Long Beach', 'USA', true),
    ('jordancoleman', 'jordan.coleman@email.com', 'Jordan Coleman', 39, 'Virginia Beach', 'USA', true),
    ('taylorjenkins', 'taylor.jenkins@email.com', 'Taylor Jenkins', 22, 'Oakland', 'USA', true),
    ('caseyperry', 'casey.perry@email.com', 'Casey Perry', 34, 'Santo Domingo', 'Dominican Republic', true),
    ('alexpowell', 'alex.powell@email.com', 'Alex Powell', 29, 'Toronto', 'Canada', true),
    ('baileymorris', 'bailey.morris@email.com', ' Bailey Morris', 37, 'Vancouver', 'Canada', true),
    ('conormurphy', 'conor.murphy@email.com', 'Conor Murphy', 32, 'Montreal', 'Canada', true),
    ('gracekelly', 'grace.kelly@email.com', 'Grace Kelly', 26, 'Dublin', 'Ireland', true),
    ('liamobrien', 'liam.obrien@email.com', 'Liam OBrien', 40, 'London', 'UK', true),
    ('avaByrne', 'ava.byrne@email.com', 'Ava Byrne', 28, 'Manchester', 'UK', true),
    ('noahryan', 'noah.ryan@email.com', 'Noah Ryan', 35, 'Birmingham', 'UK', false);

-- Insert products (50 random products)
INSERT INTO products (name, description, category, price, stock_quantity, is_available) VALUES
    ('MacBook Pro 14"', 'Apple MacBook Pro with M3 chip, 16GB RAM, 512GB SSD', 'Electronics', 1999.99, 25, true),
    ('iPhone 15 Pro', 'Latest iPhone with A17 Pro chip, 256GB storage', 'Electronics', 1199.99, 50, true),
    ('AirPods Pro', 'Active noise cancellation, spatial audio', 'Electronics', 249.99, 100, true),
    ('Sony WH-1000XM5', 'Premium wireless noise-canceling headphones', 'Electronics', 399.99, 40, true),
    ('Samsung 65" OLED TV', '4K Smart TV with HDR10+', 'Electronics', 1799.99, 15, true),
    ('PlayStation 5', 'Next-gen gaming console with 825GB SSD', 'Electronics', 499.99, 20, false),
    ('Nintendo Switch OLED', 'Handheld gaming console with OLED screen', 'Electronics', 349.99, 35, true),
    ('iPad Air', '10.9-inch display, M2 chip, 256GB', 'Electronics', 749.99, 30, true),
    ('Dell XPS 15', '15.6" laptop, Intel i7, 32GB RAM', 'Electronics', 1599.99, 18, true),
    ('Logitech MX Master 3S', 'Ergonomic wireless mouse', 'Electronics', 99.99, 200, true),
    ('Cotton T-Shirt', '100% organic cotton, regular fit', 'Clothing', 29.99, 500, true),
    ('Denim Jeans', 'Classic fit, dark wash', 'Clothing', 79.99, 150, true),
    ('Running Shoes', 'Lightweight, breathable, size 10', 'Clothing', 129.99, 75, true),
    ('Winter Jacket', 'Waterproof, insulated', 'Clothing', 199.99, 45, true),
    ('Wool Sweater', 'Merino wool, crew neck', 'Clothing', 89.99, 80, true),
    ('Leather Belt', 'Genuine leather, adjustable', 'Clothing', 49.99, 120, true),
    ('Baseball Cap', 'Cotton twill, adjustable', 'Clothing', 24.99, 200, true),
    ('Sneakers', 'Canvas upper, rubber sole', 'Clothing', 59.99, 90, true),
    ('Sunglasses', 'UV protection, polarized', 'Clothing', 79.99, 60, true),
    ('Fitness Leggings', 'High-waisted, compression', 'Clothing', 54.99, 180, true),
    ('Clean Code', 'Robert C. Martin, software engineering', 'Books', 44.99, 100, true),
    ('The Pragmatic Programmer', 'David Thomas, programming guide', 'Books', 49.99, 75, true),
    ('Design Patterns', 'Gang of Four, software design', 'Books', 54.99, 60, true),
    ('Introduction to Algorithms', 'CLRS, comprehensive algorithm guide', 'Books', 89.99, 40, true),
    ('JavaScript: The Good Parts', 'Douglas Crockford, JS best practices', 'Books', 29.99, 120, true),
    ('Python Crash Course', 'Eric Matthes, beginner friendly', 'Books', 39.99, 90, true),
    ('Refactoring', 'Martin Fowler, code improvement', 'Books', 52.99, 55, true),
    ('Structure and Interpretation', 'Harold Abelson, programming basics', 'Books', 69.99, 30, true),
    ('The Mythical Man-Month', 'Frederick Brooks, project management', 'Books', 34.99, 45, true),
    ('You Dont Know JS', 'Kyle Simpson, deep dive into JS', 'Books', 36.99, 80, true),
    ('Garden Tool Set', '10-piece set with carrying case', 'Home & Garden', 79.99, 50, true),
    ('LED Desk Lamp', 'Adjustable brightness, USB charging', 'Home & Garden', 45.99, 100, true),
    ('Plant Pot Set', 'Ceramic pots, 5-piece', 'Home & Garden', 39.99, 70, true),
    ('Memory Foam Pillow', 'Ergonomic, queen size', 'Home & Garden', 59.99, 85, true),
    ('Weighted Blanket', '15lbs, cooling fabric', 'Home & Garden', 129.99, 40, true),
    ('Air Purifier', 'HEPA filter, smart sensor', 'Home & Garden', 199.99, 25, true),
    ('Coffee Maker', '12-cup capacity, programmable', 'Home & Garden', 89.99, 55, true),
    ('Robot Vacuum', 'Self-charging, mapping technology', 'Home & Garden', 349.99, 20, false),
    ('Scented Candles', 'Lavender, set of 3', 'Home & Garden', 24.99, 150, true),
    ('Throw Blanket', 'Soft fleece, 50x60 inches', 'Home & Garden', 34.99, 95, true),
    ('Tennis Racket', 'Carbon fiber, professional grade', 'Sports', 189.99, 30, true),
    ('Basketball', 'Official size, indoor/outdoor', 'Sports', 29.99, 80, true),
    ('Yoga Mat', 'Non-slip, 6mm thickness', 'Sports', 39.99, 120, true),
    ('Dumbbells Set', 'Adjustable 5-25 lbs, pair', 'Sports', 149.99, 45, true),
    ('Running Watch', 'GPS, heart rate monitor', 'Sports', 299.99, 25, true),
    ('Cycling Helmet', 'Ventilated, adjustable fit', 'Sports', 79.99, 60, true),
    ('Soccer Ball', 'Match grade, size 5', 'Sports', 34.99, 90, true),
    ('Golf Clubs Set', 'Driver, irons, putter, 12-piece', 'Sports', 799.99, 15, true),
    ('Resistance Bands', '5 levels, with handles', 'Sports', 29.99, 140, true),
    ('Foam Roller', 'High-density, 18 inches', 'Sports', 24.99, 100, true),
    ('Building Blocks Set', '500 pieces, creative building', 'Toys', 39.99, 65, true),
    ('Remote Control Car', 'High speed, rechargeable', 'Toys', 79.99, 40, true),
    ('Board Game - Strategy', 'Family strategy game', 'Toys', 44.99, 55, true),
    ('Puzzle 1000pc', 'Landscape scenery', 'Toys', 19.99, 90, true),
    ('Stuffed Animal', 'Plush bear, 16 inches', 'Toys', 24.99, 110, true),
    ('Art Set', 'Drawing supplies, 150 pieces', 'Toys', 49.99, 50, true),
    ('Drone with Camera', '1080p video, 30min flight', 'Toys', 199.99, 25, false),
    ('Video Game', 'Action adventure, PS5/Xbox', 'Toys', 59.99, 75, true),
    ('Organic Coffee Beans', 'Medium roast, 2lb bag', 'Food', 24.99, 200, true),
    ('Green Tea Collection', 'Variety pack, 100 bags', 'Food', 18.99, 150, true),
    ('Protein Bars', 'Chocolate, box of 12', 'Food', 34.99, 120, true),
    ('Olive Oil', 'Extra virgin, 1 liter', 'Food', 19.99, 80, true),
    ('Dark Chocolate', '70% cacao, 3.5 oz', 'Food', 7.99, 250, true),
    ('Honey', 'Raw, organic, 16 oz', 'Food', 14.99, 100, true),
    ('Vitamin D3', '5000 IU, 180 capsules', 'Health', 15.99, 300, true),
    ('Probiotic', '50 billion CFU, 30 capsules', 'Health', 29.99, 180, true),
    ('Fish Oil', '1000mg, 120 softgels', 'Health', 24.99, 200, true),
    ('Multivitamin', 'Daily, 90 tablets', 'Health', 19.99, 250, true),
    ('Sleep Aid', 'Melatonin, 120 gummies', 'Health', 14.99, 150, true),
    ('Protein Powder', 'Vanilla, 5 lbs', 'Health', 69.99, 90, true),
    ('Hand Sanitizer', 'Alcohol based, 8 oz', 'Health', 9.99, 400, true),
    ('Face Mask Set', 'Disposable, 50 pack', 'Health', 19.99, 350, true);

-- Insert orders (100 random orders)
INSERT INTO orders (user_id, total_amount, status, shipping_address, shipped_at)
SELECT 
    (RANDOM() * 49 + 1)::INTEGER,
    (RANDOM() * 500 + 20)::DECIMAL(10,2),
    (ARRAY['pending', 'processing', 'shipped', 'delivered', 'cancelled'])[FLOOR(RANDOM() * 5 + 1)::INTEGER],
    '123 Main St, City, State, 12345',
    CASE WHEN RANDOM() > 0.3 THEN CURRENT_TIMESTAMP - (RANDOM() * 30 || ' days')::INTERVAL ELSE NULL END
FROM generate_series(1, 100);

-- Insert order items (multiple items per order)
DO $$
DECLARE
    order_rec RECORD;
    num_items INTEGER;
    product_id_var INTEGER;
    quantity_var INTEGER;
    price_var DECIMAL(10,2);
BEGIN
    FOR order_rec IN SELECT id FROM orders LOOP
        num_items := (RANDOM() * 3 + 1)::INTEGER;
        FOR i IN 1..num_items LOOP
            product_id_var := (RANDOM() * 69 + 1)::INTEGER;
            quantity_var := (RANDOM() * 3 + 1)::INTEGER;
            SELECT price INTO price_var FROM products WHERE id = product_id_var;
            
            INSERT INTO order_items (order_id, product_id, quantity, unit_price)
            VALUES (order_rec.id, product_id_var, quantity_var, price_var);
        END LOOP;
    END LOOP;
END $$;

-- Insert reviews (150 random reviews)
INSERT INTO reviews (product_id, user_id, rating, comment)
SELECT 
    (RANDOM() * 69 + 1)::INTEGER,
    (RANDOM() * 49 + 1)::INTEGER,
    (RANDOM() * 4 + 1)::INTEGER,
    (ARRAY[
        'Great product! Highly recommended.',
        'Good quality, fast shipping.',
        'Not bad, but could be better.',
        'Exceeded my expectations.',
        'Average product, fair price.',
        'Love it! Will buy again.',
        'Decent for the price.',
        'Pretty good, no complaints.',
        'Awesome! Exactly what I needed.',
        'Solid product, works as expected.'
    ])[FLOOR(RANDOM() * 10 + 1)::INTEGER]
FROM generate_series(1, 150);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);

-- Verify data
SELECT 'Users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Products', COUNT(*) FROM products
UNION ALL
SELECT 'Orders', COUNT(*) FROM orders
UNION ALL
SELECT 'Order Items', COUNT(*) FROM order_items
UNION ALL
SELECT 'Categories', COUNT(*) FROM categories
UNION ALL
SELECT 'Reviews', COUNT(*) FROM reviews;