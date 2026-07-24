-- ============================================
-- INSERT MOCK PROJECTS
-- ============================================

INSERT INTO projects (project_name, industry, business_model, target_market, budget, description) VALUES
-- Technology Projects
('EcoTech Solutions', 'Technology', 'B2B', 'Enterprise businesses in North America', 250000, 'AI-powered energy management system for large commercial buildings. Uses machine learning to optimize energy consumption and reduce carbon footprint by up to 30%.'),
('CloudSync Pro', 'Technology', 'SaaS', 'Small and medium businesses globally', 150000, 'Cloud-based file synchronization and backup solution with end-to-end encryption. Features automatic versioning, team collaboration, and seamless integration with popular productivity tools.'),
('SmartHome AI', 'Technology', 'B2C', 'Tech-savvy homeowners in US and Europe', 350000, 'Intelligent home automation system that learns user preferences and automatically adjusts lighting, temperature, and security settings. Compatible with major IoT devices and voice assistants.'),
('DataVault Security', 'Technology', 'B2B', 'Financial institutions and healthcare providers', 500000, 'Enterprise-grade data security platform offering real-time threat detection, encryption, and compliance monitoring. Designed to meet GDPR, HIPAA, and PCI-DSS requirements.'),
('DevFlow Automation', 'Technology', 'SaaS', 'Software development teams globally', 180000, 'DevOps automation platform streamlining CI/CD pipelines, automated testing, and deployment processes. Supports multiple cloud providers and container orchestration.'),
('AI Chat Assist', 'Technology', 'B2C', 'E-commerce and customer service businesses', 220000, 'Intelligent chatbot platform powered by advanced NLP. Provides automated customer support, lead generation, and personalized shopping assistance across multiple channels.'),
('BlockTrack Solutions', 'Technology', 'B2B', 'Supply chain and logistics companies', 400000, 'Blockchain-based supply chain tracking system providing end-to-end visibility, authenticity verification, and smart contract automation for international trade.'),
('CyberShield AI', 'Technology', 'B2B', 'SMEs and enterprise organizations', 450000, 'AI-powered cybersecurity platform with automated threat detection, incident response, and vulnerability assessment. Features real-time monitoring and predictive analytics.'),

-- Healthcare Projects
('HealthTrack Pro', 'Healthcare', 'B2B', 'Hospitals and healthcare providers', 300000, 'Comprehensive patient management system with EHR integration, appointment scheduling, and telemedicine capabilities. Features AI-powered diagnosis assistance and predictive health analytics.'),
('MediConnect', 'Healthcare', 'B2C', 'Patients and healthcare consumers', 200000, 'Health tracking platform connecting patients with healthcare providers. Includes symptom checker, medication reminders, and secure health data sharing.'),
('VitalSense Wearable', 'Healthcare', 'B2C', 'Health-conscious consumers worldwide', 275000, 'Advanced wearable device monitoring vital signs including heart rate, blood oxygen, sleep patterns, and stress levels. Features AI health insights and emergency alerts.'),
('PharmaChain', 'Healthcare', 'B2B', 'Pharmaceutical companies and distributors', 350000, 'Blockchain-based pharmaceutical supply chain tracking ensuring drug authenticity, temperature monitoring, and regulatory compliance from manufacturer to patient.'),
('MentalWellness AI', 'Healthcare', 'B2C', 'Individuals seeking mental health support', 180000, 'AI-powered mental health platform offering personalized therapy sessions, mood tracking, cognitive behavioral therapy exercises, and 24/7 crisis support via chatbot.'),
('Genome Analytics', 'Healthcare', 'B2B', 'Research institutions and precision medicine providers', 600000, 'Genomic data analysis platform for personalized medicine. Processes DNA sequencing data to identify genetic markers for disease susceptibility and treatment optimization.'),
('TeleHealth Plus', 'Healthcare', 'B2B', 'Rural and underserved communities', 250000, 'Comprehensive telemedicine platform with video consultations, remote monitoring, and AI-assisted diagnostics. Designed for areas with limited healthcare access.'),
('NutriAI', 'Healthcare', 'B2C', 'Health-conscious consumers and fitness enthusiasts', 160000, 'AI-powered nutrition planning and meal tracking app. Provides personalized diet recommendations based on health goals, dietary restrictions, and genetic factors.'),

