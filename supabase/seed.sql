-- Demo user (requires auth.user to exist first)
-- Run this after creating a user in Supabase Auth

-- Insert demo profile (replace auth_uid with actual user id)
-- INSERT INTO profiles (id, handle, display_name, bio, theme, links) 
-- VALUES ('your-auth-uid-here', 'jose', 'Jose', 'Creator & Scientist', '{"primary": "#1E3A5F"}', '[{"name": "Twitter", "url": "https://twitter.com/jose"}]');

-- Demo feed items for testing
INSERT INTO feed_items (user_id, source, title, summary, url, ts, dedupe_hash, visibility) VALUES
('00000000-0000-0000-0000-000000000001', 'app', 'Welcome to DreamEngin', 'Your private home with everything. Customize your dashboard, connect your accounts, and start creating.', '/home', NOW(), 'demo-welcome-1', 'private'),
('00000000-0000-0000-0000-000000000001', 'youtube', 'Getting Started with Next.js', 'Learn the fundamentals of Next.js and build your first app', 'https://youtube.com/watch?v=demo123', NOW(), 'demo-youtube-1', 'private'),
('00000000-0000-0000-0000-000000000001', 'demo', 'Connect Your YouTube Account', 'Link your YouTube channel to automatically import new videos to your feed', 'https://example.com/connect-youtube', NOW(), 'demo-connect-1', 'private');

-- Demo widgets
INSERT INTO widget_instances (user_id, type, config_json, "order", enabled) VALUES
('00000000-0000-0000-0000-000000000001', 'notifications', '{"position": "top-right"}', 0, true),
('00000000-0000-0000-0000-000000000001', 'promo', '{"text": "Check out the Lab!"}', 1, true),
('00000000-0000-0000-0000-000000000001', 'next_stream', '{"channel": "jose"}', 2, true),
('00000000-0000-0000-0000-000000000001', 'messages', '{"unread": 3}', 3, true);

-- Demo ad slots
INSERT INTO ad_slots (owner_id, placement, price_day, price_week, active) VALUES
('00000000-0000-0000-0000-000000000001', 'profile_header', 5.00, 25.00, true),
('00000000-0000-0000-0000-000000000001', 'dashboard_sidebar', 3.00, 15.00, true),
('00000000-0000-0000-0000-000000000001', 'feed_promo', 10.00, 50.00, false);

-- Demo music releases
INSERT INTO music_releases (owner_id, title, embed_url, visibility) VALUES
('00000000-0000-0000-0000-000000000001', 'DreamEngin Theme Song', 'https://youtube.com/embed/demo123', 'public'),
('00000000-0000-0000-0000-000000000001', 'Late Night Coding', 'https://open.spotify.com/embed/track/demo456', 'public');

-- Demo merch
INSERT INTO merch (owner_id, title, description, price, stock, image_url) VALUES
('00000000-0000-0000-0000-000000000001', 'DreamEngin Sticker Pack', 'High quality vinyl stickers', 5.00, 100, 'https://example.com/sticker.jpg'),
('00000000-0000-0000-0000-000000000001', 'Developer Hoodie', 'Comfortable hoodie for coding sessions', 45.00, 25, 'https://example.com/hoodie.jpg');

-- Demo lab projects
INSERT INTO projects (owner_id, title, description, visibility) VALUES
('00000000-0000-0000-0000-000000000001', 'Quantum Computing Simulator', 'Interactive quantum circuit simulator built with React', 'public'),
('00000000-0000-0000-0000-000000000001', 'Neural Network Visualization', 'Visualize neural network architectures and training', 'private');

-- Demo notebooks
INSERT INTO notebooks (project_id, content, version) VALUES
((SELECT id FROM projects WHERE title = 'Quantum Computing Simulator' LIMIT 1), '# Quantum Computing Simulator\n\nThis project aims to create an interactive quantum circuit simulator.\n\n## Features\n- Drag and drop quantum gates\n- Real-time state visualization\n- Export to QASM format', 1),
((SELECT id FROM projects WHERE title = 'Neural Network Visualization' LIMIT 1), '# Neural Network Visualization\n\nVisualizing complex neural network architectures.\n\n## TODO\n- [ ] Layer visualization\n- [ ] Training progress\n- [ ] Architecture comparison', 1);

-- Demo feed rules
INSERT INTO feed_rules (user_id, type, target, value) VALUES
('00000000-0000-0000-0000-000000000001', 'mute', 'spam_channel', '{"reason": "too many posts"}'),
('00000000-0000-0000-0000-000000000001', 'boost', 'science', '{"multiplier": 1.5}');