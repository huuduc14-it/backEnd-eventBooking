CREATE TABLE users (
    user_id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name       VARCHAR(100) NOT NULL,
    email           VARCHAR(120) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    phone           VARCHAR(20),
    avatar_url      TEXT,
    role            ENUM('attendee','organizer') DEFAULT 'attendee',
    organizer_profile_completed BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE organizer_profiles (
    profile_id        BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id           BIGINT NOT NULL,
    organization_name VARCHAR(150),
    tax_code          VARCHAR(50),
    address           TEXT,
    bank_account      VARCHAR(100),
    contact_email     VARCHAR(120),
    contact_phone     VARCHAR(20),
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);
CREATE TABLE categories (
    category_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL
);

CREATE TABLE artists (
    artist_id   BIGINT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(150) NOT NULL,
    bio         TEXT,
    image_url   TEXT
);

CREATE TABLE events (
    event_id      BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id       BIGINT NOT NULL,
    category_id   BIGINT,
    title         VARCHAR(200) NOT NULL,
    description   TEXT,
    location_name VARCHAR(200) NOT NULL,
    address       TEXT,
    start_time    DATETIME NOT NULL,
    end_time      DATETIME,
    thumbnail_url TEXT,
    video_url     TEXT,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (category_id) REFERENCES categories(category_id)
);
CREATE TABLE event_artists (
    event_id   BIGINT,
    artist_id  BIGINT,
    PRIMARY KEY (event_id, artist_id),
    FOREIGN KEY (event_id) REFERENCES events(event_id),
    FOREIGN KEY (artist_id) REFERENCES artists(artist_id)
);
CREATE TABLE ticket_types (
    ticket_type_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    event_id       BIGINT NOT NULL,
    name           VARCHAR(100) NOT NULL,
    price          DECIMAL(12,2) NOT NULL,
    total_quantity INT NOT NULL,
    remaining      INT NOT NULL,
    description    TEXT,
    FOREIGN KEY (event_id) REFERENCES events(event_id)
);
CREATE TABLE seat_maps (
    seat_map_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    event_id    BIGINT NOT NULL,
    map_json    JSON NOT NULL,
    FOREIGN KEY (event_id) REFERENCES events(event_id)
);

CREATE TABLE seats (
    seat_id        BIGINT AUTO_INCREMENT PRIMARY KEY,
    seat_map_id    BIGINT NOT NULL,
    section        VARCHAR(100),
    row_label      VARCHAR(50),
    seat_number    VARCHAR(50),
    ticket_type_id BIGINT,
    is_available   BOOLEAN DEFAULT TRUE,

    FOREIGN KEY (seat_map_id) REFERENCES seat_maps(seat_map_id),
    FOREIGN KEY (ticket_type_id) REFERENCES ticket_types(ticket_type_id)
);

CREATE TABLE bookings (
    booking_id    BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id       BIGINT NOT NULL,
    event_id      BIGINT NOT NULL,
    total_amount  DECIMAL(12,2) NOT NULL,
    payment_status ENUM('pending','paid','failed') DEFAULT 'pending',
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (event_id) REFERENCES events(event_id)
);

CREATE TABLE booking_items (
    item_id        BIGINT AUTO_INCREMENT PRIMARY KEY,
    booking_id     BIGINT NOT NULL,
    ticket_type_id BIGINT NOT NULL,
    seat_id        BIGINT,
    price          DECIMAL(12,2) NOT NULL,

    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id),
    FOREIGN KEY (ticket_type_id) REFERENCES ticket_types(ticket_type_id),
    FOREIGN KEY (seat_id) REFERENCES seats(seat_id)
);

CREATE TABLE tickets (
    ticket_id    BIGINT AUTO_INCREMENT PRIMARY KEY,
    booking_item BIGINT NOT NULL,
    qr_code      VARCHAR(255) UNIQUE NOT NULL,
    is_used      BOOLEAN DEFAULT FALSE,

    FOREIGN KEY (booking_item) REFERENCES booking_items(item_id)
);
CREATE TABLE reviews (
    review_id   BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT NOT NULL,
    event_id    BIGINT NOT NULL,
    rating      INT CHECK (rating BETWEEN 1 AND 5),
    comment     TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (event_id) REFERENCES events(event_id)
);
CREATE TABLE notifications (
    notification_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    event_id        BIGINT,
    message         TEXT NOT NULL,
    is_read         BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (event_id) REFERENCES events(event_id)
);

CREATE TABLE favorites (
    user_id  BIGINT,
    event_id BIGINT,
    PRIMARY KEY (user_id, event_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (event_id) REFERENCES events(event_id)
);
CREATE TABLE promotions (
    promo_id      BIGINT AUTO_INCREMENT PRIMARY KEY,
    code          VARCHAR(50) UNIQUE NOT NULL,
    description   TEXT,
    discount_type ENUM('percent', 'fixed'),
    discount_value DECIMAL(12,2),
    start_date    DATE,
    end_date      DATE,
    event_id      BIGINT,
    FOREIGN KEY (event_id) REFERENCES events(event_id)
);

CREATE TABLE booking_promotions (
    booking_id BIGINT,
    promo_id   BIGINT,
    PRIMARY KEY (booking_id, promo_id),
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id),
    FOREIGN KEY (promo_id) REFERENCES promotions(promo_id)
);
INSERT INTO users (full_name, email, password_hash, phone, avatar_url, role, organizer_profile_completed)
VALUES
('Nguyen Van A', 'a@gmail.com', '12345', '0901234567', NULL, 'attendee', FALSE);

INSERT INTO categories (name) VALUES
('Music'),
('Theater'),
('Sports');


INSERT INTO events (user_id, category_id, title, description, location_name, address, start_time, end_time, thumbnail_url)
VALUES
(1, 1, 'Sky Tour 2025', 'Live concert', 'Quan 7 Stadium', 'District 7, HCMC', '2025-12-20 19:00:00', '2025-12-20 22:00:00',  "http://10.0.2.2/api/public/thumbnails/atsh.webp");