-- Finance Projects
('FinTech Analytics', 'Finance', 'B2B', 'Financial institutions and investment firms', 450000, 'Advanced financial analytics platform providing real-time market insights, automated trading strategies, risk assessment, and portfolio optimization using machine learning.'),
('SmartPay Wallet', 'Finance', 'B2C', 'Digital-first consumers in emerging markets', 200000, 'Digital wallet and payment platform with AI fraud detection, instant transfers, investment options, and seamless merchant integration. Supports multiple currencies and crypto.'),
('CreditScore AI', 'Finance', 'B2B', 'Banks and lending institutions', 350000, 'Alternative credit scoring system using AI to analyze non-traditional data sources including social media, payment history, and behavioral patterns for financial inclusion.'),
('InvestAI Robo', 'Finance', 'B2C', 'Millennial and Gen Z investors', 280000, 'AI-powered robo-advisory platform offering automated investment strategies, portfolio rebalancing, tax-loss harvesting, and personalized financial planning based on individual goals.'),
('FraudShield', 'Finance', 'B2B', 'E-commerce platforms and payment processors', 400000, 'Real-time fraud detection system using machine learning to identify suspicious transactions, prevent chargebacks, and reduce false positives. Features adaptive learning algorithms.'),
('InsurTech Pro', 'Finance', 'B2C', 'Insurance seekers and policyholders', 220000, 'AI-powered insurance comparison and recommendation platform. Analyzes user needs and preferences to suggest optimal insurance policies with automated claims processing.'),
('BlockVault Asset', 'Finance', 'B2B', 'High-net-worth individuals and institutions', 550000, 'Institutional-grade crypto asset management platform with secure custody, trading, staking, and DeFi integration. Features compliance monitoring and portfolio analytics.'),
('PaySecure Plus', 'Finance', 'B2B', 'Merchants and online retailers', 300000, 'Secure payment gateway with AI-powered fraud prevention, multi-currency support, subscription management, and seamless checkout experience for e-commerce businesses.'),

-- Education Projects
('EduLearn Platform', 'Education', 'B2C', 'Students and lifelong learners globally', 180000, 'Interactive online learning platform with AI-powered personalization, gamification, peer collaboration, and real-time progress tracking. Features adaptive difficulty and personalized recommendations.'),
('SkillBridge AI', 'Education', 'B2B', 'Corporate training and professional development', 250000, 'AI-driven corporate training platform with skill assessment, personalized learning paths, and automated certification tracking. Designed for enterprise learning and development programs.'),
('SmartClass', 'Education', 'B2B', 'K-12 schools and higher education institutions', 200000, 'AI-enhanced classroom management system with attendance tracking, student performance analytics, personalized learning recommendations, and parent communication features.'),
('LanguageLab AI', 'Education', 'B2C', 'Language learners worldwide', 160000, 'AI-powered language learning platform with speech recognition, personalized lesson plans, cultural immersion, and real-time feedback. Supports 20+ languages with native-level pronunciation.'),
('STEM Academy', 'Education', 'B2C', 'Students interested in STEM careers', 190000, 'Interactive STEM education platform with virtual labs, coding challenges, project-based learning, and mentorship programs. Focuses on practical skills and career readiness.'),
('EduAssist AI', 'Education', 'B2B', 'Educational institutions and tutoring centers', 170000, 'AI tutoring assistant providing personalized homework help, test preparation, and skill development across multiple subjects. Features adaptive difficulty and progress tracking.'),

-- Retail and E-commerce
('ShopSmart AI', 'Retail', 'B2C', 'Online shoppers globally', 220000, 'AI-powered e-commerce platform with personalized product recommendations, visual search, and augmented reality try-on features. Uses machine learning for inventory optimization and demand forecasting.'),
('Retail Analytics Pro', 'Retail', 'B2B', 'Physical and online retailers', 280000, 'Retail intelligence platform providing customer behavior analysis, inventory optimization, price optimization, and predictive analytics for retail businesses.'),
('MarketPlace Connect', 'E-commerce', 'B2B', 'SMEs and individual sellers', 200000, 'Multi-vendor marketplace platform with integrated payment processing, shipping management, and AI-powered seller analytics. Features dispute resolution and quality assurance.'),
('FashionTech AI', 'Retail', 'B2C', 'Fashion-conscious consumers', 250000, 'AI-powered fashion recommendation platform with virtual try-on, style suggestions, personalized outfit planning, and sustainable fashion recommendations.'),
('GroceryBot AI', 'Retail', 'B2C', 'Busy families and meal planners', 160000, 'Smart grocery shopping and meal planning assistant using AI to recommend personalized recipes, create shopping lists, and optimize for dietary preferences and budget constraints.'),
('OmniChannel Retail', 'Retail', 'B2B', 'Brick-and-mortar and online retailers', 300000, 'Omnichannel retail management platform with unified inventory, customer data integration, and personalized marketing across all channels. Features automated fulfillment and returns.'),

