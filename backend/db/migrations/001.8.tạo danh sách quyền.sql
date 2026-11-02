INSERT INTO permissions (name)
VALUES
    ('products.read'),
    ('products.create'),
    ('products.update'),
    ('products.delete')
ON CONFLICT (name) DO NOTHING;