-- ============================================
-- Open Pages — Seed Data for Local Development
-- ============================================

-- Insert demo users
-- Password for both: "password123" (bcrypt hash)
INSERT INTO users (email, password_hash, display_name) VALUES
  ('alex@example.com', '$2a$10$s85IUJTYRQ2omeM84bw8A.jCqKnCjoEbkccpbJzhdW5efGy3JxFSS', 'Alex Thompson'),
  ('mia@example.com', '$2a$10$s85IUJTYRQ2omeM84bw8A.jCqKnCjoEbkccpbJzhdW5efGy3JxFSS', 'Mia Williams'),
  ('samuel@example.com', '$2a$10$s85IUJTYRQ2omeM84bw8A.jCqKnCjoEbkccpbJzhdW5efGy3JxFSS', 'Samuel Green')
ON CONFLICT (email) DO NOTHING;

-- Insert sample posts
INSERT INTO posts (user_id, title, content, status, created_at) VALUES
  (1, 'The Rise of Decentralized Finance',
   'Decentralized Finance (DeFi) is an emerging and rapidly evolving field in the blockchain industry. It refers to the shift from traditional, centralized financial systems to peer-to-peer finance enabled by decentralized technologies built on Ethereum and other blockchains. With the promise of reduced dependency on the traditional banking sector, DeFi platforms offer a wide range of services, from lending and borrowing to insurance and trading. As the DeFi ecosystem continues to mature, it is attracting more institutional interest and mainstream adoption. The total value locked in DeFi protocols has grown exponentially, signaling a fundamental shift in how we think about financial services.',
   'published', NOW() - INTERVAL '30 days'),

  (2, 'The Impact of Artificial Intelligence on Modern Businesses',
   'Artificial Intelligence (AI) is no longer a concept of the future. It''s very much a part of our present, reshaping industries and enhancing the capabilities of existing systems. From automating routine tasks to offering intelligent insights, AI is proving to be a boon for businesses. With advancements in machine learning and deep learning, businesses can now address previously insurmountable problems and tap into new opportunities. Companies that embrace AI early are seeing significant competitive advantages in efficiency, customer experience, and innovation.',
   'published', NOW() - INTERVAL '25 days'),

  (3, 'Sustainable Living: Tips for an Eco-Friendly Lifestyle',
   'Sustainability is more than just a buzzword; it''s a way of life. As the effects of climate change become more pronounced, there''s a growing realization about the need to live sustainably. From reducing waste and conserving energy to supporting eco-friendly products, there are numerous ways we can make our daily lives more environmentally friendly. This post will explore practical tips and habits that can make a significant difference. Small changes in our daily routines can collectively lead to massive positive impacts on our planet.',
   'published', NOW() - INTERVAL '20 days'),

  (1, 'Understanding Web3 and the Future of the Internet',
   'Web3 represents the next evolution of the internet, built on decentralized protocols and blockchain technology. Unlike Web2, where data is controlled by centralized platforms, Web3 envisions a user-owned internet where individuals control their data, identity, and digital assets. From decentralized apps (dApps) to NFTs and DAOs, the Web3 ecosystem is rapidly expanding. While challenges remain around scalability and user experience, the fundamental principles of decentralization and user sovereignty are driving innovation across multiple industries.',
   'published', NOW() - INTERVAL '15 days'),

  (2, 'The Art of Remote Work: Productivity Tips',
   'Remote work has transitioned from a temporary solution to a permanent fixture in the modern workplace. As more companies embrace distributed teams, mastering the art of remote work has become essential. Key strategies include establishing a dedicated workspace, maintaining regular schedules, leveraging collaboration tools effectively, and setting clear boundaries between work and personal life. The most successful remote workers also prioritize communication, regular check-ins, and continuous learning.',
   'published', NOW() - INTERVAL '10 days'),

  (3, 'Draft: Upcoming Trends in Green Energy',
   'This is a draft post exploring the latest developments in renewable energy technology. Solar panel efficiency has reached new heights, wind turbines are becoming more cost-effective, and battery storage solutions are finally making renewable energy viable at scale. Hydrogen fuel cells are emerging as a promising solution for heavy industry and long-distance transport.',
   'draft', NOW() - INTERVAL '5 days')
ON CONFLICT DO NOTHING;
