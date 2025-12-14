# Tether Intelligence - AI Computer Agent

🤖 **A cutting-edge AI-powered computer control system that enables autonomous agents to interact with computers like humans through natural language instructions.**

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![Gemini AI](https://img.shields.io/badge/Gemini%20AI-2.5-blue)](https://ai.google.dev/gemini-api/docs/computer-use)
[![VNC](https://img.shields.io/badge/VNC-Remote%20Access-green)](https://github.com/novnc/noVNC)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)

## 🌟 Features

### 🧠 **Intelligent Computer Control**
- **Gemini 2.5 Computer Use**: Powered by Google's latest AI model for human-like computer interaction
- **Real-time Screen Understanding**: AI analyzes screenshots to understand interface elements
- **Multi-modal Actions**: Mouse clicks, keyboard input, scrolling, navigation, and more

### 🖥️ **Remote Desktop Integration**
- **VNC Support**: Full VNC protocol implementation for remote computer access
- **Web-based Interface**: Access the agent through any modern web browser
- **Live Streaming**: Real-time video stream of the controlled computer

### 🛡️ **Safety & Security**
- **Human-in-the-Loop**: Confirmation required for high-risk operations
- **Action Validation**: AI provides reasoning for each proposed action
- **Safety Boundaries**: Configurable restrictions and approval workflows

### 📊 **Real-time Monitoring**
- **Agent Thought Stream**: Live visualization of AI reasoning process
- **Action History**: Complete audit trail of all agent actions
- **Task Queue Management**: Organize and track multiple tasks
- **Performance Metrics**: Monitor agent efficiency and accuracy

### 🎯 **Advanced Capabilities**
- **Vision Overlay**: See AI targeting and UI element detection
- **Multi-modal Input**: Accept text, images, and files as task input
- **Context Awareness**: Agent remembers previous actions and maintains context
- **Error Recovery**: Automatic retry mechanisms and graceful failure handling

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+**
- **npm or yarn**
- **Gemini API Key** from [Google AI Studio](https://ai.google.dev/)
- **VNC Server** (optional, for testing)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/sultanafariabd/Tether-intelligence.git
cd Tether-intelligence
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
# Edit .env.local with your API keys and configuration
```

4. **Configure Gemini AI**
- Get your API key from [Google AI Studio](https://ai.google.dev/)
- Add it to your `.env.local` file

5. **Set up VNC server** (optional, for testing)
```bash
chmod +x setup_vnc.sh
./setup_vnc.sh
```

6. **Start the development server**
```bash
npm run dev
```

7. **Open your browser**
Navigate to `http://localhost:3000`

## 🏗️ Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Web Interface (Next.js)                   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │ VNC Client      │  │ Gemini AI       │  │ Task        │ │
│  │ (noVNC)         │  │ Computer Use    │  │ Manager     │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                     WebSocket Server                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │ VNC Server      │  │ AI Agent        │  │ Safety      │ │
│  │ (Remote OS)     │  │ Executor        │  │ System      │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **AI Engine**: Google Gemini 2.5 Computer Use API
- **Remote Access**: VNC Protocol, noVNC Client
- **Styling**: Custom CSS with dark theme design system
- **State Management**: React hooks and context
- **Real-time Communication**: WebSockets

## 🎮 Usage

### Starting a Session

1. **Configure VNC Connection**
   - Host: `localhost` (for local testing)
   - Port: `5900` (default VNC port)
   - Password: (if configured)

2. **Start Agent Session**
   - Click "Start Session" in the top bar
   - The agent will connect to the VNC server
   - Status indicators will show connection state

### Giving Tasks to the Agent

1. **Natural Language Input**
   - Use the task planner at the bottom right
   - Describe what you want the agent to do
   - Example: "Open browser and search for latest AI news"

2. **Multi-modal Input**
   - Upload screenshots for context
   - Paste images from clipboard
   - Include files for reference

### Monitoring Agent Activity

1. **Thought Stream** (Right Panel)
   - Real-time visualization of AI reasoning
   - Shows observations, reasoning, and actions
   - Live updates as the agent works

2. **VNC Viewport** (Center)
   - Live video stream of the controlled computer
   - Vision overlay shows AI targeting
   - Agent cursor indicates intended actions

3. **Safety Confirmations**
   - High-risk actions require approval
   - AI explains reasoning before execution
   - 30-second timeout for responses

### Example Tasks

```
✅ "Open calculator and solve 15 * 23"
✅ "Go to GitHub and create a new repository called 'ai-projects'"
✅ "Navigate to YouTube and find trending technology videos"
✅ "Open email client and check for unread messages"
✅ "Search for the latest AI news and summarize top 3 articles"
```

## 🔧 Configuration

### Environment Variables

```bash
# Gemini AI Configuration
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL_ID=gemini-2.5-computer-use-preview-10-2025

# VNC Server Configuration
VNC_HOST=localhost
VNC_PORT=5900
VNC_PASSWORD=your_password
VNC_QUALITY=6
VNC_COMPRESSION=2
```

### VNC Server Setup

For testing purposes, a simple VNC server setup is included:

```bash
# Run the setup script
./setup_vnc.sh

# Start VNC server
~/start_vnc.sh

# Connect with VNC viewer
vncviewer localhost:5900
```

### Advanced Configuration

- **Screen Resolution**: Configure in VNC setup (default: 1440x900)
- **Action Sensitivity**: Adjust in component configurations
- **Safety Levels**: Modify safety confirmation thresholds
- **Performance**: Tune VNC quality and compression settings

## 🛡️ Safety Features

### Human-in-the-Loop Protection

- **Risk Assessment**: AI evaluates action risk levels
- **Confirmation Required**: High-risk operations need user approval
- **Timeout Mechanism**: 30-second response window with auto-deny
- **Audit Trail**: Complete logging of all actions and approvals

### Action Categories

- **Low Risk**: Regular navigation and basic interactions
- **Medium Risk**: Form submissions and file operations
- **High Risk**: System commands, deletions, financial actions

### Security Best Practices

- Use isolated/sandboxed environments for testing
- Configure proper VNC authentication
- Limit network access to trusted systems
- Monitor and log all agent activities

## 🎯 API Reference

### Gemini Computer Use Actions

The agent supports the following computer actions:

| Action | Description | Parameters |
|--------|-------------|------------|
| `click_at` | Click at specific coordinates | `x`, `y` |
| `type_text_at` | Type text at coordinates | `x`, `y`, `text`, `press_enter` |
| `hover_at` | Hover mouse at coordinates | `x`, `y` |
| `key_combination` | Press keyboard keys | `keys` |
| `navigate` | Navigate to URL | `url` |
| `scroll_document` | Scroll page | `direction` |
| `scroll_at` | Scroll specific element | `x`, `y`, `direction`, `magnitude` |
| `drag_and_drop` | Drag and drop | `x`, `y`, `destination_x`, `destination_y` |
| `open_web_browser` | Open browser | (none) |
| `wait_5_seconds` | Pause execution | (none) |

### WebSocket Events

- `agent_action`: AI agent performs an action
- `vnc_event`: VNC connection status update
- `task_update`: Task status change
- `safety_request`: Safety confirmation required
- `system`: System-level notifications

## 🚀 Deployment

### Production Deployment

1. **Environment Setup**
```bash
# Set production environment
NODE_ENV=production
NEXT_PUBLIC_APP_NAME="Tether Intelligence"
```

2. **Build Application**
```bash
npm run build
```

3. **Start Production Server**
```bash
npm start
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Security Considerations

- Use HTTPS in production
- Implement proper authentication
- Configure VNC over SSH or VPN
- Use sandboxed environments
- Monitor access logs

## 🔍 Troubleshooting

### Common Issues

**VNC Connection Failed**
- Check VNC server is running
- Verify host and port configuration
- Ensure firewall allows VNC traffic

**Gemini API Errors**
- Verify API key is correct
- Check API quotas and billing
- Ensure model ID is supported

**Actions Not Executing**
- Check browser console for errors
- Verify WebSocket connection
- Ensure VNC server accepts input

### Debug Mode

Enable debug logging:
```bash
DEBUG=true npm run dev
```

### Performance Optimization

- Adjust VNC quality settings
- Reduce screen resolution for better performance
- Use local VNC server for lower latency
- Monitor memory usage in browser dev tools

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Code Style

- Use TypeScript for type safety
- Follow the existing component patterns
- Add JSDoc comments for functions
- Use the established CSS class naming convention

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Gemini Team** for the Computer Use API
- **noVNC Project** for the web-based VNC client
- **Next.js Team** for the excellent React framework
- **Open Source Community** for the amazing tools and libraries

## 📞 Support

- **Documentation**: Check this README and inline code comments
- **Issues**: Report bugs on GitHub Issues
- **Discussions**: Join our GitHub Discussions
- **Security**: Report security issues privately

---

**Built with ❤️ by the Tether Intelligence Team**

*Empowering AI to control computers like humans - One action at a time.*