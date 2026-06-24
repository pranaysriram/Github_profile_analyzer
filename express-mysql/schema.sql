-- GitHub Profile Analyzer schema
CREATE DATABASE IF NOT EXISTS github_analyzer
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE github_analyzer;

CREATE TABLE IF NOT EXISTS profiles (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  github_id       BIGINT UNIQUE NOT NULL,
  username        VARCHAR(255) UNIQUE NOT NULL,
  name            VARCHAR(255),
  avatar_url      TEXT,
  bio             TEXT,
  company         VARCHAR(255),
  location        VARCHAR(255),
  blog            VARCHAR(500),
  email           VARCHAR(255),
  twitter_username VARCHAR(255),

  public_repos    INT DEFAULT 0,
  public_gists    INT DEFAULT 0,
  followers       INT DEFAULT 0,
  following       INT DEFAULT 0,

  total_stars     INT DEFAULT 0,
  total_forks     INT DEFAULT 0,
  top_language    VARCHAR(100),
  languages_json  JSON,
  top_repos_json  JSON,

  account_created_at DATETIME,
  account_updated_at DATETIME,

  analyzed_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_username (username),
  INDEX idx_followers (followers),
  INDEX idx_stars (total_stars)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
