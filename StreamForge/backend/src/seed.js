/**
 * StreamForge Demo Seed Script
 * Run: node src/seed.js
 *
 * Creates 6 demo creators + 3-5 videos each + cross-subscriptions.
 * Uses real public-domain thumbnail URLs so cards look great.
 * All demo accounts use password: demo1234
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User.model');
const Video = require('./models/Video.model');
const Subscription = require('./models/Subscription.model');
const Comment = require('./models/Comment.model');

const DEMO_PASSWORD = 'demo1234';

// Public-domain / Creative Commons thumbnails (Wikimedia / Unsplash-style stable URLs)
const THUMBNAILS = [
  'https://picsum.photos/seed/stream1/640/360',
  'https://picsum.photos/seed/stream2/640/360',
  'https://picsum.photos/seed/stream3/640/360',
  'https://picsum.photos/seed/stream4/640/360',
  'https://picsum.photos/seed/stream5/640/360',
  'https://picsum.photos/seed/stream6/640/360',
  'https://picsum.photos/seed/stream7/640/360',
  'https://picsum.photos/seed/stream8/640/360',
  'https://picsum.photos/seed/stream9/640/360',
  'https://picsum.photos/seed/stream10/640/360',
  'https://picsum.photos/seed/stream11/640/360',
  'https://picsum.photos/seed/stream12/640/360',
  'https://picsum.photos/seed/stream13/640/360',
  'https://picsum.photos/seed/stream14/640/360',
  'https://picsum.photos/seed/stream15/640/360',
  'https://picsum.photos/seed/stream16/640/360',
  'https://picsum.photos/seed/stream17/640/360',
  'https://picsum.photos/seed/stream18/640/360',
  'https://picsum.photos/seed/stream19/640/360',
  'https://picsum.photos/seed/stream20/640/360',
];

// A real, short, embeddable demo video URL (Big Buck Bunny clip — public domain)
const DEMO_VIDEO_URL = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
const DEMO_VIDEO_URL_2 = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4';
const DEMO_VIDEO_URL_3 = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
const DEMO_VIDEO_URL_4 = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4';
const VIDEO_URLS = [DEMO_VIDEO_URL, DEMO_VIDEO_URL_2, DEMO_VIDEO_URL_3, DEMO_VIDEO_URL_4];

const CREATORS = [
  {
    name: 'Alex Chen',
    email: 'alex.chen@demo.com',
    videos: [
      { title: 'Building a Full-Stack App in 1 Hour', category: 'Technology', views: 42300, tags: ['coding', 'react', 'nodejs'], description: 'In this video I walk you through building a complete full-stack application from scratch using React and Node.js.\n\n0:00 Intro\n2:30 Project setup\n8:00 Backend API\n22:00 Frontend UI\n45:00 Deployment' },
      { title: 'React 19 — Everything New Explained', category: 'Technology', views: 31500, tags: ['react', 'javascript', 'frontend'], description: 'React 19 is here! Let\'s go through every new feature, what changed, and what it means for your projects.' },
      { title: 'TypeScript Tips I Wish I Knew Earlier', category: 'Technology', views: 18700, tags: ['typescript', 'coding'], description: 'These TypeScript patterns will make your code so much cleaner. I learned these the hard way.' },
      { title: 'My Dev Setup in 2025', category: 'Technology', views: 55200, tags: ['productivity', 'coding', 'tools'], description: 'Full walkthrough of my terminal, editor, extensions, and hardware setup.' },
    ],
  },
  {
    name: 'Priya Sharma',
    email: 'priya.sharma@demo.com',
    videos: [
      { title: 'How I Study 10 Hours Without Getting Tired', category: 'Education', views: 89100, tags: ['study', 'productivity', 'focus'], description: 'The exact techniques I use to maintain deep focus for hours. This changed my academic life.\n\n0:00 Intro\n3:00 The Pomodoro myth\n10:00 My actual system\n25:00 Environment setup' },
      { title: 'Feynman Technique Explained Simply', category: 'Education', views: 37400, tags: ['learning', 'study'], description: 'The Feynman Technique is the single most powerful learning method. Here\'s how to actually use it.' },
      { title: 'Note-Taking System That Actually Works', category: 'Education', views: 61200, tags: ['notes', 'study', 'productivity'], description: 'My Obsidian + Notion workflow for keeping knowledge organised and actionable.' },
      { title: 'Why Most People Never Learn Effectively', category: 'Education', views: 24800, tags: ['learning', 'mindset'], description: 'The science of learning versus the myths — backed by cognitive psychology research.' },
      { title: 'Morning Routine for Deep Work', category: 'Education', views: 44600, tags: ['productivity', 'focus', 'morning'], description: 'How I structure my mornings to maximise creative output before noon.' },
    ],
  },
  {
    name: 'Marcus Williams',
    email: 'marcus.williams@demo.com',
    videos: [
      { title: 'Lo-Fi Hip Hop Mix — 2 Hours Study Music', category: 'Music', views: 203000, tags: ['lofi', 'music', 'study', 'chill'], description: 'Two hours of chill lo-fi beats to help you focus, study, or relax. No ads, no interruptions.' },
      { title: 'Making a Beat From Scratch (FL Studio)', category: 'Music', views: 47800, tags: ['music', 'production', 'beatmaking'], description: 'Full beat-making session from empty project to finished track. Every step explained.' },
      { title: 'Chord Progressions That Always Work', category: 'Music', views: 38200, tags: ['music', 'theory', 'chords'], description: 'The 5 chord progressions used in 80% of popular songs — and how to use them creatively.' },
    ],
  },
  {
    name: 'Sofia Rodriguez',
    email: 'sofia.rodriguez@demo.com',
    videos: [
      { title: 'Backpacking Southeast Asia on $30/day', category: 'Travel', views: 126000, tags: ['travel', 'backpacking', 'asia', 'budget'], description: 'Everything I wish someone had told me before my 3-month backpacking trip across Vietnam, Thailand, and Cambodia.\n\n0:00 Intro\n4:00 Budgeting\n15:00 Best hostels\n30:00 Hidden gems' },
      { title: 'Japan in 2 Weeks — Complete Itinerary', category: 'Travel', views: 94300, tags: ['japan', 'travel', 'itinerary'], description: 'The perfect 2-week Japan trip. Tokyo, Kyoto, Osaka, and hidden spots most tourists miss.' },
      { title: 'Solo Female Travel Safety Tips', category: 'Travel', views: 72100, tags: ['travel', 'safety', 'solo'], description: 'Practical, honest advice from 5 years of solo travel across 40+ countries.' },
      { title: 'Best Street Food in Bangkok', category: 'Travel', views: 58400, tags: ['food', 'travel', 'bangkok'], description: 'A full day eating nothing but street food in Bangkok — here\'s every dish and where to find it.' },
    ],
  },
  {
    name: 'Jordan Kim',
    email: 'jordan.kim@demo.com',
    videos: [
      { title: 'Minecraft Hardcore World — Day 100', category: 'Gaming', views: 178000, tags: ['minecraft', 'gaming', 'hardcore'], description: 'I survived 100 days in Minecraft Hardcore mode. Here\'s everything that happened.' },
      { title: 'Every Elden Ring Boss Ranked Worst to Best', category: 'Gaming', views: 92400, tags: ['eldenring', 'gaming', 'review'], description: 'All 157 bosses in Elden Ring ranked from punishing to incredible. Controversial opinions included.' },
      { title: 'How to Actually Get Good at FPS Games', category: 'Gaming', views: 64700, tags: ['fps', 'gaming', 'tips'], description: 'The fundamentals of FPS improvement that most guides skip. From aim to game sense.' },
      { title: 'I Played Every Xbox Game Pass Game', category: 'Gaming', views: 43100, tags: ['gaming', 'xbox', 'gamepass'], description: 'Yes, every single one. Here are the hidden gems and the ones to avoid.' },
      { title: 'Speedrunning My Favourite Game for 30 Days', category: 'Gaming', views: 31500, tags: ['speedrun', 'gaming', 'challenge'], description: 'I committed to daily speedrun practice for a month. Here\'s what I learned.' },
    ],
  },
  {
    name: 'Aisha Okonkwo',
    email: 'aisha.okonkwo@demo.com',
    videos: [
      { title: 'How I Built a $5K/Month Side Hustle', category: 'Education', views: 148000, tags: ['business', 'income', 'entrepreneur'], description: 'The full story of how I built a profitable side business while working full-time — no fluff, just what actually worked.' },
      { title: 'Investing for Beginners in 2025', category: 'Education', views: 87300, tags: ['investing', 'finance', 'beginners'], description: 'Everything you need to start investing even if you have no experience. Plain English, no jargon.' },
      { title: 'A Week in My Life as a Freelance Designer', category: 'Other', views: 34200, tags: ['freelance', 'design', 'vlog'], description: 'Client calls, project work, creative blocks, and how I manage it all.' },
    ],
  },
];

const DEMO_COMMENTS = [
  'This is exactly what I needed, thank you!',
  'Great content as always 🔥',
  'I\'ve watched this 3 times and learn something new each time.',
  'Finally someone explains this clearly!',
  'Subscribed immediately after watching this.',
  'This changed how I think about the whole topic.',
  'More videos like this please!',
  'Brilliant. Simple and effective.',
  'The production quality is amazing.',
  'I shared this with my whole team.',
];

async function seed() {
  const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/streamforge';
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected.\n');

  // Remove existing demo accounts (safe — keyed by @demo.com email)
  const demoEmails = CREATORS.map((c) => c.email);
  const existingDemos = await User.find({ email: { $in: demoEmails } }).select('_id');
  if (existingDemos.length > 0) {
    const ids = existingDemos.map((u) => u._id);
    await Video.deleteMany({ owner: { $in: ids } });
    await Subscription.deleteMany({ $or: [{ subscriber: { $in: ids } }, { creator: { $in: ids } }] });
    await Comment.deleteMany({ author: { $in: ids } });
    await User.deleteMany({ _id: { $in: ids } });
    console.log(`Removed ${existingDemos.length} existing demo users and their data.\n`);
  }

  // Hash password once — insert via collection to bypass the pre-save bcrypt hook
  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 12);

  const createdUsers = [];
  let thumbIdx = 0;

  for (const creator of CREATORS) {
    const doc = {
      _id: new mongoose.Types.ObjectId(),
      name: creator.name,
      email: creator.email,
      password: hashedPassword,
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await User.collection.insertOne(doc);
    const user = await User.findById(doc._id);
    createdUsers.push({ user, creator });
    console.log(`Created user: ${creator.name} (${creator.email})`);
  }

  // Create videos
  const allVideoIds = [];
  for (const { user, creator } of createdUsers) {
    for (let i = 0; i < creator.videos.length; i++) {
      const vData = creator.videos[i];
      const videoUrl = VIDEO_URLS[i % VIDEO_URLS.length];
      const thumb = THUMBNAILS[thumbIdx % THUMBNAILS.length];
      thumbIdx++;

      // Fake some likes
      const likeCount = Math.floor(vData.views * 0.04);
      const fakeLikeIds = Array.from({ length: Math.min(likeCount, 5) }, () => new mongoose.Types.ObjectId());

      const video = await Video.create({
        title: vData.title,
        description: vData.description || '',
        owner: user._id,
        filePath: 'uploads/demo.mp4',
        fileUrl: videoUrl,
        thumbnailUrl: thumb,
        category: vData.category,
        tags: vData.tags || [],
        views: vData.views,
        likes: fakeLikeIds,
        status: 'ready',
      });
      allVideoIds.push(video._id);
    }
    console.log(`  Created ${creator.videos.length} videos for ${creator.name}`);
  }

  // Cross-subscribe: each creator subscribes to 2–3 others
  console.log('\nCreating subscriptions...');
  for (let i = 0; i < createdUsers.length; i++) {
    const subscriber = createdUsers[i].user;
    // Subscribe to the next 3 creators (wrapping around)
    for (let j = 1; j <= 3; j++) {
      const creator = createdUsers[(i + j) % createdUsers.length].user;
      await Subscription.create({ subscriber: subscriber._id, creator: creator._id });
    }
  }
  console.log('Subscriptions created.');

  // Add a couple of comments to each video
  console.log('Adding comments...');
  const allVideos = await Video.find({ owner: { $in: createdUsers.map((c) => c.user._id) } });
  for (const video of allVideos) {
    const numComments = Math.floor(Math.random() * 3) + 1;
    for (let k = 0; k < numComments; k++) {
      const commenter = createdUsers[k % createdUsers.length].user;
      if (commenter._id.toString() === video.owner.toString()) continue;
      const body = DEMO_COMMENTS[Math.floor(Math.random() * DEMO_COMMENTS.length)];
      await Comment.create({ videoId: video._id, author: commenter._id, body });
    }
  }
  console.log('Comments added.');

  console.log('\n✅ Seed complete!');
  console.log('─'.repeat(50));
  console.log('Demo accounts (password: demo1234):');
  for (const { user } of createdUsers) {
    console.log(`  ${user.email}`);
  }
  console.log('─'.repeat(50));

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
