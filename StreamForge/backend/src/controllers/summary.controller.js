const Anthropic = require('@anthropic-ai/sdk');
const Video = require('../models/Video.model');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// POST /api/v1/videos/:id/summary
exports.generateSummary = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Video not found' },
      });
    }

    // Return cached summary if it already exists
    if (video.summary) {
      return res.json({ success: true, data: { summary: video.summary, cached: true } });
    }

    const descriptionSection = video.description
      ? `\n\nDescription: ${video.description}`
      : '';

    const prompt =
      `You are a concise video summariser. Based only on the title and description provided, ` +
      `write a 3–5 sentence summary of what this video is likely about. ` +
      `Do not speculate beyond what is given. Write in plain, accessible language.\n\n` +
      `Title: ${video.title}${descriptionSection}`;

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const summary = message.content[0].text.trim();

    video.summary = summary;
    await video.save();

    res.json({ success: true, data: { summary, cached: false } });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};