-- Manufacturing and Energy
('SmartFactory AI', 'Manufacturing', 'B2B', 'Manufacturing facilities and industrial plants', 500000, 'AI-powered manufacturing optimization platform with predictive maintenance, quality control, supply chain optimization, and real-time production monitoring using IoT sensors.'),
('GreenGrid Energy', 'Energy', 'B2B', 'Energy utilities and smart cities', 450000, 'Smart grid management system optimizing energy distribution, predicting demand, integrating renewables, and reducing waste using AI and IoT technology.'),
('EcoFleet', 'Transportation', 'B2B', 'Logistics and transportation companies', 350000, 'AI-powered fleet management system optimizing routes, reducing fuel consumption, predicting maintenance, and improving driver safety. Features real-time tracking and analytics.'),
('WaterTech Solutions', 'Energy', 'B2B', 'Water utilities and agriculture', 300000, 'Smart water management system with AI-powered leak detection, usage optimization, water quality monitoring, and predictive maintenance for infrastructure.'),
('SolarAI Optimizer', 'Energy', 'B2C', 'Residential and commercial solar panel owners', 200000, 'Solar energy optimization platform using AI to maximize energy generation, predict maintenance needs, optimize consumption patterns, and automate grid integration.'),
('WasteWise AI', 'Energy', 'B2B', 'Waste management companies and municipalities', 250000, 'AI-powered waste management optimization with route optimization, recycling identification, waste sorting automation, and sustainability analytics.'),
('AgriTech AI', 'Agriculture', 'B2B', 'Farmers and agricultural businesses', 280000, 'Precision agriculture platform using AI for crop monitoring, yield prediction, pest detection, and resource optimization. Features drone integration and automated irrigation.'),

-- Real Estate and Construction
('PropTech AI', 'Real Estate', 'B2C', 'Home buyers and renters', 300000, 'AI-powered real estate platform with property valuation, market predictions, personalized recommendations, and virtual property tours. Features automated property management and tenant screening.'),
('ConstructAI', 'Construction', 'B2B', 'Construction companies and developers', 450000, 'Construction project management platform with AI-powered risk assessment, budget optimization, timeline prediction, and quality control. Features real-time collaboration and documentation.'),
('HomeValue AI', 'Real Estate', 'B2C', 'Property owners and investors', 220000, 'AI property valuation and investment analysis platform providing market insights, rental yield calculations, renovation ROI, and property comparison tools.'),
('SmartBuild', 'Construction', 'B2B', 'Architects and construction firms', 350000, 'AI-powered building design and optimization platform with energy efficiency modeling, material optimization, cost estimation, and regulatory compliance checking.'),
('RentalTech', 'Real Estate', 'B2C', 'Property owners and renters', 190000, 'Smart rental management platform with tenant screening, digital lease agreements, automated rent collection, maintenance tracking, and property performance analytics.'),

-- Entertainment and Media
('StreamAI Media', 'Entertainment', 'B2C', 'Content consumers globally', 280000, 'AI-powered streaming platform with personalized content recommendations, adaptive streaming quality, and interactive features. Uses machine learning for user behavior analysis.'),
('GameGen AI', 'Entertainment', 'B2C', 'Gamers and game developers', 400000, 'AI-powered game development platform with procedural content generation, intelligent NPC behaviors, automated testing, and player experience optimization.'),
('ContentAI Creator', 'Entertainment', 'B2B', 'Content creators and media companies', 250000, 'AI-driven content creation and management platform with automated video editing, content personalization, audience analytics, and multi-channel distribution.'),
('MusicMatch AI', 'Entertainment', 'B2C', 'Music lovers and artists', 180000, 'AI-powered music discovery and recommendation platform with personalization, mood-based playlists, artist promotion, and event discovery. Features collaboration and community features.'),
('VR World Builder', 'Entertainment', 'B2B', 'VR developers and entertainment companies', 350000, 'AI-enhanced virtual world creation platform for VR experiences, games, and simulations. Features procedural world generation, intelligent NPCs, and immersive storytelling tools.'),

-- Food and Beverage
('FoodAI Delivery', 'Food & Beverage', 'B2C', 'Food enthusiasts and busy professionals', 200000, 'AI-powered food delivery and recipe platform with personalized meal recommendations, dietary tracking, and restaurant discovery. Features intelligent order optimization and delivery tracking.'),
('RestaurantAI', 'Food & Beverage', 'B2B', 'Restaurants and hospitality businesses', 250000, 'AI-powered restaurant management platform with inventory optimization, demand forecasting, menu engineering, and customer experience enhancement. Features automated marketing and loyalty programs.'),
('WineMatch AI', 'Food & Beverage', 'B2C', 'Wine enthusiasts and connoisseurs', 170000, 'AI-powered wine recommendation platform with personalized pairing suggestions, tasting notes, vineyard discovery, and intelligent sommelier assistance.');

-- ============================================
-- VERIFY THE DATA
-- ============================================

-- Count the projects
SELECT COUNT(*) as total_projects FROM projects;

-- View all projects (limited for display)
SELECT id, project_name, industry, business_model, target_market, budget, created_at 
FROM projects 
ORDER BY created_at DESC 
LIMIT 10;

-- View industry distribution
SELECT industry, COUNT(*) as count 
FROM projects 
GROUP BY industry 
ORDER BY count DESC;

-- View budget statistics
SELECT 
    COUNT(*) as total_projects,
    AVG(budget) as average_budget,
    MIN(budget) as min_budget,
    MAX(budget) as max_budget,
    SUM(budget) as total_budget
FROM projects;

-- ============================================
-- END OF MOCK DATA
-- ============================================