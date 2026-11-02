INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.name IN (
    'products.read',
    'products.create',
    'products.update'
)
WHERE r.name = 'manager'
ON CONFLICT DO NOTHING;
