const fakeAIReply = async (prompt) => {
  return `AI: I read "${prompt}" — here's a friendly reply.`;
};

const aiChat = async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ 
        success: false, 
        message: 'Prompt is required' 
      });
    }
    
    const reply = await fakeAIReply(prompt);
    res.json({ 
      success: true, 
      data: { reply } 
    });
  } catch (err) { 
    console.error('AI chat error:', err); 
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    }); 
  }
};

module.exports = { aiChat };
