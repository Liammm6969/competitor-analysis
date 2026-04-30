const Training = require('../models/training.model');
const Competitor = require('../models/competitor.model');

exports.getAnalytics = async (req, res) => {
  try {
    const trainings = await Training.find().populate('competitor_id', 'name category');
    const competitors = await Competitor.find();

    // Total counts
    const totalTrainings = trainings.length;
    const totalCompetitors = competitors.length;

    // Average price
    const prices = trainings.filter((t) => t.price > 0).map((t) => t.price);
    const avgPrice = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;

    // Price range
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

    // Most common topics (based on title words)
    const wordCount = {};
    const stopWords = new Set(['the', 'and', 'for', 'in', 'on', 'to', 'a', 'an', 'of', 'with', 'is', 'at', 'by']);
    trainings.forEach((t) => {
      const words = t.title.toLowerCase().split(/\s+/);
      words.forEach((w) => {
        const cleaned = w.replace(/[^a-z0-9]/g, '');
        if (cleaned.length > 2 && !stopWords.has(cleaned)) {
          wordCount[cleaned] = (wordCount[cleaned] || 0) + 1;
        }
      });
    });
    const topTopics = Object.entries(wordCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([topic, count]) => ({ topic, count }));

    // Trainings per month
    const monthlyData = {};
    trainings.forEach((t) => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[key] = (monthlyData[key] || 0) + 1;
    });
    const trainingsPerMonth = Object.entries(monthlyData)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, count]) => ({ month, count }));

    // Delivery mode distribution
    const deliveryModes = {};
    trainings.forEach((t) => {
      deliveryModes[t.delivery_mode] = (deliveryModes[t.delivery_mode] || 0) + 1;
    });
    const deliveryDistribution = Object.entries(deliveryModes).map(([mode, count]) => ({ mode, count }));

    // Competitor activity (trainings per competitor)
    const competitorActivity = {};
    trainings.forEach((t) => {
      const name = t.competitor_id?.name || 'Unknown';
      competitorActivity[name] = (competitorActivity[name] || 0) + 1;
    });
    const competitorRanking = Object.entries(competitorActivity)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));

    // Audience distribution
    const audienceData = {};
    trainings.forEach((t) => {
      audienceData[t.audience] = (audienceData[t.audience] || 0) + 1;
    });
    const audienceDistribution = Object.entries(audienceData).map(([audience, count]) => ({ audience, count }));

    res.json({
      totalTrainings,
      totalCompetitors,
      avgPrice,
      minPrice,
      maxPrice,
      topTopics,
      trainingsPerMonth,
      deliveryDistribution,
      competitorRanking,
      audienceDistribution,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
