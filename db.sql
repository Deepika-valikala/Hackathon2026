CREATE DATABASE IF NOT EXISTS team_registration CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
-- Teams table
CREATE TABLE IF NOT EXISTS teams (
id INT AUTO_INCREMENT PRIMARY KEY,
team_name VARCHAR(255) NOT NULL,
leader_name VARCHAR(255) NOT NULL,
leader_email VARCHAR(255) NOT NULL,
leader_phone VARCHAR(50),
additional_members TEXT,
registration_file VARCHAR(1024), -- path to uploaded file
status ENUM('pending','approved','rejected') DEFAULT 'pending',
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;


-- Scores table
CREATE TABLE IF NOT EXISTS scores (
id INT AUTO_INCREMENT PRIMARY KEY,
team_id INT NOT NULL,
score INT NOT NULL DEFAULT 0,
notes TEXT,
recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
) ENGINE=InnoDB;


-- Example admin user table (optional)
CREATE TABLE IF NOT EXISTS admins (
id INT AUTO_INCREMENT PRIMARY KEY,
email VARCHAR(255) NOT NULL UNIQUE,
name VARCHAR(255),
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;


-- seed admin (optional)
INSERT INTO admins (email, name) VALUES ('admin@example.com', 'Admin') ON DUPLICATE KEY UPDATE email=email;