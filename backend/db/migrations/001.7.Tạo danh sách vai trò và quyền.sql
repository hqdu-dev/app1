INSERT INTO roles (name)
VALUES
    ('admin'),
    ('user'),
    ('manager')
ON CONFLICT (name) DO NOTHING;